// src/controllers/tiposEquipo.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Tipos de Equipo.
// Esta tabla es un catálogo para diferenciar equipos (ej: Computadora, Monitor, Impresora).

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/tipos-equipo
// Obtiene y devuelve todos los registros de la tabla 'tipos_equipo'.
// Incluye columnas para registro y última actualización.
const getAllTiposEquipo = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar todos los tipos de equipo.
    const sql = 'SELECT id, nombre_tipo, descripcion, fecha_registro, fecha_actualizacion FROM tipos_equipo';
    // Ejecutamos la consulta.
    const tipos = await query(sql);

    // Enviamos la lista de tipos como respuesta JSON (200 OK).
    res.status(200).json(tipos);

  } catch (error) {
    console.error('Error al obtener todos los tipos de equipo:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/tipos-equipo/:id
// Obtiene y devuelve un tipo de equipo específico por su ID.
const getTiposEquipoById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del tipo de equipo desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para seleccionar un tipo por ID.
    const sql = 'SELECT id, nombre_tipo, descripcion, fecha_registro, fecha_actualizacion FROM tipos_equipo WHERE id = ?';
    const params = [id]; // El ID a buscar.
    const tipos = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (tipos.length === 0) {
      // Si el array está vacío, el tipo no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Tipo de equipo con ID ${id} no encontrado.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(tipos[0]);
    }

  } catch (error) {
    console.error(`Error al obtener tipo de equipo con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/tipos-equipo
// Crea un nuevo registro en la tabla 'tipos_equipo'.
const createTiposEquipo = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos del body. nombre_tipo es obligatorio.
    const { nombre_tipo, descripcion } = req.body;

    // === Validaciones ===
    if (!nombre_tipo) {
      return res.status(400).json({ message: 'El campo nombre_tipo es obligatorio.' });
    }

    // Consulta SQL para insertar. fecha_registro y fecha_actualizacion usan DEFAULT/ON UPDATE.
    const sql = 'INSERT INTO tipos_equipo (nombre_tipo, descripcion) VALUES (?, ?)';
    const params = [nombre_tipo, descripcion];

    // Ejecutamos la consulta.
    const result = await query(sql, params);
    const newTipoEquipoId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Tipo de equipo creado exitosamente',
      id: newTipoEquipoId,
      nombre_tipo: nombre_tipo
    });

  } catch (error) {
    console.error('Error al crear tipo de equipo:', error);
    // === Manejo de Errores Específicos ===
    // Si el nombre ya existe (UNIQUE constraint).
     if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ // 409 Conflict.
            message: `El nombre de tipo de equipo "${req.body.nombre_tipo}" ya existe.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [PUT] /api/tipos-equipo/:id
// Actualiza un registro existente en la tabla 'tipos_equipo' por su ID.
const updateTiposEquipo = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const { nombre_tipo, descripcion } = req.body;

    // === Validaciones ===
    if (nombre_tipo === undefined && descripcion === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_tipo o descripcion para actualizar.' });
    }

    // fecha_actualizacion se actualiza automáticamente en la DB.
    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE tipos_equipo SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    if (nombre_tipo !== undefined) {
        updates.push('nombre_tipo = ?');
        params.push(nombre_tipo);
    }
    if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
    }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Tipo de equipo con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Tipo de equipo con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar tipo de equipo con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si el nombre ya existe.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El nombre de tipo de equipo "${req.body.nombre_tipo}" ya existe.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/tipos-equipo/:id
// Elimina un registro de la tabla 'tipos_equipo' por su ID.
const deleteTiposEquipo = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del tipo a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM tipos_equipo WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Tipo de equipo con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Tipo de equipo con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar tipo de equipo con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usado por equipos (ON DELETE RESTRICT).
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el tipo de equipo con ID ${req.params.id} porque tiene equipos asociados.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// Exportamos las funciones del controlador.
module.exports = {
  getAllTiposEquipo,
  getTiposEquipoById,
  createTiposEquipo,
  updateTiposEquipo,
  deleteTiposEquipo,
};