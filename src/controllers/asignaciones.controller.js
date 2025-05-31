// src/controllers/asignaciones.controller.js
// ! Controlador para la entidad Asignaciones
// * Aquí gestiono la relación entre equipos, ubicaciones, personas, IPs, etc. Incluye validaciones de negocio y reglas de integridad.
// * Esta tabla es el corazón del inventario, relacionando equipos con sus ubicaciones, personas, IPs, etc.
// * Incluye validaciones de reglas de negocio clave para asignaciones activas.

const { query } = require('../config/db'); // Importamos la función de consulta DB.

// ===============================================================
// * Función de ayuda para validar formato de fecha y hora (YYYY-MM-DD o YYYY-MM-DD HH:mm:ss)
// * Devuelve true si el string coincide con el formato y es una fecha real válida.
function isValidDateTime(dateTimeString) {
    // * Permito null/vacío si el campo no es obligatorio.
    if (!dateTimeString) return true;

    const regex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
    if (!regex.test(dateTimeString)) return false;

    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return false; // Es 'Invalid Date'.

    // * Si es solo fecha (YYYY-MM-DD), validamos componentes UTC.
     if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
         const [year, month, day] = dateTimeString.split('-').map(Number);
         return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
     }

    // * Si es fecha+hora, confío en que Date() lo parseó bien si no fue Invalid Date.
    return true;
}


// ===============================================================
// * Funciones controladoras para cada endpoint de asignaciones
// ===============================================================

