// src/controllers/notas.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Notas.
// Permite adjuntar notas a equipos, mantenimientos o cuentas de email.

const { query } = require('../config/db'); // Importamos la función de consulta DB.

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/notas
// Obtiene y devuelve todos los registros de la tabla 'notas'.
// Incluye detalles básicos de las entidades asociadas (equipo, mantenimiento, email, usuario creador).
const getAllNotas = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL con LEFT JOINs para las entidades opcionales asociadas.
    // Incluimos nombre de usuario creador, detalles básicos del equipo, etc.
    const sql = `
      SELECT
        n.id,
        n.titulo,
        n.contenido,
        n.id_equipo,
        e.numero_serie AS equipo_numero_serie, -- Detalles del equipo asociado.
        e.nombre_equipo AS equipo_nombre,
        n.id_mantenimiento,
        m.fecha_inicio AS mantenimiento_fecha_inicio, -- Detalles del mantenimiento asociado.
        n.id_cuenta_email,
        ce.email AS cuenta_email_email, -- Detalles de la cuenta de email asociada.
        n.id_usuario_creacion,
        us.username AS usuario_creacion_username, -- Nombre de usuario que creó la nota.
        n.fecha_creacion,
        n.fecha_actualizacion -- Incluido el campo de última actualización.
      FROM notas AS n
      LEFT JOIN equipos AS e ON n.id_equipo = e.id -- LEFT JOIN porque id_equipo es NULLable.
      LEFT JOIN mantenimientos AS m ON n.id_mantenimiento = m.id -- LEFT JOIN porque id_mantenimiento es NULLable.
      LEFT JOIN cuentas_email_corporativo AS ce ON n.id_cuenta_email = ce.id -- LEFT JOIN porque id_cuenta_email es NULLable.
      LEFT JOIN usuarios_sistema AS us ON n.id_usuario_creacion = us.id -- LEFT JOIN porque id_usuario_creacion es NULLable.
    `;
    // Ejecutamos la consulta.
    const notas = await query(sql);

    // Enviamos la lista de notas como respuesta JSON (200 OK).
    res.status(200).json(notas);

  } catch (error) {
    console.error('Error al obtener todas las notas:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/notas/:id
// Obtiene y devuelve un registro de nota específico por su ID.
// Incluye detalles básicos de las entidades asociadas.
const getNotaById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la nota.
    const { id } = req.params;

    // Consulta SQL para seleccionar una nota por ID con LEFT JOINs.
    const sql = `
      SELECT
        n.id,
        n.titulo,
        n.contenido,
        n.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        e.nombre_equipo AS equipo_nombre,
        n.id_mantenimiento,
        m.fecha_inicio AS mantenimiento_fecha_inicio,
        n.id_cuenta_email,
        ce.email AS cuenta_email_email,
        n.id_usuario_creacion,
        us.username AS usuario_creacion_username,
        n.fecha_creacion,
        n.fecha_actualizacion
      FROM notas AS n
      LEFT JOIN equipos AS e ON n.id_equipo = e.id
      LEFT JOIN mantenimientos AS m ON n.id_mantenimiento = m.id
      LEFT JOIN cuentas_email_corporativo AS ce ON n.id_cuenta_email = ce.id
      LEFT JOIN usuarios_sistema AS us ON n.id_usuario_creacion = us.id
      WHERE n.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const notas = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (notas.length === 0) {
      // Si el array está vacío, la nota no fue encontrada (404 Not Found).
      res.status(404).json({ message: `Nota con ID ${id} no encontrada.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(notas[0]);
    }

  } catch (error) {
    console.error(`Error al obtener nota con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/notas
// Crea un nuevo registro en la tabla 'notas'.
// Incluye validaciones para campos obligatorios y FKs.
// Requiere que al menos una de las FKs de entidad (equipo, mantenimiento, email) esté presente.
const createNota = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos del body. contenido es obligatorio.
    // titulo, id_equipo, id_mantenimiento, id_cuenta_email, id_usuario_creacion son opcionales.
    const {
        titulo, contenido, id_equipo, id_mantenimiento,
        id_cuenta_email, id_usuario_creacion
    } = req.body;

    // === Validaciones ===
    // Validar campo obligatorio: contenido.
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ message: 'El campo contenido es obligatorio y no puede estar vacío.' });
    }

    // === Regla de Negocio: La nota debe estar asociada al menos a una entidad ===
    // Al menos uno de id_equipo, id_mantenimiento, id_cuenta_email debe ser proporcionado y no nulo.
    if (!id_equipo && !id_mantenimiento && !id_cuenta_email) {
         return res.status(400).json({ message: 'La nota debe estar asociada a un equipo, mantenimiento o cuenta de email.' });
    }
    // Si alguno se proporcionó como null explícitamente, también cuenta como no asociado.
    if (id_equipo === null && id_mantenimiento === null && id_cuenta_email === null) {
         return res.status(400).json({ message: 'La nota debe estar asociada a un equipo, mantenimiento o cuenta de email (los IDs no pueden ser todos nulos si se proporcionan).' });
    }


    // Validar FK id_equipo si se proporciona y no es NULL.
    if (id_equipo !== undefined && id_equipo !== null) {
        const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
        if (equipoExists.length === 0) {
            return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
        }
    }

    // Validar FK id_mantenimiento si se proporciona y no es NULL.
    if (id_mantenimiento !== undefined && id_mantenimiento !== null) {
        const mantenimientoExists = await query('SELECT id FROM mantenimientos WHERE id = ?', [id_mantenimiento]);
        if (mantenimientoExists.length === 0) {
            return res.status(400).json({ message: `El ID de mantenimiento ${id_mantenimiento} no es válido.` });
        }
    }

    // Validar FK id_cuenta_email si se proporciona y no es NULL.
    if (id_cuenta_email !== undefined && id_cuenta_email !== null) {
        const cuentaEmailExists = await query('SELECT id FROM cuentas_email_corporativo WHERE id = ?', [id_cuenta_email]);
        if (cuentaEmailExists.length === 0) {
            return res.status(400).json({ message: `El ID de cuenta de email ${id_cuenta_email} no es válido.` });
        }
    }

    // Validar FK id_usuario_creacion si se proporciona y no es NULL.
    // NOTA: En un sistema con autenticación, id_usuario_creacion debería obtenerse del usuario autenticado,
    // no del body de la petición por seguridad. Por ahora, lo validamos si se envía.
    if (id_usuario_creacion !== undefined && id_usuario_creacion !== null) {
        const usuarioExists = await query('SELECT id FROM usuarios_sistema WHERE id = ?', [id_usuario_creacion]);
        if (usuarioExists.length === 0) {
            return res.status(400).json({ message: `El ID de usuario creador ${id_usuario_creacion} no es válido.` });
        }
    }


    // Consulta SQL para insertar. Construimos dinámicamente para campos opcionales.
    let sql = 'INSERT INTO notas (contenido'; // contenido es el único siempre requerido.
    const values = [contenido];
    const placeholders = ['?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si se envía null o cadena vacía para los que lo permiten.
    if (titulo !== undefined) { sql += ', titulo'; placeholders.push('?'); values.push(titulo === null || titulo.trim() === '' ? null : titulo); } // NULLable
    if (id_equipo !== undefined) { sql += ', id_equipo'; placeholders.push('?'); values.push(id_equipo); } // NULLable
    if (id_mantenimiento !== undefined) { sql += ', id_mantenimiento'; placeholders.push('?'); values.push(id_mantenimiento); } // NULLable
    if (id_cuenta_email !== undefined) { sql += ', id_cuenta_email'; placeholders.push('?'); values.push(id_cuenta_email); } // NULLable
    if (id_usuario_creacion !== undefined) { sql += ', id_usuario_creacion'; placeholders.push('?'); values.push(id_usuario_creacion); } // NULLable


    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newNotaId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Nota creada exitosamente',
      id: newNotaId,
      // Podemos devolver el título y parte del contenido para confirmación
      titulo: titulo,
      contenido_preview: contenido.substring(0, 50) + (contenido.length > 50 ? '...' : '')
    });

  } catch (error) {
    console.error('Error al crear nota:', error);
    // No hay UNIQUE constraints en esta tabla. Cualquier error será probablemente de la DB o SQL.
    next(error); // Pasar error al manejador global.
  }
};

// [PUT] /api/notas/:id
// Actualiza un registro existente en la tabla 'notas' por su ID.
// Incluye validaciones y mantiene la regla de asociación a entidad.
const updateNota = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const {
        titulo, contenido, id_equipo, id_mantenimiento,
        id_cuenta_email, id_usuario_creacion
    } = req.body;

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar (excluyendo el ID).
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }

    // Validar que contenido si se intenta actualizar, no esté vacío.
     if (contenido !== undefined && (contenido === null || contenido.trim() === '')) { // contenido es NOT NULL en DB.
         return res.status(400).json({ message: 'El campo contenido no puede estar vacío.' });
     }

    // Validar FKs si se intentan actualizar y no son NULL.
    if (id_equipo !== undefined && id_equipo !== null) {
        const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
        if (equipoExists.length === 0) {
            return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
        }
    }
    if (id_mantenimiento !== undefined && id_mantenimiento !== null) {
        const mantenimientoExists = await query('SELECT id FROM mantenimientos WHERE id = ?', [id_mantenimiento]);
        if (mantenimientoExists.length === 0) {
            return res.status(400).json({ message: `El ID de mantenimiento ${id_mantenimiento} no es válido.` });
        }
    }
    if (id_cuenta_email !== undefined && id_cuenta_email !== null) {
        const cuentaEmailExists = await query('SELECT id FROM cuentas_email_corporativo WHERE id = ?', [id_cuenta_email]);
        if (cuentaEmailExists.length === 0) {
            return res.status(400).json({ message: `El ID de cuenta de email ${id_cuenta_email} no es válido.` });
        }
    }
     // Validar FK id_usuario_creacion si se proporciona y no es NULL.
     if (id_usuario_creacion !== undefined && id_usuario_creacion !== null) {
         const usuarioExists = await query('SELECT id FROM usuarios_sistema WHERE id = ?', [id_usuario_creacion]);
         if (usuarioExists.length === 0) {
             return res.status(400).json({ message: `El ID de usuario creador ${id_usuario_creacion} no es válido.` });
         }
     }


    // === Regla de Negocio: La nota DEBE seguir asociada a AL MENOS una entidad después de la actualización ===
    // Necesitamos saber los valores actuales de las FKs si no se están actualizando.
    let currentNota = null;
    if (id_equipo === undefined || id_mantenimiento === undefined || id_cuenta_email === undefined) {
        // Si alguna de las FKs de entidad no está en el body, consultamos el registro actual.
        const result = await query('SELECT id_equipo, id_mantenimiento, id_cuenta_email FROM notas WHERE id = ?', [id]);
        if (result.length === 0) {
             // El registro a actualizar no existe. Devolver 404.
             return res.status(404).json({ message: `Nota con ID ${id} no encontrada.` });
        }
        currentNota = result[0];
    }

    // Determinamos los valores FINALES de las FKs después de la actualización.
    const final_id_equipo = id_equipo !== undefined ? id_equipo : (currentNota ? currentNota.id_equipo : undefined);
    const final_id_mantenimiento = id_mantenimiento !== undefined ? id_mantenimiento : (currentNota ? currentNota.id_mantenimiento : undefined);
    const final_id_cuenta_email = id_cuenta_email !== undefined ? id_cuenta_email : (currentNota ? currentNota.id_cuenta_email : undefined);

    // Aplicamos la regla: al menos uno de los valores FINALES debe ser NO NULO.
    if (final_id_equipo === null && final_id_mantenimiento === null && final_id_cuenta_email === null) {
         return res.status(400).json({ message: 'Después de la actualización, la nota debe seguir asociada a un equipo, mantenimiento o cuenta de email.' });
    }


    // fecha_actualizacion se actualiza automáticamente en la DB.

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE notas SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    if (titulo !== undefined) { updates.push('titulo = ?'); params.push(titulo === null || titulo.trim() === '' ? null : titulo); } // NULLable, convertir "" a null
    if (contenido !== undefined) { updates.push('contenido = ?'); params.push(contenido); } // NOT NULL
    if (id_equipo !== undefined) { updates.push('id_equipo = ?'); params.push(id_equipo); } // NULLable
    if (id_mantenimiento !== undefined) { updates.push('id_mantenimiento = ?'); params.push(id_mantenimiento); } // NULLable
    if (id_cuenta_email !== undefined) { updates.push('id_cuenta_email = ?'); params.push(id_cuenta_email); } // NULLable
    if (id_usuario_creacion !== undefined) { updates.push('id_usuario_creacion = ?'); params.push(id_usuario_creacion); } // NULLable


    // Si no hay campos para actualizar (aparte del ID), ya se manejó al inicio.
     if (updates.length === 0) {
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0 && !currentNota) { // Si no encontramos la nota al inicio, ya devolvimos 404.
        // Si llegamos aquí y affectedRows es 0, significa que el ID existía, pero no se cambió nada,
        // o hubo algún otro problema que la DB no reportó como error.
        // Consideramos que no fue encontrada si currentNota era null (lo que significa que el SELECT inicial falló).
        // Si currentNota existía, 0 affectedRows solo significa que no hubo cambios en los valores, lo cual es un éxito para PUT.
         res.status(200).json({ message: `Nota con ID ${id} actualizada exitosamente (o sin cambios).` });
    } else if (result.affectedRows > 0) {
      // Éxito (200 OK).
      res.status(200).json({ message: `Nota con ID ${id} actualizada exitosamente.` });
    } else {
         // Caso en que currentNota existía pero affectedRows es 0 - ya cubierto arriba con mensaje "o sin cambios".
          res.status(200).json({ message: `Nota con ID ${id} actualizada exitosamente (o sin cambios).` });
    }


  } catch (error) {
    console.error(`Error al actualizar nota con ID ${req.params.id}:`, error);
    // No hay UNIQUE constraints. Cualquier error será de la DB o SQL (ej. FK inválida no capturada).
    next(error); // Pasar error al manejador global.
  }
};

// [DELETE] /api/notas/:id
// Elimina un registro de la tabla 'notas' por su ID.
const deleteNota = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la nota a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM notas WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Nota con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Nota con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar nota con ID ${req.params.id}:`, error);
     // No hay FKs que restrinjan la eliminación de una nota (las FKs van *desde* notas).
     // Este catch atraparía errores de la DB o SQL no relacionados con FK referenciada.
     next(error); // Pasar error al manejador global.
  }
};

// Exportamos las funciones del controlador.
module.exports = {
  getAllNotas,
  getNotaById,
  createNota,
  updateNota,
  deleteNota,
};