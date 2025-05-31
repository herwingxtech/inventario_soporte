// ! Controlador para la entidad Status
// * Aquí gestiono todo lo relacionado con los estados del sistema: creación, consulta, actualización y eliminación.
// * Incluye validaciones para evitar duplicados y asegurar integridad referencial.

// * Importo la función query para ejecutar consultas a la base de datos
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de status
// ===============================================================

// * [GET] /api/status - Trae todos los registros de la tabla 'status'
const getAllStatuses = async (req, res, next) => {
  try {
    // * Consulta SQL para traer todos los estados
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion, fecha_actualizacion FROM status';
    const statuses = await query(sql);
    // * Devuelvo la lista de estados como JSON
    res.status(200).json(statuses);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los estados:', error);
    next(error);
  }
};

// * [GET] /api/status/:id - Trae un estado específico por su ID
const getStatusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion, fecha_actualizacion FROM status WHERE id = ?';
    const params = [id];
    const statuses = await query(sql, params);
    if (statuses.length === 0) {
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(statuses[0]);
    }
  } catch (error) {
    console.error(`Error al obtener estado con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/status - Crea un nuevo estado
const createStatus = async (req, res, next) => {
  try {
    const { nombre_status, descripcion } = req.body;
    // * Extraigo los datos del body. nombre_status es obligatorio
    if (!nombre_status) {
      return res.status(400).json({ message: 'El campo nombre_status es obligatorio.' });
    }
    const sql = 'INSERT INTO status (nombre_status, descripcion) VALUES (?, ?)';
    const params = [nombre_status, descripcion];
    const result = await query(sql, params);
    const newStatusId = result.insertId;
    res.status(201).json({
      message: 'Estado creado exitosamente',
      id: newStatusId,
      nombre_status: nombre_status
    });
  } catch (error) {
    console.error('Error al crear estado:', error);
    // * Manejo de error por nombre duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El estado con nombre "${req.body.nombre_status}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/status/:id - Actualiza un estado por su ID
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_status, descripcion } = req.body;
    // * Extraigo el ID y los datos a actualizar
    // * Valido que al menos un campo sea enviado
    if (nombre_status === undefined && descripcion === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_status o descripcion para actualizar.' });
    }
    let sql = 'UPDATE status SET ';
    const params = [];
    const updates = [];
    if (nombre_status !== undefined) {
      updates.push('nombre_status = ?');
      params.push(nombre_status);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(descripcion);
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Estado con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al actualizar estado con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de estado "${req.body.nombre_status}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/status/:id - Elimina un estado por su ID
const deleteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM status WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Estado con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al eliminar estado con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el estado con ID ${req.params.id} porque está siendo utilizado por otros registros (ej. empresas, sucursales, etc.).`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
};