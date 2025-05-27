// src/controllers/roles.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Roles.
// Esta tabla es un catálogo para definir los roles de usuario del sistema (ej: Admin, Viewer).

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/roles
// Obtiene y devuelve todos los registros de la tabla 'roles'.
// Incluye columnas para registro y última actualización.
const getAllRoles = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar todos los roles.
    // Incluimos las columnas relevantes.
    const sql = 'SELECT id, nombre_rol, fecha_registro FROM roles';
    // Ejecutamos la consulta.
    const roles = await query(sql);

    // Enviamos la lista de roles como respuesta JSON (200 OK).
    res.status(200).json(roles);

  } catch (error) {
    console.error('Error al obtener todos los roles:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/roles/:id
// Obtiene y devuelve un rol específico por su ID.
const getRoleById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del rol desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para seleccionar un rol por ID.
    const sql = 'SELECT id, nombre_rol, fecha_registro FROM roles WHERE id = ?';
    const params = [id]; // El ID a buscar.
    const roles = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (roles.length === 0) {
      // Si el array está vacío, el rol no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(roles[0]);
    }

  } catch (error) {
    console.error(`Error al obtener rol con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/roles
// Crea un nuevo registro en la tabla 'roles'.
// Incluye validación para campo obligatorio (nombre_rol).
// NOTA: Considera si esta operación debe estar disponible si los roles son fijos.
const createRole = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos del body. nombre_rol es obligatorio.
    const { nombre_rol } = req.body;

    // === Validaciones ===
    if (!nombre_rol) {
      return res.status(400).json({ message: 'El campo nombre_rol es obligatorio.' });
    }
    // Validar que no esté vacío.
     if (nombre_rol.trim() === '') {
        return res.status(400).json({ message: 'El campo nombre_rol no puede estar vacío.' });
     }

    // Consulta SQL para insertar. fecha_registro  usan DEFAULT/ON UPDATE.
    const sql = 'INSERT INTO roles (nombre_rol) VALUES (?)';
    const params = [nombre_rol];

    // Ejecutamos la consulta.
    const result = await query(sql, params);
    const newRoleId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Rol creado exitosamente',
      id: newRoleId,
      nombre_rol: nombre_rol
    });

  } catch (error) {
    console.error('Error al crear rol:', error);
    // === Manejo de Errores Específicos ===
    // Si el nombre ya existe (UNIQUE constraint).
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

// [PUT] /api/roles/:id
// Actualiza un registro existente en la tabla 'roles' por su ID.
// Incluye validación para campo único (nombre_rol).
// NOTA: Considera si esta operación debe estar disponible si los roles son fijos.
const updateRole = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const { nombre_rol } = req.body; // Campo que se puede actualizar.

    // === Validaciones ===
    // Validar si se envió al menos el campo nombre_rol (es el único actualizable).
    if (nombre_rol === undefined) { // Podría permitirse si hubiera otros campos.
         return res.status(400).json({ message: 'Se debe proporcionar el campo nombre_rol para actualizar.' });
    }
     // Validar que no esté vacío.
     if (nombre_rol !== null && nombre_rol.trim() === '') {
        return res.status(400).json({ message: 'El campo nombre_rol no puede estar vacío.' });
     }

    // Construir la consulta UPDATE.
    const sql = 'UPDATE roles SET nombre_rol = ? WHERE id = ?';
    const params = [nombre_rol, id];

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Rol con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar rol con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si el nombre ya existe.
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

// [DELETE] /api/roles/:id
// Elimina un registro de la tabla 'roles' por su ID.
// NOTA: CRÍTICO - No se debe eliminar un rol si hay usuarios asignados a él.
const deleteRole = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del rol a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM roles WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Rol con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Rol con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar rol con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usado por usuarios_sistema (ON DELETE RESTRICT).
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

// Exportamos las funciones del controlador.
module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};