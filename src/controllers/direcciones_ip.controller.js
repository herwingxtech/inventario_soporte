// src/controllers/direccionesIp.controller.js
// ! Controlador para la entidad Direcciones IP
// * Aquí gestiono todo lo relacionado con las direcciones IP del inventario: creación, consulta, actualización y eliminación.
// * Este módulo valida formato de IP, relaciones con sucursales y status, y asegura la integridad de los datos.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Función de ayuda para validar formato de IPv4/IPv6 (simplificado)
// * Nota: Solo valida el formato, no garantiza que la IP sea asignable o ruteable.
function isValidIpAddress(ip) {
    // * Permito null o vacío si el campo no es obligatorio.
    if (!ip || typeof ip !== 'string') return false;
    ip = ip.trim();
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i; // Simplificado
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// ===============================================================
// * Funciones controladoras para cada endpoint de direcciones IP
// ===============================================================

// * [GET] /api/direcciones-ip - Trae todas las direcciones IP con JOINs a sucursales y status
const getAllDireccionesIp = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada IP
    const sql = `
      SELECT
        di.id,
        di.direccion_ip,
        di.id_sucursal,
        s.nombre AS nombre_sucursal,
        di.comentario,
        di.fecha_registro,
        di.fecha_actualizacion,
        di.id_status,
        st.nombre_status AS status_nombre
      FROM direcciones_ip AS di
      LEFT JOIN sucursales AS s ON di.id_sucursal = s.id
      JOIN status AS st ON di.id_status = st.id
    `;
    const direcciones = await query(sql);
    res.status(200).json(direcciones);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las direcciones IP:', error);
    next(error);
  }
};

// * [GET] /api/direcciones-ip/:id - Trae una dirección IP específica por su ID (con relaciones)
const getDireccionIpById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        di.id,
        di.direccion_ip,
        di.id_sucursal,
        s.nombre AS nombre_sucursal,
        di.comentario,
        di.fecha_registro,
        di.fecha_actualizacion,
        di.id_status,
        st.nombre_status AS status_nombre
      FROM direcciones_ip AS di
      LEFT JOIN sucursales AS s ON di.id_sucursal = s.id
      JOIN status AS st ON di.id_status = st.id
      WHERE di.id = ?
    `;
    const params = [id];
    const direcciones = await query(sql, params);
    if (direcciones.length === 0) {
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(direcciones[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener dirección IP con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/direcciones-ip - Crea una nueva dirección IP con validaciones
const createDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. direccion_ip es obligatorio
    const { direccion_ip, id_sucursal, comentario, id_status } = req.body;
    // * Validaciones de campos obligatorios y formatos
    if (!direccion_ip) {
      return res.status(400).json({ message: 'El campo direccion_ip es obligatorio.' });
    }
    if (!isValidIpAddress(direccion_ip)) {
      return res.status(400).json({ message: `La dirección IP "${direccion_ip}" no tiene un formato válido.` });
    }
    // * Validar existencia de sucursal si se proporciona
    if (id_sucursal !== undefined && id_sucursal !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
      }
    }
    // * Validar existencia de status
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO direcciones_ip (direccion_ip';
    const values = [direccion_ip];
    const placeholders = ['?'];
    if (id_sucursal !== undefined && id_sucursal !== null) { sql += ', id_sucursal'; placeholders.push('?'); values.push(id_sucursal); }
    if (comentario !== undefined && comentario !== null) { sql += ', comentario'; placeholders.push('?'); values.push(comentario); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newIpId = result.insertId;
    res.status(201).json({
      message: 'Dirección IP creada exitosamente',
      id: newIpId,
      direccion_ip: direccion_ip
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear dirección IP:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `La dirección IP "${req.body.direccion_ip}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/direcciones-ip/:id - Actualiza una dirección IP por su ID
const updateDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const { direccion_ip, id_sucursal, comentario, id_status } = req.body;
    // * Validar que al menos un campo sea enviado
    const updatesCount = Object.keys(req.body).length;
    if (updatesCount === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // * Validar formato de la dirección IP si se intenta actualizar
    if (direccion_ip !== undefined && direccion_ip !== null) {
      if (!isValidIpAddress(direccion_ip)) {
        return res.status(400).json({ message: `La dirección IP "${direccion_ip}" no tiene un formato válido.` });
      }
      if (direccion_ip === null || direccion_ip.trim() === '') {
        return res.status(400).json({ message: 'El campo direccion_ip no puede estar vacío.' });
      }
    }
    // * Validar existencia de sucursal si se intenta actualizar
    if (id_sucursal !== undefined && id_sucursal !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
      }
    }
    // * Validar existencia de status si se intenta actualizar
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE direcciones_ip SET ';
    const params = [];
    const updates = [];
    if (direccion_ip !== undefined) { updates.push('direccion_ip = ?'); params.push(direccion_ip); }
    if (id_sucursal !== undefined) { updates.push('id_sucursal = ?'); params.push(id_sucursal); }
    if (comentario !== undefined) { updates.push('comentario = ?'); params.push(comentario); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Dirección IP con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar dirección IP con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `La dirección IP "${req.body.direccion_ip}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/direcciones-ip/:id - Elimina una dirección IP por su ID
const deleteDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo el ID de la IP a eliminar
    const { id } = req.params;
    const sql = 'DELETE FROM direcciones_ip WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Dirección IP con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar dirección IP con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar la dirección IP con ID ${req.params.id} porque está siendo utilizada en asignaciones.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllDireccionesIp,
  getDireccionIpById,
  createDireccionIp,
  updateDireccionIp,
  deleteDireccionIp,
};