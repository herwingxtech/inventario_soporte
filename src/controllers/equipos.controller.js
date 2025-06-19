// src/controllers/equipos.controller.js
// ! Controlador para la entidad Equipos
// * Aquí gestiono todo lo relacionado con los equipos físicos del inventario: creación, consulta, actualización y eliminación.
// * Este módulo valida relaciones con sucursales, tipos y status, y asegura la integridad de los datos.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Función de ayuda para validar formato de fecha (YYYY-MM-DD) de forma segura (UTC)
// * Devuelve true si el string coincide con el formato y es una fecha real válida.
function isValidDate(dateString) {
  // * Permito null/vacío si el campo no es obligatorio.
  if (!dateString) return true;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// ===============================================================
// * Funciones controladoras para cada endpoint de equipos
// ===============================================================

// * [GET] /api/equipos - Trae todos los equipos con JOINs a tipos, sucursales y status
const getAllEquipos = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada equipo
    const sql = `
      SELECT
        e.id,
        e.numero_serie,
        e.nombre_equipo,
        e.marca,
        e.modelo,
        e.id_tipo_equipo,
        te.nombre_tipo AS nombre_tipo_equipo,
        e.id_sucursal_actual,
        s.nombre AS nombre_sucursal_actual,
        s.id_empresa,
        em.nombre AS nombre_empresa,
        e.procesador,
        e.ram,
        e.disco_duro,
        e.sistema_operativo,
        e.mac_address,
        e.otras_caracteristicas,
        e.fecha_compra,
        e.fecha_registro,
        e.fecha_actualizacion,
        e.id_status,
        st.nombre_status AS status_nombre
      FROM equipos AS e
      JOIN tipos_equipo AS te ON e.id_tipo_equipo = te.id
      JOIN sucursales AS s ON e.id_sucursal_actual = s.id
      JOIN empresas AS em ON s.id_empresa = em.id
      JOIN status AS st ON e.id_status = st.id
    `;
    const equipos = await query(sql);
    res.status(200).json(equipos);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los equipos:', error);
    next(error);
  }
};

// * [GET] /api/equipos/:id - Trae un equipo específico por su ID (con relaciones)
const getEquipoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        e.id,
        e.numero_serie,
        e.nombre_equipo,
        e.marca,
        e.modelo,
        e.id_tipo_equipo,
        te.nombre_tipo AS nombre_tipo_equipo,
        e.id_sucursal_actual,
        s.nombre AS nombre_sucursal_actual,
        e.procesador,
        e.ram,
        e.disco_duro,
        e.sistema_operativo,
        e.mac_address,
        e.otras_caracteristicas,
        e.fecha_compra,
        e.fecha_registro,
        e.fecha_actualizacion,
        e.id_status,
        st.nombre_status AS status_nombre
      FROM equipos AS e
      JOIN tipos_equipo AS te ON e.id_tipo_equipo = te.id
      JOIN sucursales AS s ON e.id_sucursal_actual = s.id
      JOIN status AS st ON e.id_status = st.id
      WHERE e.id = ?
    `;
    const params = [id];
    const equipos = await query(sql, params);
    if (equipos.length === 0) {
      res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(equipos[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener equipo con ID ${req.params.id}:`, error);
    next(error);
  }
};


