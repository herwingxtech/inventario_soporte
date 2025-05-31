// src/controllers/empleados.controller.js
// ! Controlador para la entidad Empleados
// * Aquí gestiono todo lo relacionado con empleados: creación, consulta, actualización y eliminación.
// * Incluye validaciones de negocio y relaciones con sucursales, áreas y status.

// * Importo la función query para ejecutar consultas a la base de datos
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de empleados
// ===============================================================

// * [GET] /api/empleados - Trae todos los empleados con información de sucursal, área y status (pueden ser NULL)
const getAllEmpleados = async (req, res, next) => {
  try {
    // * Consulta SQL con LEFT JOIN para traer empleados y sus relaciones (sucursal y área pueden ser NULL)
    const sql = `
      SELECT
        e.id,
        e.numero_empleado,
        e.nombres,
        e.apellidos,
        e.email_personal,
        e.telefono,
        e.puesto,
        e.fecha_nacimiento,
        e.fecha_ingreso,
        e.id_sucursal,
        s.nombre AS nombre_sucursal,
        e.id_area,
        a.nombre AS nombre_area,
        e.fecha_registro,
        e.fecha_actualizacion,
        e.id_status,
        st.nombre_status AS status_nombre
      FROM empleados AS e
      LEFT JOIN sucursales AS s ON e.id_sucursal = s.id
      LEFT JOIN areas AS a ON e.id_area = a.id
      JOIN status AS st ON e.id_status = st.id
    `;
    const empleados = await query(sql);
    res.status(200).json(empleados);
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error('Error al obtener todos los empleados:', error);
    next(error);
  }
};