// [GET] /api/asignaciones
// * Trae todas las asignaciones, permite filtrar por query params
const getAllAsignaciones = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // * Extraigo posibles filtros de la query string (equipo, empleado, sucursal, área, IP, activa)
    // Usamos nombres más amigables para los query params (ej: equipoId en lugar de id_equipo).
    const { equipoId, empleadoId, activa, sucursalId, areaId, ipId } = req.query; // Añadidos filtros por sucursal, area, ip.

    // * Construyo la consulta SQL base con LEFT JOINs para traer toda la info relevante
    const sqlBase = `
      SELECT
        a.id,
        a.id_equipo,
        e.numero_serie AS equipo_numero_serie, -- Detalles del equipo asignado.
        e.nombre_equipo AS equipo_nombre,
        a.id_empleado,
        emp.nombres AS empleado_nombres, -- Detalles del empleado asignado.
        emp.apellidos AS empleado_apellidos,
        a.id_sucursal_asignado,
        s.nombre AS sucursal_asignada_nombre, -- Detalles de la sucursal asignada.
        a.id_area_asignado,
        ar.nombre AS area_asignada_nombre, -- Detalles del area asignada.
        a.id_equipo_padre,
        ep.numero_serie AS equipo_padre_numero_serie, -- Detalles del equipo padre.
        ep.nombre_equipo AS equipo_padre_nombre,
        a.id_ip,
        ip.direccion_ip AS ip_direccion, -- Detalles de la IP asignada.
        a.fecha_asignacion,
        a.fecha_fin_asignacion,
        a.observacion,
        a.fecha_registro,
        a.fecha_actualizacion, -- Incluido el campo de última actualización.
        a.id_status_asignacion,
        st.nombre_status AS status_nombre -- Nombre del status de la asignación.
      FROM asignaciones AS a
      JOIN equipos AS e ON a.id_equipo = e.id -- INNER JOIN.
      LEFT JOIN empleados AS emp ON a.id_empleado = emp.id -- LEFT JOIN.
      LEFT JOIN sucursales AS s ON a.id_sucursal_asignado = s.id -- LEFT JOIN.
      LEFT JOIN areas AS ar ON a.id_area_asignado = ar.id -- LEFT JOIN.
      LEFT JOIN equipos AS ep ON a.id_equipo_padre = ep.id -- LEFT JOIN.
      LEFT JOIN direcciones_ip AS ip ON a.id_ip = ip.id -- LEFT JOIN.
      JOIN status AS st ON a.id_status_asignacion = st.id -- INNER JOIN.
    `;

    // * Construyo cláusulas WHERE dinámicamente según los filtros
    const whereClauses = [];
    const params = [];

    if (equipoId !== undefined) {
        whereClauses.push('a.id_equipo = ?');
        params.push(equipoId);
    }
    if (empleadoId !== undefined) {
        whereClauses.push('a.id_empleado = ?');
        params.push(empleadoId);
    }
     if (sucursalId !== undefined) {
         whereClauses.push('a.id_sucursal_asignado = ?');
         params.push(sucursalId);
     }
      if (areaId !== undefined) {
         whereClauses.push('a.id_area_asignado = ?');
         params.push(areaId);
     }
      if (ipId !== undefined) {
         whereClauses.push('a.id_ip = ?');
         params.push(ipId);
     }
    // Filtrar por asignaciones activas ('true') o históricas ('false')
    if (activa !== undefined) {
        if (activa === 'true') {
             whereClauses.push('a.fecha_fin_asignacion IS NULL');
        } else if (activa === 'false') {
             whereClauses.push('a.fecha_fin_asignacion IS NOT NULL');
        }
        // Si activa no es 'true' ni 'false', no añadimos filtro, mostramos todas.
    }

    // * Unir cláusulas WHERE si existen.
    const sql = whereClauses.length > 0
      ? `${sqlBase} WHERE ${whereClauses.join(' AND ')}`
      : sqlBase;

    // * Ejecuto la consulta y devuelvo el resultado
    const asignaciones = await query(sql, params);

    // * Enviamos la lista de asignaciones como respuesta JSON (200 OK).
    res.status(200).json(asignaciones);

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los registros de asignación:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/asignaciones/:id
// * Trae una asignación específica por su ID (con relaciones)
const getAsignacionById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // * Extraigo el ID desde los parámetros de la URL
    const { id } = req.params;

    // * Consulta SQL con JOINs para traer la asignación y sus relaciones
    const sql = `
      SELECT
        a.id,
        a.id_equipo,
        e.numero_serie AS equipo_numero_serie,
        e.nombre_equipo AS equipo_nombre,
        a.id_empleado,
        emp.nombres AS empleado_nombres,
        emp.apellidos AS empleado_apellidos,
        a.id_sucursal_asignado,
        s.nombre AS sucursal_asignada_nombre,
        a.id_area_asignado,
        ar.nombre AS area_asignada_nombre,
        a.id_equipo_padre,
        ep.numero_serie AS equipo_padre_numero_serie,
        ep.nombre_equipo AS equipo_padre_nombre,
        a.id_ip,
        ip.direccion_ip AS ip_direccion,
        a.fecha_asignacion,
        a.fecha_fin_asignacion,
        a.observacion,
        a.fecha_registro,
        a.fecha_actualizacion, -- Incluido.
        a.id_status_asignacion,
        st.nombre_status AS status_nombre
      FROM asignaciones AS a
      JOIN equipos AS e ON a.id_equipo = e.id
      LEFT JOIN empleados AS emp ON a.id_empleado = emp.id
      LEFT JOIN sucursales AS s ON a.id_sucursal_asignado = s.id
      LEFT JOIN areas AS ar ON a.id_area_asignado = ar.id
      LEFT JOIN equipos AS ep ON a.id_equipo_padre = ep.id
      LEFT JOIN direcciones_ip AS ip ON a.id_ip = ip.id
      JOIN status AS st ON a.id_status_asignacion = st.id
      WHERE a.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const asignaciones = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (asignaciones.length === 0) {
      // Si el array está vacío, la asignación no fue encontrada (404 Not Found).
      res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(asignaciones[0]);
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener registro de asignación con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/asignaciones
// * Crea una nueva asignación con validaciones de negocio
const createAsignacion = async (req, res, next) => { // Añadimos 'next'.
  try {
    // * Extraigo los datos del body. Algunos campos son obligatorios, otros opcionales.
    const {
        id_equipo, id_empleado, id_sucursal_asignado, id_area_asignado,
        id_equipo_padre, id_ip, fecha_asignacion, fecha_fin_asignacion,
        observacion, id_status_asignacion
    } = req.body;

    // * Validaciones de campos obligatorios y formatos
    // Validar campos obligatorios.
    if (id_equipo === undefined || id_equipo === null || !fecha_asignacion) {
      return res.status(400).json({ message: 'Los campos id_equipo y fecha_asignacion son obligatorios.' });
    }
     if (typeof fecha_asignacion !== 'string' || fecha_asignacion.trim() === '') {
        return res.status(400).json({ message: 'El campo fecha_asignacion no puede estar vacío.' });
     }

    // Validar formato de fechas.
     if (!isValidDateTime(fecha_asignacion)) {
          return res.status(400).json({ message: 'El formato de fecha_asignacion debe ser YYYY-MM-DD o YYYY-MM-DD HH:mm:ss.' });
     }
     // fecha_fin_asignacion es NULLable, solo validar si se proporciona y no es null/vacío.
     if (fecha_fin_asignacion !== undefined && fecha_fin_asignacion !== null && fecha_fin_asignacion.trim() !== '') {
         if (!isValidDateTime(fecha_fin_asignacion)) {
              return res.status(400).json({ message: 'El formato de fecha_fin_asignacion debe ser YYYY-MM-DD o YYYY-MM-DD HH:mm:ss.' });
         }
          // Validar que fecha_fin no sea anterior a fecha_inicio si ambas están presentes.
          // Convertir a objetos Date para la comparación.
         if (new Date(fecha_fin_asignacion) < new Date(fecha_asignacion)) {
             return res.status(400).json({ message: 'La fecha_fin_asignacion no puede ser anterior a la fecha_asignacion.' });
         }
     } else if (fecha_fin_asignacion === '') { // Si envían cadena vacía, tratar como null.
         fecha_fin_asignacion = null;
     }


    // * Valido reglas de negocio para asignaciones activas
    // Determinar si la asignación que se está creando será ACTIVA.
    const isCreatingActiveAssignment = (fecha_fin_asignacion === undefined || fecha_fin_asignacion === null);


    // * Valido existencia de FKs (equipo, empleado, sucursal, área, equipo padre, IP, status)
    // === Regla de Negocio 1 (Modificada): Para asignaciones ACTIVAS, DEBE estar asociada AL MENOS a un Empleado, Sucursal, o Área. ===
    // Contamos cuántas de las FKs de ubicación/persona están presentes y no son nulas.
    const locationFks = [id_empleado, id_sucursal_asignado, id_area_asignado];
    const nonNullOrUndefinedLocationFks = locationFks.filter(id => id !== undefined && id !== null);

    if (isCreatingActiveAssignment) {
        // *** CAMBIO AQUÍ ***: Ahora validamos que sea AL MENOS UNO.
        if (nonNullOrUndefinedLocationFks.length === 0) {
            return res.status(400).json({ message: 'Para una asignación activa, se debe especificar al menos uno de: id_empleado, id_sucursal_asignado, o id_area_asignado.' });
        }
        // No revalidamos aquí si el área pertenece a una sucursal corporativa, confiamos en validación de áreas.

        // Opcional: Validar combinación de asignaciones de ubicación/persona si no quieres permitir más de 1, 2, etc.
        // Por ahora, permitimos cualquier combinación de Empleado/Sucursal/Area siempre que sea al menos una para asignaciones activas.

    }
    // Para asignaciones HISTÓRICAS (fecha_fin_asignacion NOT NULL), no hay una restricción fuerte de asociación.
    // Podrían ser 0 o más asociaciones, ya que el registro solo documenta un estado pasado.


    // Validar FKs si se proporcionan y no son NULL.
    // id_equipo es NOT NULL.
    if (id_equipo !== undefined && id_equipo !== null) {
        const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
        if (equipoExists.length === 0) {
            return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
        }
    } else { /* Ya validado arriba que no sea null/undefined */ }

    // id_empleado es NULLable. Validar si existe si se proporciona y NO es NULL.
    if (id_empleado !== undefined && id_empleado !== null) {
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` });
        }
    } else if (id_empleado === null) { /* Permite null */ }


     // id_sucursal_asignado es NULLable. Validar si existe si se proporciona y NO es NULL.
    if (id_sucursal_asignado !== undefined && id_sucursal_asignado !== null) {
         const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_asignado]);
         if (sucursalExists.length === 0) {
             return res.status(400).json({ message: `El ID de sucursal_asignado ${id_sucursal_asignado} no es válido.` });
         }
    } else if (id_sucursal_asignado === null) { /* Permite null */ }

     // id_area_asignado es NULLable. Validar si existe si se proporciona y NO es NULL.
     if (id_area_asignado !== undefined && id_area_asignado !== null) {
         const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area_asignado]);
         if (areaExists.length === 0) {
             return res.status(400).json({ message: `El ID de area_asignado ${id_area_asignado} no es válido.` });
         }
     } else if (id_area_asignado === null) { /* Permite null */ }

     // id_equipo_padre es NULLable. Validar si existe si se proporciona y NO es NULL.
     if (id_equipo_padre !== undefined && id_equipo_padre !== null) {
         const equipoPadreExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo_padre]);
         if (equipoPadreExists.length === 0) {
             return res.status(400).json({ message: `El ID de equipo_padre ${id_equipo_padre} no es válido.` });
         }
         // Validar que equipo_padre no sea el mismo equipo que se está asignando.
         if (id_equipo_padre === id_equipo) { // Comparar con el id_equipo del body
              return res.status(400).json({ message: 'El equipo padre no puede ser el mismo equipo que se está asignando.' });
         }
     } else if (id_equipo_padre === null) { /* Permite null */ }


     // id_ip es NULLable. Validar si existe si se proporciona y NO es NULL.
     if (id_ip !== undefined && id_ip !== null) {
         const ipExists = await query('SELECT id FROM direcciones_ip WHERE id = ?', [id_ip]);
         if (ipExists.length === 0) {
             return res.status(400).json({ message: `El ID de IP ${id_ip} no es válido.` });
         }
     } else if (id_ip === null) { /* Permite null */ }


    // Validar si id_status_asignacion proporcionado existe (si se envió y no es NULL).
     if (id_status_asignacion !== undefined && id_status_asignacion !== null) { // NOT NULL en DB.
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status_asignacion]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status_asignacion ${id_status_asignacion} no es válido.` });
          }
     } else if (id_status_asignacion === null) {
         return res.status(400).json({ message: 'El campo id_status_asignacion no puede ser nulo.' });
     }
    // Si id_status_asignacion es undefined, la DB usa el DEFAULT (1).


    // * Valido reglas de negocio para asignaciones ACTIVAS
    // === Regla de Negocio 3 y 4: Para asignaciones ACTIVAS, el EQUIPO y la IP (si se asigna) deben ser únicos en otras asignaciones ACTIVAS ===
    // Esta validación solo aplica si estamos creando una asignación ACTIVA.
    if (isCreatingActiveAssignment) {
        // Check si el equipo ya tiene una asignación activa
        const existingActiveEquipoAssignment = await query(
            'SELECT id FROM asignaciones WHERE id_equipo = ? AND fecha_fin_asignacion IS NULL',
            [id_equipo]
        );
        if (existingActiveEquipoAssignment.length > 0) {
             return res.status(409).json({ message: `El equipo con ID ${id_equipo} ya tiene una asignación activa (ID ${existingActiveEquipoAssignment[0].id}). Finalice la asignación actual antes de crear una nueva activa.` });
        }

        // Check si la IP ya tiene una asignación activa (solo si se está asignando una IP)
        if (id_ip !== undefined && id_ip !== null) {
            const existingActiveIpAssignment = await query(
                'SELECT id FROM asignaciones WHERE id_ip = ? AND fecha_fin_asignacion IS NULL',
                [id_ip]
            );
             // Manejo del UNIQUE constraint general de id_ip en la tabla.
             // Si la validación anterior no lo capturó, la DB podría lanzar ER_DUP_ENTRY.
             // Lo manejamos en el catch general de ER_DUP_ENTRY.
            if (existingActiveIpAssignment.length > 0) {
                return res.status(409).json({ message: `La dirección IP con ID ${id_ip} ya está asignada en otro registro de asignación activa (ID ${existingActiveIpAssignment[0].id}).` });
            }
        }
    }
    // Para asignaciones históricas (isCreatingActiveAssignment es false), no hay restricciones de unicidad activa.


    // Opcional: Actualizar el status del equipo o IP en sus tablas principales... (decidimos no hacerlo automáticamente por ahora)


    // * Construyo la consulta SQL dinámicamente según los campos presentes
    // id_equipo y fecha_asignacion son los únicos campos base siempre requeridos en la sentencia INSERT.
    let sql = 'INSERT INTO asignaciones (id_equipo, fecha_asignacion';
    const values = [id_equipo, fecha_asignacion];
    const placeholders = ['?', '?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si se envía null o cadena vacía para los que lo permiten.
    if (id_empleado !== undefined) { sql += ', id_empleado'; placeholders.push('?'); values.push(id_empleado); } // NULLable
    if (id_sucursal_asignado !== undefined) { sql += ', id_sucursal_asignado'; placeholders.push('?'); values.push(id_sucursal_asignado); } // NULLable
    if (id_area_asignado !== undefined) { sql += ', id_area_asignado'; placeholders.push('?'); values.push(id_area_asignado); } // NULLable
    if (id_equipo_padre !== undefined) { sql += ', id_equipo_padre'; placeholders.push('?'); values.push(id_equipo_padre); } // NULLable
    if (id_ip !== undefined) { sql += ', id_ip'; placeholders.push('?'); values.push(id_ip); } // NULLable
    if (fecha_fin_asignacion !== undefined) { sql += ', fecha_fin_asignacion'; placeholders.push('?'); values.push(fecha_fin_asignacion); } // NULLable (ya manejamos "" -> null). Si undefined, no se inserta y queda NULL por default.
    if (observacion !== undefined) { sql += ', observacion'; placeholders.push('?'); values.push(observacion === null || observacion.trim() === '' ? null : observacion); } // NULLable
    if (id_status_asignacion !== undefined && id_status_asignacion !== null) { sql += ', id_status_asignacion'; placeholders.push('?'); values.push(id_status_asignacion); } // NOT NULL, ya validado que no sea null. Si undefined, DB usa DEFAULT.

    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // * Ejecuto la consulta y devuelvo el resultado
    const result = await query(sql, values);
    const newAsignacionId = result.insertId; // ID del registro insertado.

    // * Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Registro de asignación creado exitosamente',
      id: newAsignacionId,
      id_equipo: id_equipo,
      fecha_asignacion: fecha_asignacion,
      activa: isCreatingActiveAssignment // Indicamos si la asignación es activa.
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear registro de asignación:', error);
    // === Manejo de Errores Específicos ===
    // Manejar error de duplicación de `id_ip` (el UNIQUE constraint general en la tabla).
    // O si hay duplicidad de equipo/ip activa que nuestra validación de negocio no capturó (menos probable ahora).
     if (error.code === 'ER_DUP_ENTRY') {
        // Si la DB lanzó ER_DUP_ENTRY, es probablemente por el `id_ip` UNIQUE constraint GENERAL en la tabla.
        // Esto puede ocurrir si intentas asignar la misma IP *dos veces en toda la tabla*,
        // o si nuestra validación activa no fue perfecta.
        res.status(409).json({ // 409 Conflict.
            message: `Error de datos duplicados. La IP o alguna otra clave única ya existe en la tabla de asignaciones.`,
            error: error.message // Incluir mensaje de DB para debug.
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [PUT] /api/asignaciones/:id
// * Actualiza una asignación por su ID
const updateAsignacion = async (req, res, next) => { // Añadimos 'next'.
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
     const {
        id_equipo, id_empleado, id_sucursal_asignado, id_area_asignado,
        id_equipo_padre, id_ip, fecha_asignacion, fecha_fin_asignacion,
        observacion, id_status_asignacion
    } = req.body;

    // * Valido existencia de FKs si se actualizan
    // Validar si se envió al menos un campo para actualizar (excluyendo el ID).
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }

     // Validar formato de fechas si se intentan actualizar.
     // fecha_asignacion es NOT NULL. Si se actualiza, no puede ser null/vacío y debe tener formato válido.
     if (fecha_asignacion !== undefined && (fecha_asignacion === null || fecha_asignacion.trim() === '')) {
         return res.status(400).json({ message: 'El campo fecha_asignacion no puede estar vacío.' });
     }
     if (fecha_asignacion !== undefined && fecha_asignacion !== null) {
         if (!isValidDateTime(fecha_asignacion)) {
              return res.status(400).json({ message: 'El formato de fecha_asignacion debe ser YYYY-MM-DD o YYYY-MM-DD HH:mm:ss.' });
         }
     }
     // fecha_fin_asignacion es NULLable, validar si se proporciona (puede ser null).
     if (fecha_fin_asignacion !== undefined && fecha_fin_asignacion !== null) {
         if (!isValidDateTime(fecha_fin_asignacion)) {
              return res.status(400).json({ message: 'El formato de fecha_fin_asignacion debe ser YYYY-MM-DD o YYYY-MM-DD HH:mm:ss.' });
         }
     } else if (fecha_fin_asignacion === '') { // Si envían cadena vacía, tratar como null.
         fecha_fin_asignacion = null;
     }


    // === Validar reglas de negocio con valores FINALES después de la actualización ===
    // Necesitamos obtener el registro actual para comparar fechas y otras FKs si no se envían en el body.
    const currentAsignacionResult = await query(
        'SELECT id_equipo, fecha_asignacion, fecha_fin_asignacion, id_empleado, id_sucursal_asignado, id_area_asignado, id_ip FROM asignaciones WHERE id = ?',
        [id]
    );
    if (currentAsignacionResult.length === 0) {
         // El registro a actualizar no existe.
         return res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    }
    const currentAsignacion = currentAsignacionResult[0];

    // Determinamos los valores FINALES de los campos relevantes después de la actualización.
    // Si el campo *no* está en req.body (`!== undefined`), usamos el valor *actual* de la DB.
    // Si el campo *sí* está en req.body (`!== undefined`), usamos el valor *del body* (que puede ser null).
    const final_id_equipo = id_equipo !== undefined ? id_equipo : currentAsignacion.id_equipo;
    const final_id_empleado = id_empleado !== undefined ? id_empleado : currentAsignacion.id_empleado;
    const final_id_sucursal_asignado = id_sucursal_asignado !== undefined ? id_sucursal_asignado : currentAsignacion.id_sucursal_asignado;
    const final_id_area_asignado = id_area_asignado !== undefined ? id_area_asignado : currentAsignacion.id_area_asignado;
    const final_id_ip = id_ip !== undefined ? id_ip : currentAsignacion.id_ip;
    // Para las fechas que son NOT NULL, si no se enviaron en el body, usamos el valor actual de la DB (que será un objeto Date de mysql2).
    const final_fecha_asignacion = fecha_asignacion !== undefined ? fecha_asignacion : currentAsignacion.fecha_asignacion;
    // Para fecha_fin_asignacion que es NULLable, si no se envió en el body, usamos el valor actual (que puede ser null).
    // Si se envió en el body como '', ya lo convertimos a null arriba.
    const final_fecha_fin_asignacion = fecha_fin_asignacion !== undefined ? fecha_fin_asignacion : currentAsignacion.fecha_fin_asignacion;


    // Convertimos a objetos Date para la comparación de fechas.
    const dateInicio = final_fecha_asignacion ? new Date(final_fecha_asignacion) : null;
    const dateFin = final_fecha_fin_asignacion ? new Date(final_fecha_fin_asignacion) : null;

    // Validar que fecha_fin no sea anterior a fecha_inicio con los valores finales.
    if (dateInicio && dateFin && dateFin < dateInicio) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }


    // * Determinar si la asignación será ACTIVA después de la actualización.
    const isFinalAssignmentActive = (final_fecha_fin_asignacion === null);


    // * Regla de Negocio 1 (Actualizada): Para asignaciones ACTIVAS FINALES, DEBE estar asociada AL MENOS a un Empleado, Sucursal, o Área.
    const finalLocationFks = [final_id_empleado, final_id_sucursal_asignado, final_id_area_asignado];
    const finalNonNullLocationFks = finalLocationFks.filter(id => id !== null);

    if (isFinalAssignmentActive) {
        // *** CAMBIO AQUÍ ***: Validamos que sea AL MENOS UNO en el estado final.
        if (finalNonNullLocationFks.length === 0) {
            return res.status(400).json({ message: 'Para que la asignación sea activa, debe estar asociada al menos a uno de: id_empleado, id_sucursal_asignado, o id_area_asignado.' });
        }
        // No revalidamos aquí si el área es Corporativa, confiamos en validación de áreas.

         // Opcional: Validar combinación de asignaciones de ubicación/persona si no quieres permitir más de 1, 2, etc.
         // Mantenemos que se permite cualquier combinación de los 3 (siempre que sea al menos 1) en el estado activo final.

    }
    // Para asignaciones HISTÓRICAS FINALES, permitimos 0 o más asociaciones.


    // Validar FKs si se intentan actualizar y no son NULL. (Ya lo hicimos al crear, lo repetimos aquí para update).
    // id_equipo es NOT NULL, si se actualiza, no puede ser null.
    if (id_equipo !== undefined && id_equipo === null) { return res.status(400).json({ message: 'El campo id_equipo no puede ser nulo.' }); }
    if (id_equipo !== undefined && id_equipo !== null) { const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]); if (equipoExists.length === 0) return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` }); }

    // id_empleado es NULLable. Validar si existe si se proporciona y NO es NULL.
    if (id_empleado !== undefined && id_empleado !== null) { const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]); if (empleadoExists.length === 0) return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` }); }
    // Permite null si se envía.

     // id_sucursal_asignado es NULLable. Validar si existe si se proporciona y NO es NULL.
    if (id_sucursal_asignado !== undefined && id_sucursal_asignado !== null) { const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_asignado]); if (sucursalExists.length === 0) return res.status(400).json({ message: `El ID de sucursal_asignado ${id_sucursal_asignado} no es válido.` }); }
    // Permite null si se envía.

     // id_area_asignado es NULLable. Validar si existe si se proporciona y NO es NULL.
     if (id_area_asignado !== undefined && id_area_asignado !== null) { const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area_asignado]); if (areaExists.length === 0) return res.status(400).json({ message: `El ID de area_asignado ${id_area_asignado} no es válido.` }); }
    // Permite null si se envía.

     // id_equipo_padre es NULLable. Validar si existe si se proporciona y NO es NULL.
     if (id_equipo_padre !== undefined && id_equipo_padre !== null) {
         const equipoPadreExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo_padre]);
         if (equipoPadreExists.length === 0) return res.status(400).json({ message: `El ID de equipo_padre ${id_equipo_padre} no es válido.` });
         // Validar que equipo_padre no sea el mismo equipo (usando el ID del registro que actualizamos).
         if (id_equipo_padre === currentAsignacion.id_equipo) { // Comparar con el ID del equipo original de esta asignación.
              return res.status(400).json({ message: 'El equipo padre no puede ser el mismo equipo que se está asignando.' });
         }
     } // Permite null si se envía.

     // id_ip es NULLable. Validar si existe si se proporciona y NO es NULL.
     if (id_ip !== undefined && id_ip !== null) {
         const ipExists = await query('SELECT id FROM direcciones_ip WHERE id = ?', [id_ip]);
         if (ipExists.length === 0) return res.status(400).json({ message: `El ID de IP ${id_ip} no es válido.` });
     } // Permite null si se envía.

    // id_status_asignacion es NOT NULL. Si se actualiza, no puede ser null.
     if (id_status_asignacion !== undefined && id_status_asignacion === null) { return res.status(400).json({ message: 'El campo id_status_asignacion no puede ser nulo.' }); }
     if (id_status_asignacion !== undefined && id_status_asignacion !== null) { const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status_asignacion]); if (statusExists.length === 0) return res.status(400).json({ message: `El ID de status_asignacion ${id_status_asignacion} no es válido.` }); }


    // * Regla de Negocio 3 y 4 (Actualizada): Unicidad de Equipo/IP en asignaciones ACTIVAS FINALES ===
    // Esta validación solo aplica si la asignación será ACTIVA después de la actualización.
    if (isFinalAssignmentActive) {
        // Check si el equipo FINAL ya tiene *otra* asignación activa (excluyendo la actual).
        const existingActiveEquipoAssignment = await query(
            'SELECT id FROM asignaciones WHERE id_equipo = ? AND fecha_fin_asignacion IS NULL AND id <> ?',
            [final_id_equipo, id] // Excluir el registro que estamos actualizando.
        );
        if (existingActiveEquipoAssignment.length > 0) {
             return res.status(409).json({ message: `El equipo con ID ${final_id_equipo} ya tiene otra asignación activa (ID ${existingActiveEquipoAssignment[0].id}).` });
        }

        // Check si la IP FINAL ya tiene *otra* asignación activa (solo si la IP FINAL no es null).
        if (final_id_ip !== null) {
            const existingActiveIpAssignment = await query(
                'SELECT id FROM asignaciones WHERE id_ip = ? AND fecha_fin_asignacion IS NULL AND id <> ?',
                [final_id_ip, id] // Excluir el registro que estamos actualizando.
            );
             if (existingActiveIpAssignment.length > 0) {
                return res.status(409).json({ message: `La dirección IP con ID ${final_id_ip} ya está asignada en otro registro de asignación activa (ID ${existingActiveIpAssignment[0].id}).` });
            }
        }
    }
    // Para asignaciones históricas (isFinalAssignmentActive es false), no hay restricciones de unicidad activa.


    // Opcional: Actualizar el status del equipo o IP en sus tablas principales si la asignación se finaliza...


    // fecha_actualizacion se actualiza automáticamente en la DB.

    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE asignaciones SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    // Nota: Para campos NOT NULL como id_equipo o fecha_asignacion, si se envían con valor null o vacío,
    // ya los validamos arriba con 400. Si se envían undefined, no se incluyen en el UPDATE.
    if (id_equipo !== undefined) { updates.push('id_equipo = ?'); params.push(id_equipo); }
    if (id_empleado !== undefined) { updates.push('id_empleado = ?'); params.push(id_empleado); }
    if (id_sucursal_asignado !== undefined) { updates.push('id_sucursal_asignado = ?'); params.push(id_sucursal_asignado); }
    if (id_area_asignado !== undefined) { updates.push('id_area_asignado = ?'); params.push(id_area_asignado); }
    if (id_equipo_padre !== undefined) { updates.push('id_equipo_padre = ?'); params.push(id_equipo_padre); }
    if (id_ip !== undefined) { updates.push('id_ip = ?'); params.push(id_ip); }
    if (fecha_asignacion !== undefined) { updates.push('fecha_asignacion = ?'); params.push(fecha_asignacion); }
    // Para fecha_fin_asignacion, usamos el valor *final* que ya manejamos ("" -> null).
    if (fecha_fin_asignacion !== undefined) { updates.push('fecha_fin_asignacion = ?'); params.push(final_fecha_fin_asignacion); }
    if (observacion !== undefined) { updates.push('observacion = ?'); params.push(observacion === null || observacion.trim() === '' ? null : observacion); }
    if (id_status_asignacion !== undefined) { updates.push('id_status_asignacion = ?'); params.push(id_status_asignacion); }


    // Si no hay campos para actualizar, ya se manejó al inicio.
     if (updates.length === 0) {
         // Esto no debería pasar si la validación inicial funciona, pero como fallback:
         // Aunque si el ID existe y no hay campos, PUT simplemente no hace nada a la DB y retorna 200 ok.
         // Podríamos devolver un 400 si no hay nada que actualizar, pero 200 sin cambios también es válido para PUT.
         // Dejemos que pase y retorne 200 con affectedRows=0.
     } else {
        sql += updates.join(', '); // une con comas.
        sql += ' WHERE id = ?';
        params.push(id); // ID del registro a actualizar.
     }


    // * Ejecuto la consulta SOLO si hay algo que actualizar.
    let result = { affectedRows: 0 };
    if (updates.length > 0) {
        result = await query(sql, params);
    }


    // === Verificación de Resultado ===
    // Si currentAsignacion era null, ya devolvimos 404.
    // Si currentAsignacion existía, 0 affectedRows solo significa que no hubo cambios en los valores, lo cual es un éxito para PUT.
    res.status(200).json({ message: `Registro de asignación con ID ${id} actualizado exitosamente (o sin cambios).` });


  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar registro de asignación con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Manejar error de duplicación de `id_ip` (el UNIQUE constraint general en la tabla).
    // O si hay duplicidad de equipo/ip activa que nuestra validación no capturó.
     if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ // 409 Conflict.
            message: `Error de datos duplicados. La IP o alguna otra clave única ya existe en la tabla de asignaciones.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/asignaciones/:id
// * Elimina una asignación por su ID
const deleteAsignacion = async (req, res, next) => { // Añadimos 'next'.
  try {
    // * Extraigo el ID de la asignación a eliminar
    const { id } = req.params;

    // * Ejecuto el DELETE y reviso si realmente existía
    const sql = 'DELETE FROM asignaciones WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Registro de asignación con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar registro de asignación con ID ${req.params.id}:`, error);
     // No hay FKs que restrinjan la eliminación de una asignación (las FKs van *desde* asignaciones a otras tablas).
     // Este catch atraparía errores de la DB o SQL no relacionados con FK referenciada.
     next(error); // Pasar error al manejador global.
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllAsignaciones,
  getAsignacionById,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
};