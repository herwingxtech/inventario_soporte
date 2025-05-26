// src/controllers/status.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Status.

// Importamos la función de ayuda para ejecutar consultas a la base de datos usando el pool.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// Cada función maneja la lógica para un endpoint específico definido en las rutas.
// Todas reciben req, res, y next (para pasar errores).
// ===============================================================

// [GET] /api/status
// Obtiene y devuelve todos los registros de la tabla 'status'.
const getAllStatuses = async (req, res, next) => { // 'next' se usa para pasar errores al middleware global.
  try {
    // Consulta SQL para seleccionar todos los registros de la tabla 'status'.
    // Incluimos todas las columnas relevantes.
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion, fecha_actualizacion FROM status';
    // Ejecutamos la consulta usando nuestra función helper.
    // Como no hay parámetros en la consulta, solo pasamos el SQL.
    const statuses = await query(sql);

    // Si la consulta fue exitosa, enviamos la lista de estados como respuesta JSON.
    // Usamos el código de estado 200 (OK) por defecto para respuestas exitosas GET.
    res.status(200).json(statuses);

  } catch (error) {
    // Si ocurre cualquier error durante la ejecución del try (ej. error de DB),
    // lo registramos en la consola del servidor para depuración.
    console.error('Error al obtener todos los estados:', error);
    // Pasamos el error al siguiente middleware, que es nuestro manejador de errores global.
    // Esto centraliza el formato de las respuestas de error 500.
    next(error);
  }
};

// [GET] /api/status/:id
// Obtiene y devuelve un estado específico por su ID.
const getStatusById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del estado desde los parámetros de la URL.
    // req.params es un objeto con los segmentos dinámicos de la ruta (definidos con ':').
    const { id } = req.params; // Ej. /api/status/5 -> id = 5.

    // Consulta SQL para seleccionar un estado específico por su ID.
    // Usamos '?' como placeholder para el parámetro para prevenir inyección SQL
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion, fecha_actualizacion FROM status WHERE id = ?';
    // Pasamos un array con los parámetros que reemplazarán los '?'. El orden es crucial.
    const params = [id];
    // Ejecutamos la consulta.
    const statuses = await query(sql, params);

    // La consulta SELECT por ID devuelve un array. Si se encontró un registro, el array tendrá 1 elemento.
    if (statuses.length === 0) {
      // Si el array está vacío, significa que no se encontró ningún estado con ese ID.
      // Enviamos una respuesta 404 (Not Found) con un mensaje indicativo.
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      // Si se encontró el estado, enviamos el primer (y único) elemento del array como respuesta JSON.
      res.status(200).json(statuses[0]);
    }

  } catch (error) {
    console.error(`Error al obtener estado con ID ${req.params.id}:`, error);
    next(error); // Pasar el error al manejador global.
  }
};

// [POST] /api/status
// Crea un nuevo registro en la tabla 'status'.
const createStatus = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos para el nuevo estado desde el cuerpo de la petición POST.
    // req.body contiene los datos enviados por el cliente (generalmente en formato JSON, gracias a express.json()).
    const { nombre_status, descripcion } = req.body; // Extraemos los campos relevantes.

    // === Validaciones ===
    // Validar si se recibió el nombre_status, ya que es obligatorio según nuestro modelo DB (NOT NULL UNIQUE).
    if (!nombre_status) {
      // Si falta un campo obligatorio, enviamos una respuesta 400 (Bad Request).
      // return es importante aquí para detener la ejecución de la función después de enviar la respuesta.
      return res.status(400).json({ message: 'El campo nombre_status es obligatorio.' });
    }
    // Se podrían añadir más validaciones aquí (ej. longitud, formato, etc.).

    // Consulta SQL para insertar un nuevo registro en la tabla 'status'.
    // Usamos '?' para los valores a insertar.
    const sql = 'INSERT INTO status (nombre_status, descripcion) VALUES (?, ?)';
    // Pasamos un array con los valores correspondientes a los '?'.
    // Nota: fecha_creacion y fecha_actualizacion tienen valores DEFAULT/ON UPDATE en la DB, no necesitamos insertarlas explícitamente aquí.
    const params = [nombre_status, descripcion];
    // Ejecutamos la consulta. Para INSERT, UPDATE, DELETE, la función query devuelve información sobre la operación (`affectedRows`, `insertId`), no las filas insertadas.
    const result = await query(sql, params);

    // result.insertId contiene el ID auto-generado por la base de datos para el nuevo registro.
    const newStatusId = result.insertId;

    // Enviamos una respuesta de éxito indicando que el recurso fue creado.
    // Usamos el código de estado 201 (Created).
    res.status(201).json({
      message: 'Estado creado exitosamente',
      id: newStatusId, // Devolvemos el ID del registro creado.
      nombre_status: nombre_status // Podemos devolver también algunos de los datos enviados.
    });

  } catch (error) {
    console.error('Error al crear estado:', error);
     // === Manejo de Errores Específicos ===
     // Si el error es porque el nombre_status ya existe (viola la constraint UNIQUE),
     // MySQL devuelve un error con el código 'ER_DUP_ENTRY'. Lo manejamos específicamente.
     if (error.code === 'ER_DUP_ENTRY') {
        // Enviamos una respuesta 409 (Conflict), indicando que la petición no pudo completarse
        // debido a un conflicto con el estado actual del recurso (el nombre ya existe).
        res.status(409).json({
            message: `El estado con nombre "${req.body.nombre_status}" ya existe.`,
            error: error.message // Incluimos el mensaje de error original de la DB para debug en desarrollo.
        });
     } else {
        // Para cualquier otro tipo de error (ej. error de conexión, error SQL diferente),
        // lo pasamos al manejador de errores global para una respuesta 500 genérica.
        next(error);
     }
  }
};