// * [GET] /api/empleados/:id - Trae un empleado específico por su ID (con relaciones)
const getEmpleadoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        e.id,
        e.numero_empleado,
        e.nombres,
        e.apellidos,
        e.email_personal,
        e.telefono,
        e.puesto,
        e.fecha_nacimiento,
        e.fecha_ingreso,
        e.id_sucursal,
        s.nombre AS nombre_sucursal,
        e.id_area,
        a.nombre AS nombre_area,
        e.fecha_registro,
        e.fecha_actualizacion,
        e.id_status,
        st.nombre_status AS status_nombre
      FROM empleados AS e
      LEFT JOIN sucursales AS s ON e.id_sucursal = s.id
      LEFT JOIN areas AS a ON e.id_area = a.id
      JOIN status AS st ON e.id_status = st.id
      WHERE e.id = ?
    `;
    const params = [id];
    const empleados = await query(sql, params);
    if (empleados.length === 0) {
      res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(empleados[0]);
    }
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error(`Error al obtener empleado con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/empleados - Crea un nuevo empleado
const createEmpleado = async (req, res, next) => {
  try {
    const {
      numero_empleado, nombres, apellidos, email_personal,
      telefono, puesto, fecha_nacimiento, fecha_ingreso,
      id_sucursal, id_area, id_status
    } = req.body;
    // * Validación de campos obligatorios (nombres y apellidos)
    if (!nombres || !apellidos) {
      return res.status(400).json({ message: 'Los campos nombres y apellidos son obligatorios.' });
    }
    // * Validar que numero_empleado no esté vacío si se envía
    if (numero_empleado !== undefined && numero_empleado !== null && numero_empleado.trim() === '') {
      return res.status(400).json({ message: 'El campo numero_empleado no puede estar vacío si se proporciona.' });
    }
    // * Validar formato de email si se proporciona
    if (email_personal !== undefined && email_personal !== null && email_personal.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_personal)) {
        return res.status(400).json({ message: 'El formato del campo email_personal no es válido.' });
      }
    }
    // * Validar formato de fechas si se proporcionan (YYYY-MM-DD)
    if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && fecha_nacimiento.trim() !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
        return res.status(400).json({ message: 'El formato de fecha_nacimiento debe ser YYYY-MM-DD.' });
      }
    }
    if (fecha_ingreso !== undefined && fecha_ingreso !== null && fecha_ingreso.trim() !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_ingreso)) {
        return res.status(400).json({ message: 'El formato de fecha_ingreso debe ser YYYY-MM-DD.' });
      }
    }
    // * Validar existencia de sucursal si se envía
    if (id_sucursal !== undefined && id_sucursal !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
      }
    }
    // * Validar existencia de área si se envía
    if (id_area !== undefined && id_area !== null) {
      const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area]);
      if (areaExists.length === 0) {
        return res.status(400).json({ message: `El ID de área ${id_area} no es válido.` });
      }
    }
    // * Validar existencia de status si se envía
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construcción dinámica de la consulta para insertar solo los campos presentes
    let sql = 'INSERT INTO empleados (nombres, apellidos';
    const values = [nombres, apellidos];
    const placeholders = ['?', '?'];
    if (numero_empleado !== undefined && numero_empleado !== null) { sql += ', numero_empleado'; placeholders.push('?'); values.push(numero_empleado); }
    if (email_personal !== undefined && email_personal !== null) { sql += ', email_personal'; placeholders.push('?'); values.push(email_personal); }
    if (telefono !== undefined && telefono !== null) { sql += ', telefono'; placeholders.push('?'); values.push(telefono); }
    if (puesto !== undefined && puesto !== null) { sql += ', puesto'; placeholders.push('?'); values.push(puesto); }
    if (fecha_nacimiento !== undefined && fecha_nacimiento !== null) { sql += ', fecha_nacimiento'; placeholders.push('?'); values.push(fecha_nacimiento); }
    if (fecha_ingreso !== undefined && fecha_ingreso !== null) { sql += ', fecha_ingreso'; placeholders.push('?'); values.push(fecha_ingreso); }
    if (id_sucursal !== undefined && id_sucursal !== null) { sql += ', id_sucursal'; placeholders.push('?'); values.push(id_sucursal); }
    if (id_area !== undefined && id_area !== null) { sql += ', id_area'; placeholders.push('?'); values.push(id_area); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newEmpleadoId = result.insertId;
    res.status(201).json({
      message: 'Empleado creado exitosamente',
      id: newEmpleadoId,
      nombres: nombres,
      apellidos: apellidos
    });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Ya existe un empleado con este número o datos únicos.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/empleados/:id - Actualiza un empleado por su ID
const updateEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      numero_empleado, nombres, apellidos, email_personal,
      telefono, puesto, fecha_nacimiento, fecha_ingreso,
      id_sucursal, id_area, id_status
    } = req.body;
    // * Validación: al menos un campo a actualizar
    if (
      numero_empleado === undefined && nombres === undefined && apellidos === undefined &&
      email_personal === undefined && telefono === undefined && puesto === undefined &&
      fecha_nacimiento === undefined && fecha_ingreso === undefined &&
      id_sucursal === undefined && id_area === undefined && id_status === undefined
    ) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // * Validar existencia de sucursal si se envía
    if (id_sucursal !== undefined && id_sucursal !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
      }
    }
    // * Validar existencia de área si se envía
    if (id_area !== undefined && id_area !== null) {
      const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area]);
      if (areaExists.length === 0) {
        return res.status(400).json({ message: `El ID de área ${id_area} no es válido.` });
      }
    }
    // * Validar existencia de status si se envía
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    // * Construcción dinámica de la consulta para actualizar solo los campos presentes
    let sql = 'UPDATE empleados SET ';
    const params = [];
    const updates = [];
    if (numero_empleado !== undefined) { updates.push('numero_empleado = ?'); params.push(numero_empleado); }
    if (nombres !== undefined) { updates.push('nombres = ?'); params.push(nombres); }
    if (apellidos !== undefined) { updates.push('apellidos = ?'); params.push(apellidos); }
    if (email_personal !== undefined) { updates.push('email_personal = ?'); params.push(email_personal); }
    if (telefono !== undefined) { updates.push('telefono = ?'); params.push(telefono); }
    if (puesto !== undefined) { updates.push('puesto = ?'); params.push(puesto); }
    if (fecha_nacimiento !== undefined) { updates.push('fecha_nacimiento = ?'); params.push(fecha_nacimiento); }
    if (fecha_ingreso !== undefined) { updates.push('fecha_ingreso = ?'); params.push(fecha_ingreso); }
    if (id_sucursal !== undefined) { updates.push('id_sucursal = ?'); params.push(id_sucursal); }
    if (id_area !== undefined) { updates.push('id_area = ?'); params.push(id_area); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Empleado con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al actualizar empleado con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Ya existe un empleado con este número o datos únicos.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/empleados/:id - Elimina un empleado por su ID
const deleteEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM empleados WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Empleado con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al eliminar empleado con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el empleado con ID ${req.params.id} porque está siendo utilizado por otras tablas (ej. asignaciones, equipos, etc.).`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
};