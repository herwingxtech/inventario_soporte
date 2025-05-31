// src/controllers/mantenimientos.controller.js
// ! Controlador para la entidad Mantenimientos
// * Aquí registro el historial de servicio de los equipos: creación, consulta, actualización y eliminación de mantenimientos.
// * Incluye validaciones de fechas, costos y relaciones con equipos y status.

const { query } = require('../config/db'); // Importamos la función de consulta DB.

// ===============================================================
// FUNCIONES DE VALIDACIÓN (Ayuda a mantener el código limpio)
// ===============================================================

// * Función de ayuda para validar formato básico de fecha (YYYY-MM-DD) de forma segura (UTC)
// * Devuelve true si el string coincide con el formato y es una fecha real válida.
function isValidDate(dateString) {
    // * Permito null/vacío si el campo no es obligatorio.
    if (!dateString) return true; // Permitir null/vacío para campos no obligatorios.
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false; // Es 'Invalid Date'.

    const [year, month, day] = dateString.split('-').map(Number);
    // * Uso métodos UTC para evitar problemas de zona horaria.
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}


// ===============================================================
// * Funciones controladoras para cada endpoint de mantenimientos
// ===============================================================

// * [GET] /api/mantenimientos - Trae todos los mantenimientos con JOINs a equipos y status
const getAllMantenimientos = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada mantenimiento
    const sql = `
      SELECT
        m.id,
        m.id_equipo,
        e.numero_serie AS equipo_numero_serie, -- Detalles del equipo asociado.
        e.nombre_equipo AS equipo_nombre,
        m.fecha_inicio,
        m.fecha_fin,
        m.diagnostico,
        m.solucion,
        m.costo,
        m.proveedor,
        m.fecha_registro,
        m.fecha_actualizacion, -- Incluido el campo de última actualización.
        m.id_status,
        st.nombre_status AS status_nombre -- Nombre del status del mantenimiento.
      FROM mantenimientos AS m
      JOIN equipos AS e ON m.id_equipo = e.id -- INNER JOIN porque id_equipo NO es NULLable.
      JOIN status AS st ON m.id_status = st.id -- INNER JOIN porque id_status NO es NULLable.
    `;
    // Ejecutamos la consulta.
    const mantenimientos = await query(sql);

    // * Devuelvo la lista como JSON
    res.status(200).json(mantenimientos);

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los mantenimientos:', error);
    next(error); // Pasar error al middleware global.
  }
};