// * [POST] /api/equipos - Crea un nuevo equipo con validaciones
const createEquipo = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. numero_serie, id_tipo_equipo, id_sucursal_actual son obligatorios
    const {
        numero_serie, nombre_equipo, marca, modelo, id_tipo_equipo,
        id_sucursal_actual, procesador, ram, disco_duro, sistema_operativo,
        mac_address, otras_caracteristicas, fecha_compra, id_status
    } = req.body;
    // * Validaciones de campos obligatorios y formato
    if (!numero_serie || id_tipo_equipo === undefined || id_sucursal_actual === undefined) {
      return res.status(400).json({ message: 'Los campos numero_serie, id_tipo_equipo e id_sucursal_actual son obligatorios.' });
    }
    if (numero_serie.trim() === '') {
      return res.status(400).json({ message: 'El campo numero_serie no puede estar vacío.' });
    }
    if (mac_address !== undefined && mac_address !== null && mac_address.trim() === '') {
      return res.status(400).json({ message: 'El campo mac_address no puede estar vacío si se proporciona.' });
    }
    // * Validar formato de fecha_compra si se proporciona
    if (!isValidDate(fecha_compra)) {
      return res.status(400).json({ message: 'El formato de fecha_compra debe ser YYYY-MM-DD.' });
    }
    // * Validar existencia de FKs
    const tipoEquipoExists = await query('SELECT id FROM tipos_equipo WHERE id = ?', [id_tipo_equipo]);
    if (tipoEquipoExists.length === 0) {
      return res.status(400).json({ message: `El ID de tipo_equipo ${id_tipo_equipo} no es válido.` });
    }
    const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_actual]);
    if (sucursalExists.length === 0) {
      return res.status(400).json({ message: `El ID de sucursal_actual ${id_sucursal_actual} no es válido.` });
    }
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO equipos (numero_serie, id_tipo_equipo, id_sucursal_actual';
    const values = [numero_serie, id_tipo_equipo, id_sucursal_actual];
    const placeholders = ['?', '?', '?'];
    if (nombre_equipo !== undefined && nombre_equipo !== null) { sql += ', nombre_equipo'; placeholders.push('?'); values.push(nombre_equipo); }
    if (marca !== undefined && marca !== null) { sql += ', marca'; placeholders.push('?'); values.push(marca); }
    if (modelo !== undefined && modelo !== null) { sql += ', modelo'; placeholders.push('?'); values.push(modelo); }
    if (procesador !== undefined && procesador !== null) { sql += ', procesador'; placeholders.push('?'); values.push(procesador); }
    if (ram !== undefined && ram !== null) { sql += ', ram'; placeholders.push('?'); values.push(ram); }
    if (disco_duro !== undefined && disco_duro !== null) { sql += ', disco_duro'; placeholders.push('?'); values.push(disco_duro); }
    if (sistema_operativo !== undefined && sistema_operativo !== null) { sql += ', sistema_operativo'; placeholders.push('?'); values.push(sistema_operativo); }
    if (mac_address !== undefined) { sql += ', mac_address'; placeholders.push('?'); values.push(mac_address === null ? null : mac_address.trim() === '' ? null : mac_address); }
    if (otras_caracteristicas !== undefined && otras_caracteristicas !== null) { sql += ', otras_caracteristicas'; placeholders.push('?'); values.push(otras_caracteristicas); }
    if (fecha_compra !== undefined && fecha_compra !== null) { sql += ', fecha_compra'; placeholders.push('?'); values.push(fecha_compra); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newEquipoId = result.insertId;
    res.status(201).json({
      message: 'Equipo creado exitosamente',
      id: newEquipoId,
      numero_serie: numero_serie,
      id_tipo_equipo: id_tipo_equipo
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear equipo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El número de serie o MAC address ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/equipos/:id - Actualiza un equipo por su ID
const updateEquipo = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
        numero_serie, nombre_equipo, marca, modelo, id_tipo_equipo,
        id_sucursal_actual, procesador, ram, disco_duro, sistema_operativo,
        mac_address, otras_caracteristicas, fecha_compra, id_status
    } = req.body;
    // * Valido que al menos un campo sea enviado
    const updatesCount = Object.keys(req.body).length;
    if (updatesCount === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    if (numero_serie !== undefined && numero_serie !== null && numero_serie.trim() === '') {
      return res.status(400).json({ message: 'El campo numero_serie no puede estar vacío.' });
    }
    if (mac_address !== undefined && mac_address !== null && mac_address.trim() === '') {
      return res.status(400).json({ message: 'El campo mac_address no puede estar vacío si se proporciona.' });
    }
    if (fecha_compra !== undefined && fecha_compra !== null) {
      if (!isValidDate(fecha_compra)) {
        return res.status(400).json({ message: 'El formato de fecha_compra debe ser YYYY-MM-DD.' });
      }
    }
    if (id_tipo_equipo !== undefined && id_tipo_equipo !== null) {
      const tipoEquipoExists = await query('SELECT id FROM tipos_equipo WHERE id = ?', [id_tipo_equipo]);
      if (tipoEquipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de tipo_equipo ${id_tipo_equipo} no es válido.` });
      }
    } else if (id_tipo_equipo === null) {
      return res.status(400).json({ message: 'El campo id_tipo_equipo no puede ser nulo.' });
    }
    if (id_sucursal_actual !== undefined && id_sucursal_actual !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_actual]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal_actual ${id_sucursal_actual} no es válido.` });
      }
    } else if (id_sucursal_actual === null) {
      return res.status(400).json({ message: 'El campo id_sucursal_actual no puede ser nulo.' });
    }
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE equipos SET ';
    const params = [];
    const updates = [];
    if (numero_serie !== undefined) { updates.push('numero_serie = ?'); params.push(numero_serie); }
    if (nombre_equipo !== undefined) { updates.push('nombre_equipo = ?'); params.push(nombre_equipo); }
    if (marca !== undefined) { updates.push('marca = ?'); params.push(marca); }
    if (modelo !== undefined) { updates.push('modelo = ?'); params.push(modelo); }
    if (id_tipo_equipo !== undefined) { updates.push('id_tipo_equipo = ?'); params.push(id_tipo_equipo); }
    if (id_sucursal_actual !== undefined) { updates.push('id_sucursal_actual = ?'); params.push(id_sucursal_actual); }
    if (procesador !== undefined) { updates.push('procesador = ?'); params.push(procesador); }
    if (ram !== undefined) { updates.push('ram = ?'); params.push(ram); }
    if (disco_duro !== undefined) { updates.push('disco_duro = ?'); params.push(disco_duro); }
    if (sistema_operativo !== undefined) { updates.push('sistema_operativo = ?'); params.push(sistema_operativo); }
    if (mac_address !== undefined) {
      updates.push('mac_address = ?');
      params.push(mac_address === null || mac_address.trim() === '' ? null : mac_address);
    }
    if (otras_caracteristicas !== undefined) { updates.push('otras_caracteristicas = ?'); params.push(otras_caracteristicas); }
    if (fecha_compra !== undefined) { updates.push('fecha_compra = ?'); params.push(fecha_compra); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Equipo con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar equipo con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El número de serie o MAC address proporcionado ya existe en otro equipo.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/equipos/:id - Elimina un equipo por su ID
const deleteEquipo = async (req, res, next) => {
  try {
    // * Extraigo el ID del equipo a eliminar
    const { id } = req.params;
    const sql = 'DELETE FROM equipos WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Equipo con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar equipo con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el equipo con ID ${req.params.id} porque tiene asignaciones activas o históricas asociadas.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllEquipos,
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo,
};