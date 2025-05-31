// src/controllers/roles.controller.js
// ! Controlador para la entidad Roles
// * Aquí gestiono todo lo relacionado con los roles de usuario del sistema: creación, consulta, actualización y eliminación.
// * Incluye validaciones para evitar duplicados y asegurar integridad referencial.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de roles
// ===============================================================

// * [GET] /api/roles - Trae todos los roles
const getAllRoles = async (req, res, next) => {
  try {
    // * Consulta SQL para traer todos los roles
    // Incluimos las columnas relevantes.
    const sql = 'SELECT id, nombre_rol, fecha_registro FROM roles';
    // Ejecutamos la consulta.
    const roles = await query(sql);

    // * Devuelvo la lista como JSON
    res.status(200).json(roles);

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los roles:', error);
    next(error); // Pasar error al middleware global.
  }
};

// * [GET] /api/roles/:id - Trae un rol específico por su ID
const getRoleById = async (req, res, next) => {
  try {
    // * Extraigo el ID desde los parámetros de la URL
    const { id } = req.params;

    // * Consulta SQL para traer el rol
    const sql = 'SELECT id, nombre_rol, fecha_registro FROM roles WHERE id = ?';
    const params = [id]; // El ID a buscar.
    const roles = await query(sql, params); // query siempre devuelve un array.

    // * Si no existe, devuelvo 404
    if (roles.length === 0) {
      // Si el array está vacío, el rol no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      // * Si existe, devuelvo el objeto
      res.status(200).json(roles[0]);
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener rol con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// * [POST] /api/roles - Crea un nuevo rol
const createRole = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. nombre_rol es obligatorio
    const { nombre_rol } = req.body;

    // * Valido que el nombre no esté vacío
    if (!nombre_rol) {
      return res.status(400).json({ message: 'El campo nombre_rol es obligatorio.' });
    }
    if (nombre_rol.trim() === '') {
       return res.status(400).json({ message: 'El campo nombre_rol no puede estar vacío.' });
    }

    // * Construyo la consulta SQL para insertar
    const sql = 'INSERT INTO roles (nombre_rol) VALUES (?)';
    const params = [nombre_rol];

    // Ejecutamos la consulta.
    const result = await query(sql, params);
    const newRoleId = result.insertId; // ID del registro insertado.

    // * Devuelvo el ID del nuevo rol
    res.status(201).json({
      message: 'Rol creado exitosamente',
      id: newRoleId,
      nombre_rol: nombre_rol
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear rol:', error);
    // * Manejo de error por nombre duplicado
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El nombre de rol "${req.body.nombre_rol}" ya existe.`,
           error: error.message
       });
    } else {
       next(error); // Para cualquier otro error, pasar al manejador global.
    }
  }
};

// * [PUT] /api/roles/:id - Actualiza un rol por su ID
const updateRole = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const { nombre_rol } = req.body; // Campo que se puede actualizar.

    // * Valido que al menos un campo sea enviado
    if (nombre_rol === undefined) { // Podría permitirse si hubiera otros campos.
         return res.status(400).json({ message: 'Se debe proporcionar el campo nombre_rol para actualizar.' });
    }
    if (nombre_rol !== null && nombre_rol.trim() === '') {
       return res.status(400).json({ message: 'El campo nombre_rol no puede estar vacío.' });
    }

    // * Construyo la consulta UPDATE dinámicamente
    const sql = 'UPDATE roles SET nombre_rol = ? WHERE id = ?';
    const params = [nombre_rol, id];

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // * Devuelvo mensaje de éxito o 404 si no existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Rol con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar rol con ID ${req.params.id}:`, error);
    // * Manejo de error por nombre duplicado
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El nombre de rol "${req.body.nombre_rol}" ya existe.`,
           error: error.message
       });
    } else {
       next(error); // Para cualquier otro error, pasar al manejador global.
    }
  }
};

// * [DELETE] /api/roles/:id - Elimina un rol por su ID
const deleteRole = async (req, res, next) => {
  try {
    // * Extraigo el ID del rol a eliminar
    const { id } = req.params;

    // Ejecuto el DELETE y reviso si realmente existía
    const sql = 'DELETE FROM roles WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);

    // * Devuelvo mensaje de éxito o 404 si no existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Rol con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar rol con ID ${req.params.id}:`, error);
    // * Manejo de error por integridad referencial
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
       res.status(409).json({ // 409 Conflict.
           message: `No se puede eliminar el rol con ID ${req.params.id} porque tiene usuarios del sistema asociados.`,
           error: error.message
       });
    } else {
       next(error); // Para cualquier otro error, pasar al manejador global.
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