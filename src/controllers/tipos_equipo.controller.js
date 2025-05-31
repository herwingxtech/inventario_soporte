// src/controllers/tiposEquipo.controller.js
// ! Controlador para la entidad Tipos de Equipo
// * Aquí gestiono el catálogo de tipos de equipo (ej: Computadora, Monitor, Impresora). Incluye validaciones y operaciones CRUD.
// * Este archivo es el catálogo de tipos de equipo (ej: Computadora, Monitor, Impresora).
// * Aquí gestiono la creación, consulta, actualización y eliminación de tipos de equipo.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Funciones controladoras para cada endpoint de tipos de equipo
// ===============================================================

// * [GET] /api/tipos-equipo - Trae todos los tipos de equipo
const getAllTiposEquipo = async (req, res, next) => {
  try {
    // * Consulta SQL para traer todos los tipos de equipo
    const sql = 'SELECT id, nombre_tipo, descripcion, fecha_registro, fecha_actualizacion FROM tipos_equipo';
    const tipos = await query(sql);
    res.status(200).json(tipos);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los tipos de equipo:', error);
    next(error);
  }
};

// * [GET] /api/tipos-equipo/:id - Trae un tipo de equipo específico por su ID
const getTiposEquipoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT id, nombre_tipo, descripcion, fecha_registro, fecha_actualizacion FROM tipos_equipo WHERE id = ?';
    const params = [id];
    const tipos = await query(sql, params);
    if (tipos.length === 0) {
      res.status(404).json({ message: `Tipo de equipo con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(tipos[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener tipo de equipo con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/tipos-equipo - Crea un nuevo tipo de equipo
const createTiposEquipo = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. nombre_tipo es obligatorio.
    const { nombre_tipo, descripcion } = req.body;
    if (!nombre_tipo) {
      return res.status(400).json({ message: 'El campo nombre_tipo es obligatorio.' });
    }
    const sql = 'INSERT INTO tipos_equipo (nombre_tipo, descripcion) VALUES (?, ?)';
    const params = [nombre_tipo, descripcion];
    const result = await query(sql, params);
    const newTipoEquipoId = result.insertId;
    res.status(201).json({
      message: 'Tipo de equipo creado exitosamente',
      id: newTipoEquipoId,
      nombre_tipo: nombre_tipo
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear tipo de equipo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de tipo de equipo "${req.body.nombre_tipo}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/tipos-equipo/:id - Actualiza un tipo de equipo por su ID
const updateTiposEquipo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_tipo, descripcion } = req.body;
    if (nombre_tipo === undefined && descripcion === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_tipo o descripcion para actualizar.' });
    }
    let sql = 'UPDATE tipos_equipo SET ';
    const params = [];
    const updates = [];
    if (nombre_tipo !== undefined) { updates.push('nombre_tipo = ?'); params.push(nombre_tipo); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); params.push(descripcion); }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Tipo de equipo con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Tipo de equipo con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar tipo de equipo con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de tipo de equipo "${req.body.nombre_tipo}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/tipos-equipo/:id - Elimina un tipo de equipo por su ID
const deleteTiposEquipo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM tipos_equipo WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Tipo de equipo con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Tipo de equipo con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar tipo de equipo con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el tipo de equipo con ID ${req.params.id} porque tiene equipos asociados.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllTiposEquipo,
  getTiposEquipoById,
  createTiposEquipo,
  updateTiposEquipo,
  deleteTiposEquipo,
};