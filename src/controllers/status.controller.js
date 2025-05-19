// src/controllers/status.controller.js

// Importamos la función de ayuda para ejecutar consultas a la base de datos
const { query } = require('../config/db');

// Función para obtener TODOS los estados
const getAllStatuses = async (req, res) => {
  try {
    // Consulta SQL para seleccionar todos los registros de la tabla 'status'
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion FROM status';
    // Ejecutamos la consulta. No necesitamos parámetros para un SELECT *
    const statuses = await query(sql);

    // Si la consulta fue exitosa, enviamos la lista de estados como respuesta JSON
    // Código de estado 200 (OK)
    res.status(200).json(statuses);

  } catch (error) {
    // Si ocurre un error, lo registramos en la consola del servidor
    console.error('Error al obtener todos los estados:', error);
    // Enviamos una respuesta de error al cliente
    // Código de estado 500 (Internal Server Error)
    res.status(500).json({
      message: 'Error interno del servidor al obtener los estados',
      error: error.message // Enviamos el mensaje de error (útil para depuración, pero cuidado en producción)
    });
  }
};

// Función para obtener UN estado por su ID
const getStatusById = async (req, res) => {
  try {
    // Obtenemos el ID del estado desde los parámetros de la URL (ej. /api/status/5 -> id = 5)
    const { id } = req.params; // req.params contiene los segmentos dinámicos de la URL

    // Consulta SQL para seleccionar un estado específico por su ID
    // Usamos '?' como placeholder para el parámetro. ¡Importante para seguridad!
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion FROM status WHERE id = ?';
    // Pasamos un array con los parámetros que reemplazarán los '?'. El orden importa.
    const params = [id];
    const statuses = await query(sql, params);

    // La consulta devuelve un array. Si se encontró un registro, el array tendrá 1 elemento.
    if (statuses.length === 0) {
      // Si no se encontró ningún estado con ese ID
      // Código de estado 404 (Not Found)
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      // Si se encontró el estado, enviamos el primer elemento del array como respuesta JSON
      // Código de estado 200 (OK)
      res.status(200).json(statuses[0]);
    }

  } catch (error) {
    console.error(`Error al obtener estado con ID ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener el estado',
      error: error.message
    });
  }
};

// Función para CREAR un nuevo estado
const createStatus = async (req, res) => {
  try {
    // Obtenemos los datos del nuevo estado desde el cuerpo de la petición POST
    // req.body contiene los datos enviados por el cliente (generalmente en formato JSON)
    const { nombre_status, descripcion } = req.body; // Asumimos que recibimos nombre_status y opcionalmente descripcion

    // Validar si se recibió el nombre_status (es obligatorio según nuestro modelo DB)
    if (!nombre_status) {
      // Código de estado 400 (Bad Request) si faltan datos obligatorios
      return res.status(400).json({ message: 'El nombre_status es obligatorio.' });
    }

    // Consulta SQL para insertar un nuevo registro en la tabla 'status'
    // Usamos '?' para los valores a insertar
    const sql = 'INSERT INTO status (nombre_status, descripcion) VALUES (?, ?)';
    // Pasamos un array con los valores a insertar.
    // Nota: fecha_creacion tiene un valor DEFAULT en la DB, no necesitamos insertarla aquí.
    const params = [nombre_status, descripcion];
    // La función query para INSERT devuelve información sobre la operación, no las filas insertadas.
    const result = await query(sql, params);

    // result.insertId contiene el ID auto-generado del nuevo registro
    const newStatusId = result.insertId;

    // Enviamos una respuesta de éxito con el ID del nuevo estado creado
    // Código de estado 201 (Created) - Indica que un nuevo recurso ha sido creado exitosamente
    res.status(201).json({
      message: 'Estado creado exitosamente',
      id: newStatusId,
      nombre_status: nombre_status // Podemos devolver también los datos que se intentaron crear
    });

  } catch (error) {
    console.error('Error al crear estado:', error);
     // Si el error es porque el nombre_status ya existe (UNIQUE constraint), podemos dar un mensaje más específico
     if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ // 409 Conflict
            message: `El estado "${req.body.nombre_status}" ya existe.`,
            error: error.message
        });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al crear el estado',
            error: error.message
        });
     }
  }
};

// Función para ACTUALIZAR un estado existente
const updateStatus = async (req, res) => {
  try {
    // Obtenemos el ID del estado a actualizar desde los parámetros de la URL
    const { id } = req.params;
    // Obtenemos los datos actualizados desde el cuerpo de la petición PUT
    const { nombre_status, descripcion } = req.body;

    // Validar si se recibió al menos uno de los campos a actualizar (nombre_status o descripcion)
    if (!nombre_status && !descripcion) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_status o descripcion para actualizar.' });
    }

    // Construimos la consulta SQL UPDATE dinámicamente para actualizar solo los campos presentes
    let sql = 'UPDATE status SET ';
    const params = [];
    const updates = [];

    if (nombre_status !== undefined) { // Usamos !== undefined para permitir actualizar a un valor vacío si es necesario
        updates.push('nombre_status = ?');
        params.push(nombre_status);
    }
    if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
    }

    sql += updates.join(', '); // Une los campos a actualizar (ej. 'nombre_status = ?, descripcion = ?')
    sql += ' WHERE id = ?'; // Condición para actualizar solo el registro con el ID dado
    params.push(id); // Añadimos el ID al final de los parámetros

    // Ejecutamos la consulta UPDATE
    const result = await query(sql, params);

    // result.affectedRows indica cuántas filas fueron afectadas por la operación UPDATE
    if (result.affectedRows === 0) {
      // Si affectedRows es 0, puede significar que el ID no existe
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      // Si affectedRows es > 0, la actualización fue exitosa
      // Código de estado 200 (OK) con un mensaje de éxito
      res.status(200).json({ message: `Estado con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar estado con ID ${req.params.id}:`, error);
    // Manejo específico para el error de UNIQUE constraint si se intenta actualizar a un nombre ya existente
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `El nombre de estado "${req.body.nombre_status}" ya existe.`,
           error: error.message
       });
    } else {
        res.status(500).json({
            message: 'Error interno del servidor al actualizar el estado',
            error: error.message
        });
    }
  }
};

// Función para ELIMINAR un estado
const deleteStatus = async (req, res) => {
  try {
    // Obtenemos el ID del estado a eliminar desde los parámetros de la URL
    const { id } = req.params;

    // Consulta SQL para eliminar un registro por su ID
    const sql = 'DELETE FROM status WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta DELETE
    const result = await query(sql, params);

    // result.affectedRows indica cuántas filas fueron afectadas por la operación DELETE
    if (result.affectedRows === 0) {
      // Si affectedRows es 0, el ID no existe
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      // Si affectedRows es > 0, la eliminación fue exitosa
      // Código de estado 200 (OK) con un mensaje de éxito
      res.status(200).json({ message: `Estado con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar estado con ID ${req.params.id}:`, error);
     // Ojo: Si intentas eliminar un status que está siendo usado por otra tabla (por FK con ON DELETE RESTRICT),
     // MySQL lanzará un error 'ER_ROW_IS_REFERENCED_2'. Debemos manejarlo.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict
            message: `No se puede eliminar el estado con ID ${req.params.id} porque está siendo utilizado por otros registros.`,
            error: error.message
        });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al eliminar el estado',
            error: error.message
        });
     }
  }
};

// Exportamos todas las funciones para que puedan ser utilizadas por el archivo de rutas
module.exports = {
  getAllStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
};