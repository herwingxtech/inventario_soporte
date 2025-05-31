// ! Controlador para la entidad Empresas

// * Importo la función query para ejecutar consultas a la base de datos
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de empresas
// ===============================================================

// * [GET] /api/empresas - Trae todas las empresas (con nombre de status)
const getAllEmpresas = async (req, res, next) => {
  try {
    // * Consulta SQL con JOIN para traer empresas y su status legible
    const sql = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_registro,
        e.fecha_actualizacion,
        e.id_status,
        s.nombre_status AS status_nombre
      FROM empresas AS e
      JOIN status AS s ON e.id_status = s.id
    `;
    const empresas = await query(sql);
    res.status(200).json(empresas);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las empresas:', error);
    next(error);
  }
};

// * [GET] /api/empresas/:id - Trae una empresa específica por su ID (con status)
const getEmpresaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_registro,
        e.fecha_actualizacion,
        e.id_status,
        s.nombre_status AS status_nombre
      FROM empresas AS e
      JOIN status AS s ON e.id_status = s.id
      WHERE e.id = ?
    `;
    const params = [id];
    const empresas = await query(sql, params);
    if (empresas.length === 0) {
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(empresas[0]);
    }
  } catch (error) {
    console.error(`Error al obtener empresa con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/empresas - Crea una nueva empresa
const createEmpresa = async (req, res, next) => {
  try {
    const { nombre, id_status } = req.body;
    // * Validación: nombre es obligatorio
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la empresa es obligatorio.' });
    }
    // * Validar si el id_status existe (si se envió)
    if (id_status !== undefined) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    // * Construcción dinámica de la consulta
    let sql = 'INSERT INTO empresas (nombre';
    let values = [nombre];
    let placeholders = ['?'];
    if (id_status !== undefined) {
      sql += ', id_status';
      values.push(id_status);
      placeholders.push('?');
    }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newEmpresaId = result.insertId;
    res.status(201).json({
      message: 'Empresa creada exitosamente',
      id: newEmpresaId,
      nombre: nombre
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de empresa "${req.body.nombre}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/empresas/:id - Actualiza una empresa por su ID
const updateEmpresa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, id_status } = req.body;
    // * Validación: al menos un campo a actualizar
    if (nombre === undefined && id_status === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos nombre o id_status para actualizar.' });
    }
    if (id_status !== undefined) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    let sql = 'UPDATE empresas SET ';
    const params = [];
    const updates = [];
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (id_status !== undefined) {
      updates.push('id_status = ?');
      params.push(id_status);
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Empresa con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al actualizar empresa con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de empresa "${req.body.nombre}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/empresas/:id - Elimina una empresa por su ID
const deleteEmpresa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM empresas WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Empresa con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al eliminar empresa con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar la empresa con ID ${req.params.id} porque está siendo utilizada por otras tablas (ej. sucursales).`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
};