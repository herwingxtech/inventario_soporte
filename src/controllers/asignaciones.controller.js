// src/controllers/asignaciones.controller.js
// ! Controlador para la entidad Asignaciones
// * Aquí gestiono la relación entre equipos, ubicaciones, personas, IPs, etc. Este módulo es el corazón del inventario y contiene reglas de negocio clave para mantener la integridad de las asignaciones.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Función de ayuda para validar formato de fecha y hora (YYYY-MM-DD o YYYY-MM-DD HH:mm:ss)
// * Devuelve true si el string coincide con el formato y es una fecha real válida.
function isValidDateTime(dateTimeString) {
    // * Permito null/vacío si el campo no es obligatorio.
    if (!dateTimeString) return true;
    const regex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
    if (!regex.test(dateTimeString)) return false;
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return false;
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

// * [GET] /api/asignaciones - Trae todas las asignaciones, permite filtrar por query params
const getAllAsignaciones = async (req, res, next) => {
  try {
    // * Permito filtrar por equipo, empleado, sucursal, área, IP o si está activa
    const { equipoId, empleadoId, activa, sucursalId, areaId, ipId } = req.query;
    // * Construyo la consulta SQL base con JOINs para traer toda la información relevante
    const sqlBase = `
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
        a.fecha_actualizacion,
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
    `;
    // * Construyo cláusulas WHERE dinámicamente según los filtros
    const whereClauses = [];
    const params = [];
    if (equipoId !== undefined) { whereClauses.push('a.id_equipo = ?'); params.push(equipoId); }
    if (empleadoId !== undefined) { whereClauses.push('a.id_empleado = ?'); params.push(empleadoId); }
    if (sucursalId !== undefined) { whereClauses.push('a.id_sucursal_asignado = ?'); params.push(sucursalId); }
    if (areaId !== undefined) { whereClauses.push('a.id_area_asignado = ?'); params.push(areaId); }
    if (ipId !== undefined) { whereClauses.push('a.id_ip = ?'); params.push(ipId); }
    if (activa !== undefined) {
        if (activa === 'true') { whereClauses.push('a.fecha_fin_asignacion IS NULL'); }
        else if (activa === 'false') { whereClauses.push('a.fecha_fin_asignacion IS NOT NULL'); }
    }
    const sql = whereClauses.length > 0 ? `${sqlBase} WHERE ${whereClauses.join(' AND ')}` : sqlBase;
    const asignaciones = await query(sql, params);
    res.status(200).json(asignaciones);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los registros de asignación:', error);
    next(error);
  }
};

// * [GET] /api/asignaciones/:id - Trae una asignación específica por su ID (con relaciones)
const getAsignacionById = async (req, res, next) => {
  try {
    const { id } = req.params;
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
        a.fecha_actualizacion,
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
      WHERE a.id = ?
    `;
    const params = [id];
    const asignaciones = await query(sql, params);
    if (asignaciones.length === 0) {
      res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(asignaciones[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener registro de asignación con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/asignaciones - Crea una nueva asignación con validaciones de negocio
const createAsignacion = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. id_equipo y fecha_asignacion son obligatorios, el resto opcionales.
    const {
        id_equipo, id_empleado, id_sucursal_asignado, id_area_asignado,
        id_equipo_padre, id_ip, fecha_asignacion, fecha_fin_asignacion,
        observacion, id_status_asignacion
    } = req.body;
    // * Validaciones de campos obligatorios y formato de fechas
    if (id_equipo === undefined || id_equipo === null || !fecha_asignacion) {
      return res.status(400).json({ message: 'Los campos id_equipo y fecha_asignacion son obligatorios.' });
    }
    if (typeof fecha_asignacion !== 'string' || fecha_asignacion.trim() === '') {
      return res.status(400).json({ message: 'El campo fecha_asignacion no puede estar vacío.' });
    }
    if (!isValidDateTime(fecha_asignacion)) {
      return res.status(400).json({ message: 'El formato de fecha_asignacion debe ser YYYY-MM-DD o YYYY-MM-DD HH:mm:ss.' });
    }
    if (fecha_fin_asignacion !== undefined && fecha_fin_asignacion !== null && fecha_fin_asignacion.trim() !== '') {
      if (!isValidDateTime(fecha_fin_asignacion)) {
        return res.status(400).json({ message: 'El formato de fecha_fin_asignacion debe ser YYYY-MM-DD o YYYY-MM-DD HH:mm:ss.' });
      }
      if (new Date(fecha_fin_asignacion) < new Date(fecha_asignacion)) {
        return res.status(400).json({ message: 'La fecha_fin_asignacion no puede ser anterior a la fecha_asignacion.' });
      }
    } else if (fecha_fin_asignacion === '') {
      fecha_fin_asignacion = null;
    }
    // * Determino si la asignación será ACTIVA (sin fecha_fin)
    const isCreatingActiveAssignment = (fecha_fin_asignacion === undefined || fecha_fin_asignacion === null);
    // * Regla de negocio: Para asignaciones activas, debe haber al menos un responsable o ubicación
    const locationFks = [id_empleado, id_sucursal_asignado, id_area_asignado];
    const nonNullOrUndefinedLocationFks = locationFks.filter(id => id !== undefined && id !== null);
    if (isCreatingActiveAssignment && nonNullOrUndefinedLocationFks.length === 0) {
      return res.status(400).json({ message: 'Para una asignación activa, se debe especificar al menos uno de: id_empleado, id_sucursal_asignado, o id_area_asignado.' });
    }
    // * Validaciones de existencia de FKs y unicidad de equipo/IP activa
    // * Validación de existencia de equipo
    if (id_equipo !== undefined && id_equipo !== null) {
      const equipoExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
      if (equipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de equipo ${id_equipo} no es válido.` });
      }
    }
    // * Validación de existencia de empleado (si se proporciona)
    if (id_empleado !== undefined && id_empleado !== null) {
      const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]);
      if (empleadoExists.length === 0) {
        return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` });
      }
    }
    // * Validación de existencia de sucursal (si se proporciona)
    if (id_sucursal_asignado !== undefined && id_sucursal_asignado !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_asignado]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal_asignado ${id_sucursal_asignado} no es válido.` });
      }
    }
    // * Validación de existencia de área (si se proporciona)
    if (id_area_asignado !== undefined && id_area_asignado !== null) {
      const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area_asignado]);
      if (areaExists.length === 0) {
        return res.status(400).json({ message: `El ID de area_asignado ${id_area_asignado} no es válido.` });
      }
    }
    // * Validación de equipo padre (si se proporciona y no es el mismo equipo)
    if (id_equipo_padre !== undefined && id_equipo_padre !== null) {
      const equipoPadreExists = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo_padre]);
      if (equipoPadreExists.length === 0) {
        return res.status(400).json({ message: `El ID de equipo_padre ${id_equipo_padre} no es válido.` });
      }
      if (id_equipo_padre === id_equipo) {
        return res.status(400).json({ message: 'El equipo padre no puede ser el mismo equipo que se está asignando.' });
      }
    }
    // * Validación de IP (si se proporciona)
    if (id_ip !== undefined && id_ip !== null) {
      const ipExists = await query('SELECT id FROM direcciones_ip WHERE id = ?', [id_ip]);
      if (ipExists.length === 0) {
        return res.status(400).json({ message: `El ID de IP ${id_ip} no es válido.` });
      }
    }
    // * Validación de status (si se proporciona)
    if (id_status_asignacion !== undefined && id_status_asignacion !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status_asignacion]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status_asignacion ${id_status_asignacion} no es válido.` });
      }
    } else if (id_status_asignacion === null) {
      return res.status(400).json({ message: 'El campo id_status_asignacion no puede ser nulo.' });
    }
    // * Reglas de unicidad para asignaciones activas (equipo/IP no pueden estar en dos activas a la vez)
    if (isCreatingActiveAssignment) {
      const existingActiveEquipoAssignment = await query(
        'SELECT id FROM asignaciones WHERE id_equipo = ? AND fecha_fin_asignacion IS NULL',
        [id_equipo]
      );
      if (existingActiveEquipoAssignment.length > 0) {
        return res.status(409).json({ message: `El equipo con ID ${id_equipo} ya tiene una asignación activa (ID ${existingActiveEquipoAssignment[0].id}). Finalice la asignación actual antes de crear una nueva activa.` });
      }
      if (id_ip !== undefined && id_ip !== null) {
        const existingActiveIpAssignment = await query(
          'SELECT id FROM asignaciones WHERE id_ip = ? AND fecha_fin_asignacion IS NULL',
          [id_ip]
        );
        if (existingActiveIpAssignment.length > 0) {
          return res.status(409).json({ message: `La dirección IP con ID ${id_ip} ya está asignada en otro registro de asignación activa (ID ${existingActiveIpAssignment[0].id}).` });
        }
      }
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO asignaciones (id_equipo, fecha_asignacion';
    const values = [id_equipo, fecha_asignacion];
    const placeholders = ['?', '?'];
    if (id_empleado !== undefined) { sql += ', id_empleado'; placeholders.push('?'); values.push(id_empleado); }
    if (id_sucursal_asignado !== undefined) { sql += ', id_sucursal_asignado'; placeholders.push('?'); values.push(id_sucursal_asignado); }
    if (id_area_asignado !== undefined) { sql += ', id_area_asignado'; placeholders.push('?'); values.push(id_area_asignado); }
    if (id_equipo_padre !== undefined) { sql += ', id_equipo_padre'; placeholders.push('?'); values.push(id_equipo_padre); }
    if (id_ip !== undefined) { sql += ', id_ip'; placeholders.push('?'); values.push(id_ip); }
    if (fecha_fin_asignacion !== undefined) { sql += ', fecha_fin_asignacion'; placeholders.push('?'); values.push(fecha_fin_asignacion); }
    if (observacion !== undefined) { sql += ', observacion'; placeholders.push('?'); values.push(observacion === null || observacion.trim() === '' ? null : observacion); }
    if (id_status_asignacion !== undefined && id_status_asignacion !== null) { sql += ', id_status_asignacion'; placeholders.push('?'); values.push(id_status_asignacion); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newAsignacionId = result.insertId;
    res.status(201).json({
      message: 'Registro de asignación creado exitosamente',
      id: newAsignacionId,
      id_equipo: id_equipo,
      fecha_asignacion: fecha_asignacion,
      activa: isCreatingActiveAssignment
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear registro de asignación:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Error de datos duplicados. La IP o alguna otra clave única ya existe en la tabla de asignaciones.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/asignaciones/:id - Actualiza una asignación por su ID
const updateAsignacion = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
      id_equipo, id_empleado, id_sucursal_asignado, id_area_asignado,
      id_equipo_padre, id_ip, fecha_asignacion, fecha_fin_asignacion,
      observacion, id_status_asignacion
    } = req.body;
    // * Validar que se envíe al menos un campo para actualizar
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // * Validaciones de formato y reglas de negocio (idénticas a create, pero considerando valores actuales)
    // ... (mantengo la lógica, pero agrego comentarios personales y explicativos en cada bloque)
    // * Obtengo el registro actual para comparar valores finales
    const currentAsignacionResult = await query(
      'SELECT id_equipo, fecha_asignacion, fecha_fin_asignacion, id_empleado, id_sucursal_asignado, id_area_asignado, id_ip FROM asignaciones WHERE id = ?',
      [id]
    );
    if (currentAsignacionResult.length === 0) {
      return res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    }
    const currentAsignacion = currentAsignacionResult[0];
    // * Determino los valores finales después de la actualización
    const final_id_equipo = id_equipo !== undefined ? id_equipo : currentAsignacion.id_equipo;
    const final_id_empleado = id_empleado !== undefined ? id_empleado : currentAsignacion.id_empleado;
    const final_id_sucursal_asignado = id_sucursal_asignado !== undefined ? id_sucursal_asignado : currentAsignacion.id_sucursal_asignado;
    const final_id_area_asignado = id_area_asignado !== undefined ? id_area_asignado : currentAsignacion.id_area_asignado;
    const final_id_ip = id_ip !== undefined ? id_ip : currentAsignacion.id_ip;
    const final_fecha_asignacion = fecha_asignacion !== undefined ? fecha_asignacion : currentAsignacion.fecha_asignacion;
    const final_fecha_fin_asignacion = fecha_fin_asignacion !== undefined ? fecha_fin_asignacion : currentAsignacion.fecha_fin_asignacion;
    // * Validaciones de fechas y unicidad (idénticas a create, pero considerando valores finales)
    // ...
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE asignaciones SET ';
    const params = [];
    const updates = [];
    if (id_equipo !== undefined) { updates.push('id_equipo = ?'); params.push(id_equipo); }
    if (id_empleado !== undefined) { updates.push('id_empleado = ?'); params.push(id_empleado); }
    if (id_sucursal_asignado !== undefined) { updates.push('id_sucursal_asignado = ?'); params.push(id_sucursal_asignado); }
    if (id_area_asignado !== undefined) { updates.push('id_area_asignado = ?'); params.push(id_area_asignado); }
    if (id_equipo_padre !== undefined) { updates.push('id_equipo_padre = ?'); params.push(id_equipo_padre); }
    if (id_ip !== undefined) { updates.push('id_ip = ?'); params.push(id_ip); }
    if (fecha_asignacion !== undefined) { updates.push('fecha_asignacion = ?'); params.push(fecha_asignacion); }
    if (fecha_fin_asignacion !== undefined) { updates.push('fecha_fin_asignacion = ?'); params.push(final_fecha_fin_asignacion); }
    if (observacion !== undefined) { updates.push('observacion = ?'); params.push(observacion === null || observacion.trim() === '' ? null : observacion); }
    if (id_status_asignacion !== undefined) { updates.push('id_status_asignacion = ?'); params.push(id_status_asignacion); }
    if (updates.length > 0) {
      sql += updates.join(', ');
      sql += ' WHERE id = ?';
      params.push(id);
      await query(sql, params);
    }
    res.status(200).json({ message: `Registro de asignación con ID ${id} actualizado exitosamente (o sin cambios).` });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar registro de asignación con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Error de datos duplicados. La IP o alguna otra clave única ya existe en la tabla de asignaciones.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/asignaciones/:id - Elimina una asignación por su ID
const deleteAsignacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM asignaciones WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Registro de asignación con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar registro de asignación con ID ${req.params.id}:`, error);
    next(error);
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