// [PUT] /api/status/:id
// Actualiza un registro existente en la tabla 'status' por su ID.
const updateStatus = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del estado a actualizar desde los parámetros de la URL.
    const { id } = req.params;
    // Obtenemos los datos actualizados desde el cuerpo de la petición PUT.
    const { nombre_status, descripcion } = req.body; // Campos que potencialmente se quieren actualizar.

    // === Validaciones ===
    // Validar si se recibió al menos uno de los campos que se pueden actualizar.
    if (nombre_status === undefined && descripcion === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_status o descripcion para actualizar.' });
    }
    // Podrían añadirse más validaciones de datos de entrada aquí.

    // Construimos la consulta SQL UPDATE dinámicamente.
    // Esto permite actualizar solo los campos que fueron enviados en el cuerpo de la petición,
    // sin afectar los campos que no se mencionaron.
    let sql = 'UPDATE status SET '; // Inicia la sentencia UPDATE.
    const params = []; // Array para almacenar los valores de los parámetros de la consulta.
    const updates = []; // Array para almacenar las partes de la sentencia SET (ej. 'campo = ?').

    // Verificamos qué campos fueron proporcionados y los añadimos a los arrays `updates` y `params`.
    if (nombre_status !== undefined) { // Usamos !== undefined para distinguir entre `null`, `""` y no enviado.
        updates.push('nombre_status = ?'); // Añade la parte 'nombre_status = ?' a la sentencia SET.
        params.push(nombre_status); // Añade el valor al array de parámetros.
    }
    if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
    }

    // Unimos las partes de la sentencia SET con comas (ej. 'nombre_status = ?, descripcion = ?').
    sql += updates.join(', ');
    // Añadimos la cláusula WHERE para especificar qué registro actualizar (por ID).
    sql += ' WHERE id = ?';
    params.push(id); // Añadimos el ID del registro al final de los parámetros.

    // Ejecutamos la consulta UPDATE.
    // result.affectedRows indica cuántas filas fueron modificadas por la operación.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas fueron afectadas, significa que no se encontró ningún registro con ese ID
      // o que los datos enviados eran idénticos a los existentes (aunque la DB actualiza fecha_actualizacion incluso si los datos no cambian).
      // Generalmente, 0 filas afectadas después de un UPDATE por ID único significa que el ID no existía.
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      // Si al menos 1 fila fue afectada, la actualización fue exitosa.
      // Enviamos una respuesta 200 (OK) con un mensaje de éxito.
      res.status(200).json({ message: `Estado con ID ${id} actualizado exitosamente.` });
      // La fecha_actualizacion se actualizó automáticamente en la base de datos.
    }

  } catch (error) {
    console.error(`Error al actualizar estado con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejo para el error de UNIQUE constraint si se intenta actualizar `nombre_status` a un valor que ya existe.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({
           message: `El nombre de estado "${req.body.nombre_status}" ya existe.`,
           error: error.message
       });
     } else {
        // Para cualquier otro error, pasarlo al manejador global.
        next(error);
     }
  }
};

// [DELETE] /api/status/:id
// Elimina un registro de la tabla 'status' por su ID.
const deleteStatus = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del estado a eliminar desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para eliminar un registro por su ID.
    const sql = 'DELETE FROM status WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta DELETE. result.affectedRows indica cuántas filas fueron eliminadas.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      // Si al menos 1 fila afectada, la eliminación fue exitosa.
      res.status(200).json({ message: `Estado con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar estado con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si intentas eliminar un status que está siendo usado por otra tabla
     // debido a una clave foránea con ON DELETE RESTRICT. MySQL lanza 'ER_ROW_IS_REFERENCED_2'.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({
            message: `No se puede eliminar el estado con ID ${req.params.id} porque está siendo utilizado por otros registros (ej. empresas, sucursales, etc.).`,
            error: error.message
        });
     } else {
        // Para cualquier otro error, pasarlo al manejador global.
        next(error);
     }
  }
};

// Exportamos todas las funciones del controlador.
// Esto permite que el archivo de rutas (status.routes.js) las importe y las use.
module.exports = {
  getAllStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
};