// * [GET] /api/mantenimientos/:id - Trae un mantenimiento específico por su ID (con relaciones)
const getMantenimientoById = async (req, res, next) => {
  try {
    // * Extraigo el ID desde los parámetros de la URL
    const { id } = req.params;

    // * Consulta SQL con JOINs para traer el mantenimiento y sus relaciones
    const sql = `
       SELECT
        m.id,
        m.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        e.nombre_equipo AS equipo_nombre,
        m.fecha_inicio,
        m.fecha_fin,
        m.diagnostico,
        m.solucion,
        m.costo,
        m.proveedor,
        m.fecha_registro,
        m.fecha_actualizacion, -- Incluido.
        m.id_status,
        st.nombre_status AS status_nombre
      FROM mantenimientos AS m
      JOIN equipos AS e ON m.id_equipo = e.id
      JOIN status AS st ON m.id_status = st.id
      WHERE m.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const mantenimientos = await query(sql, params); // query siempre devuelve un array.

    // * Si no existe, devuelvo 404
    if (mantenimientos.length === 0) {
      // Si el array está vacío, el mantenimiento no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
    } else {
      // * Si existe, devuelvo el objeto
      res.status(200).json(mantenimientos[0]);
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener registro de mantenimiento con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// * [POST] /api/mantenimientos - Crea un nuevo mantenimiento con validaciones
const createMantenimiento = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. Algunos campos son obligatorios, otros opcionales.
    // * Valido fechas, costos y existencia de FKs
    const {
        id_equipo, fecha_inicio, fecha_fin, diagnostico, solucion,
        costo, proveedor, id_status
    } = req.body;

    // === Validaciones ===
    // Validar campos obligatorios.
    if (id_equipo === undefined || !fecha_inicio) { // fecha_inicio debe ser un string no vacío
      return res.status(400).json({ message: 'Los campos id_equipo y fecha_inicio son obligatorios.' });
    }

    // Validar formato de fechas.
     if (!isValidDate(fecha_inicio)) {
          return res.status(400).json({ message: 'El formato de fecha_inicio debe ser YYYY-MM-DD.' });
     }
     // fecha_fin es NULLable, solo validar si se proporciona.
     if (fecha_fin !== undefined && fecha_fin !== null) {
         if (!isValidDate(fecha_fin)) {
              return res.status(400).json({ message: 'El formato de fecha_fin debe ser YYYY-MM-DD.' });
         }
          // Validar que fecha_fin no sea anterior a fecha_inicio si ambas están presentes.
         if (new Date(fecha_fin) < new Date(fecha_inicio)) {
             return res.status(400).json({ message: 'La fecha_fin no puede ser anterior a la fecha_inicio.' });
         }
     } else if (fecha_fin === '') { // Si envían cadena vacía para fecha_fin, tratar como null.
         fecha_fin = null; // Asignar null para que se guarde correctamente en la DB.
     }


    // Validar si id_equipo proporcionado existe (FK).
    const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
    if (equipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
    }

    // Validar si id_status proporcionado existe (si se envió y no es NULL).
     if (id_status !== undefined && id_status !== null) { // id_status es NOT NULL en DB.
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }
    // Si id_status es undefined, la DB usa el DEFAULT (1).


    // Validar costo si se proporciona (debe ser un número, opcionalmente decimal).
     if (costo !== undefined && costo !== null) {
         // Check if it's a number or a string that can be parsed as a number (including decimals).
         // isFinite() verifica que es un número finito y no NaN, Infinity, -Infinity.
         if (typeof costo !== 'number' && typeof costo !== 'string' || !isFinite(parseFloat(costo))) {
              return res.status(400).json({ message: 'El campo costo debe ser un número válido.' });
         }
         // Opcional: Puedes redondear a 2 decimales si lo necesitas antes de guardar,
         // aunque la DB lo hará si la columna es DECIMAL(10, 2).
         // costo = parseFloat(costo).toFixed(2); // Si decides convertir a string con 2 decimales.
     } else if (costo === '') { // Si envían cadena vacía para costo, tratar como null.
         costo = null;
     }


    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO mantenimientos (id_equipo, fecha_inicio';
    const values = [id_equipo, fecha_inicio];
    const placeholders = ['?', '?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined/null o vacíos si no se permiten).
    // fecha_fin, diagnostico, solucion, costo, proveedor, id_status son NULLable o tienen DEFAULT.
    if (fecha_fin !== undefined && fecha_fin !== null) { sql += ', fecha_fin'; placeholders.push('?'); values.push(fecha_fin); } // null ya manejado arriba si era "".
    if (diagnostico !== undefined && diagnostico !== null) { sql += ', diagnostico'; placeholders.push('?'); values.push(diagnostico === null || diagnostico.trim() === '' ? null : diagnostico); } // NULLable
    if (solucion !== undefined && solucion !== null) { sql += ', solucion'; placeholders.push('?'); values.push(solucion === null || solucion.trim() === '' ? null : solucion); } // NULLable
    if (costo !== undefined && costo !== null) { sql += ', costo'; placeholders.push('?'); values.push(costo); } // NULLable
    if (proveedor !== undefined && proveedor !== null) { sql += ', proveedor'; placeholders.push('?'); values.push(proveedor === null || proveedor.trim() === '' ? null : proveedor); } // NULLable
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); } // NOT NULL, ya validado que no sea null. Si undefined, DB usa DEFAULT.


    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newMantenimientoId = result.insertId; // ID del registro insertado.

    // * Devuelvo el ID y datos clave del nuevo mantenimiento
    res.status(201).json({
      message: 'Registro de mantenimiento creado exitosamente',
      id: newMantenimientoId,
      id_equipo: id_equipo,
      fecha_inicio: fecha_inicio
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear registro de mantenimiento:', error);
    // En esta tabla, no hay UNIQUE constraints que puedan causar ER_DUP_ENTRY en la creación simple.
    // Cualquier error aquí probablemente será de la DB (ej. FK inválida no capturada, error SQL, conexión).
    next(error); // Pasar error al manejador global.
  }
};

// * [PUT] /api/mantenimientos/:id - Actualiza un mantenimiento por su ID
const updateMantenimiento = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
        id_equipo, fecha_inicio, fecha_fin, diagnostico, solucion,
        costo, proveedor, id_status
    } = req.body;

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar (excluyendo el ID).
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }

    // Validar formato de fechas si se intentan actualizar.
    // fecha_inicio es NOT NULL, si se actualiza, no puede ser null/vacío y debe tener formato válido.
     if (fecha_inicio !== undefined && fecha_inicio !== null && fecha_inicio.trim() === '') {
         return res.status(400).json({ message: 'El campo fecha_inicio no puede estar vacío.' });
     }
     if (fecha_inicio !== undefined && fecha_inicio !== null) {
         if (!isValidDate(fecha_inicio)) {
              return res.status(400).json({ message: 'El formato de fecha_inicio debe ser YYYY-MM-DD.' });
         }
     }
     // fecha_fin es NULLable, validar si se proporciona (puede ser null).
     if (fecha_fin !== undefined && fecha_fin !== null) { // Permitir explícitamente enviar null
         if (!isValidDate(fecha_fin)) {
              return res.status(400).json({ message: 'El formato de fecha_fin debe ser YYYY-MM-DD.' });
         }
     } else if (fecha_fin === '') { // Si envían cadena vacía para fecha_fin, tratar como null.
         fecha_fin = null; // Asignar null para que se guarde correctamente en la DB.
     }

    // Validar relación entre fecha_inicio y fecha_fin SI AMBAS están presentes
    // (ya sea porque ambas se envían en el body, o una se envía y la otra ya existía en la DB).
    // Esto requiere OBTENER el registro actual si solo se envía una fecha.
    let final_fecha_inicio = fecha_inicio;
    let final_fecha_fin = fecha_fin;

    // Si alguna de las fechas está undefined en el body, necesitamos el valor actual.
    if (final_fecha_inicio === undefined || final_fecha_fin === undefined) {
         const currentMantenimiento = await query('SELECT fecha_inicio, fecha_fin FROM mantenimientos WHERE id = ?', [id]);
         if (currentMantenimiento.length === 0) {
             // El registro a actualizar no existe. Devolver 404.
             // Esto podría manejarse más adelante si el UPDATE affectedRows es 0,
             // pero validar aquí permite dar un error más temprano si la lógica de fecha depende de ello.
              return res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
         }
         // Si la fecha no fue enviada en el body, usamos el valor actual de la DB.
         if (final_fecha_inicio === undefined) final_fecha_inicio = currentMantenimiento[0].fecha_inicio;
         if (final_fecha_fin === undefined) final_fecha_fin = currentMantenimiento[0].fecha_fin;
    }

    // Ahora que tenemos los valores FINALES para fecha_inicio y fecha_fin, validamos la lógica.
    // Asegurarse de que final_fecha_inicio y final_fecha_fin son objetos Date válidos si no son null/undefined.
    // La función isValidDate ya chequea el formato string y si es fecha real. Aquí comparamos los valores.
    // Convertimos a objetos Date para la comparación.
    const dateInicio = final_fecha_inicio ? new Date(final_fecha_inicio) : null;
    const dateFin = final_fecha_fin ? new Date(final_fecha_fin) : null;

    if (dateInicio && dateFin && dateFin < dateInicio) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }


    // Validar si id_equipo existe (si se intenta actualizar y no es NULL).
    if (id_equipo !== undefined && id_equipo !== null) { // id_equipo es NOT NULL en DB.
        const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
        if (equipoExists.length === 0) {
            return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
        }
    } else if (id_equipo === null) {
         return res.status(400).json({ message: 'El campo id_equipo no puede ser nulo.' });
    }

    // Validar si id_status existe (si se intenta actualizar y no es NULL).
     if (id_status !== undefined && id_status !== null) { // id_status es NOT NULL en DB.
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }

    // Validar costo si se proporciona (puede ser null).
     if (costo !== undefined && costo !== null) { // Permitir explícitamente enviar null.
         if (typeof costo !== 'number' && typeof costo !== 'string' || !isFinite(parseFloat(costo))) {
              return res.status(400).json({ message: 'El campo costo debe ser un número válido.' });
         }
     } else if (costo === '') { // Si envían cadena vacía, tratar como null.
         costo = null;
     }


    // fecha_actualizacion se actualiza automáticamente en la DB.

    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE mantenimientos SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    if (id_equipo !== undefined) { updates.push('id_equipo = ?'); params.push(id_equipo); } // NOT NULL
    if (fecha_inicio !== undefined) { updates.push('fecha_inicio = ?'); params.push(fecha_inicio); } // NOT NULL
    if (fecha_fin !== undefined) { updates.push('fecha_fin = ?'); params.push(fecha_fin === null ? null : fecha_fin); } // NULLable (ya manejamos "" -> null)
    if (diagnostico !== undefined) { updates.push('diagnostico = ?'); params.push(diagnostico === null || diagnostico.trim() === '' ? null : diagnostico); } // NULLable
    if (solucion !== undefined) { updates.push('solucion = ?'); params.push(solucion === null || solucion.trim() === '' ? null : solucion); } // NULLable
    if (costo !== undefined) { updates.push('costo = ?'); params.push(costo); } // NULLable (ya manejamos "" -> null)
    if (proveedor !== undefined) { updates.push('proveedor = ?'); params.push(proveedor === null || proveedor.trim() === '' ? null : proveedor); } // NULLable
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); } // NOT NULL


    // Si no hay campos para actualizar, ya se manejó al inicio.
     if (updates.length === 0) {
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // * Devuelvo mensaje de éxito o 404 si no existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no fue encontrado (y no se manejó en la validación de fechas al inicio).
      res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Registro de mantenimiento con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar registro de mantenimiento con ID ${req.params.id}:`, error);
    // No hay UNIQUE constraints en esta tabla que causen ER_DUP_ENTRY en UPDATE.
    // Cualquier otro error probablemente será de la DB o SQL.
    next(error); // Pasar error al manejador global.
  }
};

// * [DELETE] /api/mantenimientos/:id - Elimina un mantenimiento por su ID
const deleteMantenimiento = async (req, res, next) => {
  try {
    // * Extraigo el ID del mantenimiento a eliminar
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM mantenimientos WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // * Ejecuto el DELETE y reviso si realmente existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Registro de mantenimiento con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Registro de mantenimiento con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar registro de mantenimiento con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usada por notas (ON DELETE CASCADE), aunque CASCADE debería prevenir este error.
     // ER_ROW_IS_REFERENCED_2 podría ocurrir si hubiera otros problemas.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el registro de mantenimiento con ID ${req.params.id} porque está siendo utilizado por otros registros.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllMantenimientos,
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
};