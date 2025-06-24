// src/controllers/cuentasEmail.controller.js
// * Aquí gestiono todo lo relacionado con las cuentas de correo corporativo: creación, consulta, actualización y eliminación.

// * Importo la función query para ejecutar consultas a la base de datos
const { query } = require('../config/db');

// * [GET] /api/cuentas-email - Trae todas las cuentas de email con JOINs a empleados y status
const getAllCuentasEmail = async (req, res, next) => {
  try {
    const sql = `
      SELECT
        ce.id,
        ce.email,
        ce.usuario_email,
        ce.password_data, 
        ce.id_empleado_asignado,
        e.nombres AS nombre_empleado,
        e.apellidos AS apellido_empleado,
        ce.fecha_creacion,
        ce.fecha_actualizacion,
        ce.id_status,
        st.nombre_status AS status_nombre,
        ce.observaciones
      FROM cuentas_email_corporativo AS ce
      LEFT JOIN empleados AS e ON ce.id_empleado_asignado = e.id
      JOIN status AS st ON ce.id_status = st.id
    `;
    const cuentas = await query(sql);
    res.status(200).json(cuentas);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las cuentas de email:', error);
    next(error);
  }
};

// * [GET] /api/cuentas-email/:id - Trae una cuenta de email específica por su ID (con relaciones)
const getCuentaEmailById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        ce.id,
        ce.email,
        ce.usuario_email,
        ce.password_data, 
        ce.id_empleado_asignado,
        e.nombres AS nombre_empleado,
        e.apellidos AS apellido_empleado,
        ce.fecha_creacion,
        ce.fecha_actualizacion,
        ce.id_status,
        st.nombre_status AS status_nombre,
        ce.observaciones
      FROM cuentas_email_corporativo AS ce
      LEFT JOIN empleados AS e ON ce.id_empleado_asignado = e.id
      JOIN status AS st ON ce.id_status = st.id
      WHERE ce.id = ?
    `;
    const params = [id];
    const cuentas = await query(sql, params);
    if (cuentas.length === 0) {
      res.status(404).json({ message: `Cuenta de email con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(cuentas[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener cuenta de email con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/cuentas-email - Crea una nueva cuenta de email con validaciones y advertencias de seguridad
const createCuentaEmail = async (req, res, next) => {
  try {
    const {
        email, usuario_email, password_data,
        id_empleado_asignado, id_status, observaciones
    } = req.body;
    // * Validaciones de campos obligatorios y formato
    if (!email) {
      return res.status(400).json({ message: 'El campo email es obligatorio.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: `El formato del email "${email}" no es válido.` });
    }
    // * Validar existencia de empleado asignado si se proporciona
    if (id_empleado_asignado !== undefined && id_empleado_asignado !== null) {
      const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado_asignado]);
      if (empleadoExists.length === 0) {
        return res.status(400).json({ message: `El ID de empleado_asignado ${id_empleado_asignado} no es válido.` });
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
    // ! password_data se almacena tal cual, sin cifrar solo demostración
    let passwordToStore = undefined;
    if (password_data !== undefined) {
      passwordToStore = password_data;
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO cuentas_email_corporativo (email';
    const values = [email];
    const placeholders = ['?'];
    if (usuario_email !== undefined) { sql += ', usuario_email'; placeholders.push('?'); values.push(usuario_email === null || usuario_email.trim() === '' ? null : usuario_email); }
    if (password_data !== undefined) { sql += ', password_data'; placeholders.push('?'); values.push(password_data === null || password_data.trim() === '' ? null : password_data); }
    if (id_empleado_asignado !== undefined) { sql += ', id_empleado_asignado'; placeholders.push('?'); values.push(id_empleado_asignado); }
    if (id_status !== undefined) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    if (observaciones !== undefined) { sql += ', observaciones'; placeholders.push('?'); values.push(observaciones === null || observaciones.trim() === '' ? null : observaciones); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newCuentaId = result.insertId;
    res.status(201).json({
      message: 'Cuenta de email creada exitosamente',
      id: newCuentaId,
      email: email
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear cuenta de email:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `La dirección de email "${req.body.email}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/cuentas-email/:id - Actualiza una cuenta de email por su ID
const updateCuentaEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
        email, usuario_email, password_data,
        id_empleado_asignado, id_status, observaciones
    } = req.body;
    // * Validar que al menos un campo sea enviado
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // * Validar formato de email si se intenta actualizar
    if (email !== undefined && email !== null && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: `El formato del email "${email}" no es válido.` });
      }
    } else if (email !== undefined && (email === null || email.trim() === '')) {
      return res.status(400).json({ message: 'El campo email no puede estar vacío.' });
    }
    // * Validar existencia de empleado asignado si se intenta actualizar
    if (id_empleado_asignado !== undefined && id_empleado_asignado !== null) {
      const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado_asignado]);
      if (empleadoExists.length === 0) {
        return res.status(400).json({ message: `El ID de empleado_asignado ${id_empleado_asignado} no es válido.` });
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
    // * Advertencia: password_data se almacena tal cual, sin cifrar (solo para demo)
    let passwordToStore = undefined;
    if (password_data !== undefined) {
      passwordToStore = password_data;
    }
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE cuentas_email_corporativo SET ';
    const params = [];
    const updates = [];
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (usuario_email !== undefined) { updates.push('usuario_email = ?'); params.push(usuario_email === null || usuario_email.trim() === '' ? null : usuario_email); }
    if (passwordToStore !== undefined) { updates.push('password_data = ?'); params.push(passwordToStore); }
    if (id_empleado_asignado !== undefined) { updates.push('id_empleado_asignado = ?'); params.push(id_empleado_asignado); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    if (observaciones !== undefined) { updates.push('observaciones = ?'); params.push(observaciones === null || observaciones.trim() === '' ? null : observaciones); }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Cuenta de email con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Cuenta de email con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar cuenta de email con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `La dirección de email "${req.body.email}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/cuentas-email/:id - Elimina una cuenta de email por su ID
const deleteCuentaEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM cuentas_email_corporativo WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Cuenta de email con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Cuenta de email con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar cuenta de email con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar la cuenta de email con ID ${req.params.id} porque está siendo utilizada por otros registros.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllCuentasEmail,
  getCuentaEmailById,
  createCuentaEmail,
  updateCuentaEmail,
  deleteCuentaEmail,
};