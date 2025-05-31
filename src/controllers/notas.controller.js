// src/controllers/notas.controller.js
// ! Controlador para la entidad Notas
// * Aquí gestiono las notas asociadas a equipos, mantenimientos o usuarios: creación, consulta, actualización y eliminación.
// * Este módulo valida relaciones, fechas y asegura que las notas sean trazables y útiles para auditoría.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Función de ayuda para validar formato de fecha (YYYY-MM-DD) de forma segura (UTC)
// * Devuelve true si el string coincide con el formato y es una fecha real válida.
function isValidDate(dateString) {
    // * Permito null/vacío si el campo no es obligatorio.
    if (!dateString) return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// ===============================================================
// * Funciones controladoras para cada endpoint de notas
// ===============================================================

// * [GET] /api/notas - Trae todas las notas con JOINs a equipos, mantenimientos y usuarios
const getAllNotas = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada nota
    const sql = `
      SELECT
        n.id,
        n.titulo,
        n.contenido,
        n.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        n.id_mantenimiento,
        m.fecha_inicio AS mantenimiento_fecha_inicio,
        n.id_usuario_sistema,
        us.username AS usuario_creador,
        n.fecha_registro,
        n.fecha_actualizacion
      FROM notas AS n
      LEFT JOIN equipos AS e ON n.id_equipo = e.id
      LEFT JOIN mantenimientos AS m ON n.id_mantenimiento = m.id
      LEFT JOIN usuarios_sistema AS us ON n.id_usuario_sistema = us.id
    `;
    const notas = await query(sql);
    res.status(200).json(notas);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las notas:', error);
    next(error);
  }
};

// * [GET] /api/notas/:id - Trae una nota específica por su ID (con relaciones)
const getNotaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        n.id,
        n.titulo,
        n.contenido,
        n.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        n.id_mantenimiento,
        m.fecha_inicio AS mantenimiento_fecha_inicio,
        n.id_usuario_sistema,
        us.username AS usuario_creador,
        n.fecha_registro,
        n.fecha_actualizacion
      FROM notas AS n
      LEFT JOIN equipos AS e ON n.id_equipo = e.id
      LEFT JOIN mantenimientos AS m ON n.id_mantenimiento = m.id
      LEFT JOIN usuarios_sistema AS us ON n.id_usuario_sistema = us.id
      WHERE n.id = ?
    `;
    const params = [id];
    const notas = await query(sql, params);
    if (notas.length === 0) {
      res.status(404).json({ message: `Nota con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(notas[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener nota con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/notas - Crea una nueva nota con validaciones
const createNota = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. titulo y contenido son obligatorios
    const {
        titulo, contenido, id_equipo, id_mantenimiento, id_usuario_sistema
    } = req.body;
    // * Validaciones de campos obligatorios
    if (!titulo || !contenido) {
      return res.status(400).json({ message: 'Los campos titulo y contenido son obligatorios.' });
    }
    if (titulo.trim() === '') {
      return res.status(400).json({ message: 'El campo titulo no puede estar vacío.' });
    }
    if (contenido.trim() === '') {
      return res.status(400).json({ message: 'El campo contenido no puede estar vacío.' });
    }
    // * Validar existencia de FKs si se proporcionan
    if (id_equipo !== undefined && id_equipo !== null) {
      const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
      if (equipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
      }
    }
    if (id_mantenimiento !== undefined && id_mantenimiento !== null) {
      const mantenimientoExists = await query('SELECT id FROM mantenimientos WHERE id = ?', [id_mantenimiento]);
      if (mantenimientoExists.length === 0) {
        return res.status(400).json({ message: `El ID de mantenimiento ${id_mantenimiento} no es válido.` });
      }
    }
    if (id_usuario_sistema !== undefined && id_usuario_sistema !== null) {
      const usuarioExists = await query('SELECT id FROM usuarios_sistema WHERE id = ?', [id_usuario_sistema]);
      if (usuarioExists.length === 0) {
        return res.status(400).json({ message: `El ID de usuario_sistema ${id_usuario_sistema} no es válido.` });
      }
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO notas (titulo, contenido';
    const values = [titulo, contenido];
    const placeholders = ['?', '?'];
    if (id_equipo !== undefined && id_equipo !== null) { sql += ', id_equipo'; placeholders.push('?'); values.push(id_equipo); }
    if (id_mantenimiento !== undefined && id_mantenimiento !== null) { sql += ', id_mantenimiento'; placeholders.push('?'); values.push(id_mantenimiento); }
    if (id_usuario_sistema !== undefined && id_usuario_sistema !== null) { sql += ', id_usuario_sistema'; placeholders.push('?'); values.push(id_usuario_sistema); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newNotaId = result.insertId;
    res.status(201).json({
      message: 'Nota creada exitosamente',
      id: newNotaId,
      titulo: titulo
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear nota:', error);
    next(error);
  }
};

// * [PUT] /api/notas/:id - Actualiza una nota por su ID
const updateNota = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
        titulo, contenido, id_equipo, id_mantenimiento, id_usuario_sistema
    } = req.body;
    // * Validar que al menos un campo sea enviado
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    if (titulo !== undefined && titulo !== null && titulo.trim() === '') {
      return res.status(400).json({ message: 'El campo titulo no puede estar vacío.' });
    }
    if (contenido !== undefined && contenido !== null && contenido.trim() === '') {
      return res.status(400).json({ message: 'El campo contenido no puede estar vacío.' });
    }
    // * Validar existencia de FKs si se intenta actualizar
    if (id_equipo !== undefined && id_equipo !== null) {
      const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
      if (equipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
      }
    } else if (id_equipo === null) {
      return res.status(400).json({ message: 'El campo id_equipo no puede ser nulo.' });
    }
    if (id_mantenimiento !== undefined && id_mantenimiento !== null) {
      const mantenimientoExists = await query('SELECT id FROM mantenimientos WHERE id = ?', [id_mantenimiento]);
      if (mantenimientoExists.length === 0) {
        return res.status(400).json({ message: `El ID de mantenimiento ${id_mantenimiento} no es válido.` });
      }
    } else if (id_mantenimiento === null) {
      return res.status(400).json({ message: 'El campo id_mantenimiento no puede ser nulo.' });
    }
    if (id_usuario_sistema !== undefined && id_usuario_sistema !== null) {
      const usuarioExists = await query('SELECT id FROM usuarios_sistema WHERE id = ?', [id_usuario_sistema]);
      if (usuarioExists.length === 0) {
        return res.status(400).json({ message: `El ID de usuario_sistema ${id_usuario_sistema} no es válido.` });
      }
    } else if (id_usuario_sistema === null) {
      return res.status(400).json({ message: 'El campo id_usuario_sistema no puede ser nulo.' });
    }
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE notas SET ';
    const params = [];
    const updates = [];
    if (titulo !== undefined) { updates.push('titulo = ?'); params.push(titulo); }
    if (contenido !== undefined) { updates.push('contenido = ?'); params.push(contenido); }
    if (id_equipo !== undefined) { updates.push('id_equipo = ?'); params.push(id_equipo); }
    if (id_mantenimiento !== undefined) { updates.push('id_mantenimiento = ?'); params.push(id_mantenimiento); }
    if (id_usuario_sistema !== undefined) { updates.push('id_usuario_sistema = ?'); params.push(id_usuario_sistema); }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Nota con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Nota con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar nota con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [DELETE] /api/notas/:id - Elimina una nota por su ID
const deleteNota = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM notas WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Nota con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Nota con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar nota con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllNotas,
  getNotaById,
  createNota,
  updateNota,
  deleteNota,
};