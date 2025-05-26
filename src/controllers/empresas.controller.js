// src/controllers/empresas.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Empresas.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/empresas
// Obtiene y devuelve todos los registros de la tabla 'empresas'.
// Incluye el nombre del estado asociado mediante un JOIN.
const getAllEmpresas = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar empresas.
    // Hacemos un JOIN con la tabla 'status' para obtener el nombre del estado legible.
    // Usamos alias 'e' para empresas y 's' para status para abreviar.
    const sql = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_registro,
        e.fecha_actualizacion, -- Incluido el campo de última actualización.
        e.id_status,
        s.nombre_status AS status_nombre -- Alias para el nombre del status.
      FROM empresas AS e
      JOIN status AS s ON e.id_status = s.id -- Unir empresas con status por el ID de estado.
    `;
    // Ejecutamos la consulta.
    const empresas = await query(sql);

    // Enviamos la lista de empresas como respuesta JSON (200 OK).
    res.status(200).json(empresas);

  } catch (error) {
    console.error('Error al obtener todas las empresas:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/empresas/:id
// Obtiene y devuelve una empresa específica por su ID.
// Incluye el nombre del estado asociado.
const getEmpresaById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la empresa desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para seleccionar una empresa por ID.
    // Igual que en getAll, hacemos JOIN con status.
    // Añadimos una cláusula WHERE para filtrar por el ID de la empresa.
    const sql = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_registro,
        e.fecha_actualizacion, -- Incluido.
        e.id_status,
        s.nombre_status AS status_nombre
      FROM empresas AS e
      JOIN status AS s ON e.id_status = s.id
      WHERE e.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const empresas = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (empresas.length === 0) {
      // Si el array está vacío, la empresa no fue encontrada (404 Not Found).
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(empresas[0]);
    }

  } catch (error) {
    console.error(`Error al obtener empresa con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/empresas
// Crea un nuevo registro en la tabla 'empresas'.
const createEmpresa = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos para la nueva empresa desde el cuerpo de la petición.
    // nombre es obligatorio, id_status es opcional (tiene DEFAULT en DB).
    const { nombre, id_status } = req.body;

    // === Validaciones ===
    // Validar si se recibió el nombre (obligatorio).
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la empresa es obligatorio.' });
    }

    // Validar si el id_status proporcionado existe en la tabla 'status' (si el usuario lo envió).
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }
    // Si id_status es undefined, la base de datos usará el valor DEFAULT (1 = Activo).
    // fecha_registro y fecha_actualizacion también usan DEFAULT/ON UPDATE automáticamente.

    // Consulta SQL para insertar.
    // Construimos la consulta dinámicamente para incluir `id_status` solo si se proporcionó.
    let sql = 'INSERT INTO empresas (nombre';
    let values = [nombre]; // Array de valores para los placeholders.
    let placeholders = ['?']; // Array de placeholders '?'.

    // Añadir id_status si está presente en el body.
    if (id_status !== undefined) {
        sql += ', id_status';
        values.push(id_status);
        placeholders.push('?');
    }

    // Finalizar la construcción de la sentencia SQL.
    sql += ') VALUES (' + placeholders.join(', ') + ')'; // Une los placeholders: (?, ?) o (?)

    // Ejecutamos la consulta.
    const result = await query(sql, values);

    // Obtenemos el ID del registro insertado.
    const newEmpresaId = result.insertId;

    // Enviamos una respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Empresa creada exitosamente',
      id: newEmpresaId,
      nombre: nombre // Devolvemos el nombre para confirmación.
    });

  } catch (error) {
    console.error('Error al crear empresa:', error);
    // === Manejo de Errores Específicos ===
    // Si el error es por duplicación del nombre (UNIQUE constraint).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El nombre de empresa "${req.body.nombre}" ya existe.`,
           error: error.message
       });
    } else {
        // Para cualquier otro error, pasarlo al manejador global.
        next(error);
    }
  }
};

// [PUT] /api/empresas/:id
// Actualiza un registro existente en la tabla 'empresas' por su ID.
const updateEmpresa = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la empresa a actualizar y los datos del body.
    const { id } = req.params;
    const { nombre, id_status } = req.body; // Campos que se pueden actualizar.

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar.
    if (nombre === undefined && id_status === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos nombre o id_status para actualizar.' });
    }

    // Validar si el id_status proporcionado existe (si se intentó actualizar).
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }
    // fecha_actualizacion se actualiza automáticamente en la DB.

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE empresas SET ';
    const params = []; // Valores para los placeholders.
    const updates = []; // Partes de la sentencia SET.

    if (nombre !== undefined) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
    if (id_status !== undefined) {
        updates.push('id_status = ?');
        params.push(id_status);
    }

    // Unir las partes SET y añadir la cláusula WHERE.
    sql += updates.join(', '); // une con comas
    sql += ' WHERE id = ?';
    params.push(id); // El ID del registro a actualizar siempre va al final.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, generalmente significa que el ID no fue encontrado.
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      // Si al menos 1 fila afectada, la actualización fue exitosa (200 OK).
      res.status(200).json({ message: `Empresa con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar empresa con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejo para el error de duplicación del nombre.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({
           message: `El nombre de empresa "${req.body.nombre}" ya existe.`,
           error: error.message
       });
     } else {
        // Para cualquier otro error, pasarlo al manejador global.
        next(error);
     }
  }
};

// [DELETE] /api/empresas/:id
// Elimina un registro de la tabla 'empresas' por su ID.
const deleteEmpresa = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la empresa a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM empresas WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta. result.affectedRows indica cuántas filas se eliminaron.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      // Si al menos 1 fila afectada, la eliminación fue exitosa (200 OK).
      res.status(200).json({ message: `Empresa con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar empresa con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si intentas eliminar una empresa que está siendo referenciada por otra tabla
     // (ej. sucursales) debido a ON DELETE RESTRICT en la FK.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar la empresa con ID ${req.params.id} porque tiene sucursales asociadas.`,
            error: error.message
        });
     } else {
        // Para cualquier otro error, pasarlo al manejador global.
        next(error);
     }
  }
};

// Exportamos todas las funciones del controlador para que puedan ser usadas por las rutas.
module.exports = {
  getAllEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
};