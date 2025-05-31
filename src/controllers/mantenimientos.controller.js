// src/controllers/mantenimientos.controller.js
// ! Controlador para la entidad Mantenimientos
// * Registro y gestión del historial de servicio de los equipos: creación, consulta, actualización y eliminación de mantenimientos.
// * Este módulo valida fechas, costos y relaciones con equipos y status, asegurando la integridad de los datos.

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
// * Funciones controladoras para cada endpoint de mantenimientos
// ===============================================================

// * [GET] /api/mantenimientos - Trae todos los mantenimientos con JOINs a equipos y status
const getAllMantenimientos = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada mantenimiento
    const sql = `
      SELECT
        m.id,
        m.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        e.nombre_equipo AS equipo_nombre,
        m.fecha_inicio,
        m.fecha_fin,
        m.diagnostico,
        m.solucion,
        m.costo,
        m.proveedor,
        m.fecha_registro,
        m.fecha_actualizacion,
        m.id_status,
        st.nombre_status AS status_nombre
      FROM mantenimientos AS m
      JOIN equipos AS e ON m.id_equipo = e.id
      JOIN status AS st ON m.id_status = st.id
    `;
    const mantenimientos = await query(sql);
    res.status(200).json(mantenimientos);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los mantenimientos:', error);
    next(error);
  }
};

