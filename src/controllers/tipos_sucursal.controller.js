// src/controllers/tiposSucursal.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Tipos de Sucursal.
// Esta tabla es un catálogo para diferenciar sucursales (ej: Corporativo, Tienda).

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/tipos-sucursal
// Obtiene y devuelve todos los registros de la tabla 'tipos_sucursal'.
const getAllTiposSucursal = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar todos los tipos de sucursal.
    // No incluimos fecha_creacion/actualizacion ya que no están en la definición final de esta tabla.
    const sql = 'SELECT id, nombre_tipo, descripcion FROM tipos_sucursal';
    // Ejecutamos la consulta.
    const tipos = await query(sql);

    // Enviamos la lista de tipos como respuesta JSON (200 OK).
    res.status(200).json(tipos);

  } catch (error) {
    console.error('Error al obtener todos los tipos de sucursal:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/tipos-sucursal/:id
// Obtiene y devuelve un tipo de sucursal específico por su ID.
const getTiposSucursalById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del tipo de sucursal desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para seleccionar un tipo por ID.
    const sql = 'SELECT id, nombre_tipo, descripcion FROM tipos_sucursal WHERE id = ?';
    const params = [id]; // El ID a buscar.
    const tipos = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (tipos.length === 0) {
      // Si el array está vacío, el tipo no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(tipos[0]);
    }

  } catch (error) {
    console.error(`Error al obtener tipo de sucursal con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/tipos-sucursal
// Crea un nuevo registro en la tabla 'tipos_sucursal'.
// Nota: Si los tipos de sucursal son fijos (Corporativo, Tienda), esta función y las siguientes
// (update, delete) podrían no ser necesarias o estar restringidas solo a administradores.
const createTiposSucursal = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos del body. nombre_tipo es obligatorio.
    const { nombre_tipo, descripcion } = req.body;

    // === Validaciones ===
    if (!nombre_tipo) {
      return res.status(400).json({ message: 'El nombre_tipo es obligatorio.' });
    }

    // Consulta SQL para insertar.
    const sql = 'INSERT INTO tipos_sucursal (nombre_tipo, descripcion) VALUES (?, ?)';
    const params = [nombre_tipo, descripcion];

    // Ejecutamos la consulta.
    const result = await query(sql, params);
    const newId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Tipo de sucursal creado exitosamente',
      id: newId,
      nombre_tipo: nombre_tipo
    });

  } catch (error) {
    console.error('Error al crear tipo de sucursal:', error);
    // === Manejo de Errores Específicos ===
    // Si el nombre ya existe.
     if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ // 409 Conflict.
            message: `El nombre de tipo de sucursal "${req.body.nombre_tipo}" ya existe.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [PUT] /api/tipos-sucursal/:id
// Actualiza un registro existente en la tabla 'tipos_sucursal' por su ID.
const updateTiposSucursal = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const { nombre_tipo, descripcion } = req.body;

    // === Validaciones ===
    if (nombre_tipo === undefined && descripcion === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_tipo o descripcion para actualizar.' });
    }

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE tipos_sucursal SET ';
    const params = [];
    const updates = [];

    if (nombre_tipo !== undefined) {
        updates.push('nombre_tipo = ?');
        params.push(nombre_tipo);
    }
    if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
    }

    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Tipo de sucursal con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar tipo de sucursal con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si el nombre ya existe.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({
           message: `El nombre de tipo de sucursal "${req.body.nombre_tipo}" ya existe.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/tipos-sucursal/:id
// Elimina un registro de la tabla 'tipos_sucursal' por su ID.
const deleteTiposSucursal = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del tipo a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM tipos_sucursal WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Tipo de sucursal con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar tipo de sucursal con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usado por sucursales (ON DELETE RESTRICT).
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el tipo de sucursal con ID ${req.params.id} porque tiene sucursales asociadas.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// Exportamos las funciones del controlador.
module.exports = {
  getAllTiposSucursal,
  getTiposSucursalById,
  createTiposSucursal,
  updateTiposSucursal,
  deleteTiposSucursal,
};