// src/controllers/roles.controller.js
// ! Controlador para la entidad Roles
// * Aquí gestiono todo lo relacionado con los roles de usuario del sistema: creación, consulta, actualización y eliminación.
// * Este módulo valida duplicados y asegura la integridad referencial.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Funciones controladoras para cada endpoint de roles
// ===============================================================

// * [GET] /api/roles - Trae todos los roles
const getAllRoles = async (req, res, next) => {
  try {
    // * Consulta SQL para traer todos los roles
    const sql = 'SELECT id, nombre_rol, fecha_registro FROM roles';
    const roles = await query(sql);
    res.status(200).json(roles);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los roles:', error);
    next(error);
  }
};

// * [GET] /api/roles/:id - Trae un rol específico por su ID
const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT id, nombre_rol, fecha_registro FROM roles WHERE id = ?';
    const params = [id];
    const roles = await query(sql, params);
    if (roles.length === 0) {
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(roles[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener rol con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/roles - Crea un nuevo rol
const createRole = async (req, res, next) => {
  try {
    const { nombre_rol } = req.body;
    if (!nombre_rol) {
      return res.status(400).json({ message: 'El campo nombre_rol es obligatorio.' });
    }
    if (nombre_rol.trim() === '') {
      return res.status(400).json({ message: 'El campo nombre_rol no puede estar vacío.' });
    }
    const sql = 'INSERT INTO roles (nombre_rol) VALUES (?)';
    const params = [nombre_rol];
    const result = await query(sql, params);
    const newRoleId = result.insertId;
    res.status(201).json({
      message: 'Rol creado exitosamente',
      id: newRoleId,
      nombre_rol: nombre_rol
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear rol:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de rol "${req.body.nombre_rol}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/roles/:id - Actualiza un rol por su ID
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_rol } = req.body;
    if (nombre_rol === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar el campo nombre_rol para actualizar.' });
    }
    if (nombre_rol !== null && nombre_rol.trim() === '') {
      return res.status(400).json({ message: 'El campo nombre_rol no puede estar vacío.' });
    }
    const sql = 'UPDATE roles SET nombre_rol = ? WHERE id = ?';
    const params = [nombre_rol, id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Rol con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar rol con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de rol "${req.body.nombre_rol}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/roles/:id - Elimina un rol por su ID
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM roles WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Rol con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar rol con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el rol con ID ${req.params.id} porque tiene usuarios del sistema asociados.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};