// * [GET] /api/mantenimientos/:id - Trae un mantenimiento específico por su ID (con relaciones)
const getMantenimientoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
       SELECT
        m.id,
        m.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        e.nombre_equipo AS equipo_nombre,
        m.fecha_inicio,
        m.fecha_fin,
        m.diagnostico,
        m.solucion,
        m.costo,
        m.proveedor,
        m.fecha_registro,
        m.fecha_actualizacion,
        m.id_status,
        st.nombre_status AS status_nombre
      FROM mantenimientos AS m
      JOIN equipos AS e ON m.id_equipo = e.id
      JOIN status AS st ON m.id_status = st.id
      WHERE m.id = ?
    `;
    const params = [id];
    const mantenimientos = await query(sql, params);
    if (mantenimientos.length === 0) {
      res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(mantenimientos[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener registro de mantenimiento con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/mantenimientos - Crea un nuevo mantenimiento con validaciones
const createMantenimiento = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. id_equipo y fecha_inicio son obligatorios
    const {
        id_equipo, fecha_inicio, fecha_fin, diagnostico, solucion,
        costo, proveedor, id_status
    } = req.body;
    // * Validaciones de campos obligatorios y formato de fechas
    if (id_equipo === undefined || !fecha_inicio) {
      return res.status(400).json({ message: 'Los campos id_equipo y fecha_inicio son obligatorios.' });
    }
    if (!isValidDate(fecha_inicio)) {
      return res.status(400).json({ message: 'El formato de fecha_inicio debe ser YYYY-MM-DD.' });
    }
    if (fecha_fin !== undefined && fecha_fin !== null) {
      if (!isValidDate(fecha_fin)) {
        return res.status(400).json({ message: 'El formato de fecha_fin debe ser YYYY-MM-DD.' });
      }
      if (new Date(fecha_fin) < new Date(fecha_inicio)) {
        return res.status(400).json({ message: 'La fecha_fin no puede ser anterior a la fecha_inicio.' });
      }
    } else if (fecha_fin === '') {
      fecha_fin = null;
    }
    // * Validar existencia de FKs
    const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
    if (equipoExists.length === 0) {
      return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
    }
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Validar costo si se proporciona
    if (costo !== undefined && costo !== null) {
      if (typeof costo !== 'number' && typeof costo !== 'string' || !isFinite(parseFloat(costo))) {
        return res.status(400).json({ message: 'El campo costo debe ser un número válido.' });
      }
    } else if (costo === '') {
      costo = null;
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO mantenimientos (id_equipo, fecha_inicio';
    const values = [id_equipo, fecha_inicio];
    const placeholders = ['?', '?'];
    if (fecha_fin !== undefined && fecha_fin !== null) { sql += ', fecha_fin'; placeholders.push('?'); values.push(fecha_fin); }
    if (diagnostico !== undefined && diagnostico !== null) { sql += ', diagnostico'; placeholders.push('?'); values.push(diagnostico === null || diagnostico.trim() === '' ? null : diagnostico); }
    if (solucion !== undefined && solucion !== null) { sql += ', solucion'; placeholders.push('?'); values.push(solucion === null || solucion.trim() === '' ? null : solucion); }
    if (costo !== undefined && costo !== null) { sql += ', costo'; placeholders.push('?'); values.push(costo); }
    if (proveedor !== undefined && proveedor !== null) { sql += ', proveedor'; placeholders.push('?'); values.push(proveedor === null || proveedor.trim() === '' ? null : proveedor); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newMantenimientoId = result.insertId;
    res.status(201).json({
      message: 'Registro de mantenimiento creado exitosamente',
      id: newMantenimientoId,
      id_equipo: id_equipo,
      fecha_inicio: fecha_inicio
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear registro de mantenimiento:', error);
    next(error);
  }
};

// * [PUT] /api/mantenimientos/:id - Actualiza un mantenimiento por su ID
const updateMantenimiento = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
        id_equipo, fecha_inicio, fecha_fin, diagnostico, solucion,
        costo, proveedor, id_status
    } = req.body;
    // * Validar que al menos un campo sea enviado
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    if (fecha_inicio !== undefined && fecha_inicio !== null && fecha_inicio.trim() === '') {
      return res.status(400).json({ message: 'El campo fecha_inicio no puede estar vacío.' });
    }
    if (fecha_inicio !== undefined && fecha_inicio !== null) {
      if (!isValidDate(fecha_inicio)) {
        return res.status(400).json({ message: 'El formato de fecha_inicio debe ser YYYY-MM-DD.' });
      }
    }
    if (fecha_fin !== undefined && fecha_fin !== null) {
      if (!isValidDate(fecha_fin)) {
        return res.status(400).json({ message: 'El formato de fecha_fin debe ser YYYY-MM-DD.' });
      }
    } else if (fecha_fin === '') {
      fecha_fin = null;
    }
    // * Validar relación entre fecha_inicio y fecha_fin SI AMBAS están presentes
    let final_fecha_inicio = fecha_inicio;
    let final_fecha_fin = fecha_fin;
    if (final_fecha_inicio === undefined || final_fecha_fin === undefined) {
      const currentMantenimiento = await query('SELECT fecha_inicio, fecha_fin FROM mantenimientos WHERE id = ?', [id]);
      if (currentMantenimiento.length === 0) {
        return res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
      }
      if (final_fecha_inicio === undefined) final_fecha_inicio = currentMantenimiento[0].fecha_inicio;
      if (final_fecha_fin === undefined) final_fecha_fin = currentMantenimiento[0].fecha_fin;
    }
    const dateInicio = final_fecha_inicio ? new Date(final_fecha_inicio) : null;
    const dateFin = final_fecha_fin ? new Date(final_fecha_fin) : null;
    if (dateInicio && dateFin && dateFin < dateInicio) {
      return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }
    if (id_equipo !== undefined && id_equipo !== null) {
      const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
      if (equipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
      }
    } else if (id_equipo === null) {
      return res.status(400).json({ message: 'El campo id_equipo no puede ser nulo.' });
    }
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    if (costo !== undefined && costo !== null) {
      if (typeof costo !== 'number' && typeof costo !== 'string' || !isFinite(parseFloat(costo))) {
        return res.status(400).json({ message: 'El campo costo debe ser un número válido.' });
      }
    } else if (costo === '') {
      costo = null;
    }
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE mantenimientos SET ';
    const params = [];
    const updates = [];
    if (id_equipo !== undefined) { updates.push('id_equipo = ?'); params.push(id_equipo); }
    if (fecha_inicio !== undefined) { updates.push('fecha_inicio = ?'); params.push(fecha_inicio); }
    if (fecha_fin !== undefined) { updates.push('fecha_fin = ?'); params.push(fecha_fin === null ? null : fecha_fin); }
    if (diagnostico !== undefined) { updates.push('diagnostico = ?'); params.push(diagnostico === null || diagnostico.trim() === '' ? null : diagnostico); }
    if (solucion !== undefined) { updates.push('solucion = ?'); params.push(solucion === null || solucion.trim() === '' ? null : solucion); }
    if (costo !== undefined) { updates.push('costo = ?'); params.push(costo); }
    if (proveedor !== undefined) { updates.push('proveedor = ?'); params.push(proveedor === null || proveedor.trim() === '' ? null : proveedor); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Registro de mantenimiento con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar registro de mantenimiento con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [DELETE] /api/mantenimientos/:id - Elimina un mantenimiento por su ID
const deleteMantenimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM mantenimientos WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Registro de mantenimiento con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar registro de mantenimiento con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el registro de mantenimiento con ID ${req.params.id} porque está siendo utilizado por otros registros.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllMantenimientos,
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
};