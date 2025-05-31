// ! Controlador para la entidad Sucursales
// * Aquí gestiono todo lo relacionado con sucursales: creación, consulta, actualización y eliminación.
// * Incluye validaciones de negocio y relaciones con empresas, tipos y status.

// * Importo la función query para ejecutar consultas a la base de datos personalizada.
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de sucursales
// ===============================================================

// * [GET] /api/sucursales - Trae todas las sucursales con información de empresa, tipo y status
const getAllSucursales = async (req, res, next) => {
  try {
    // * Consulta SQL con JOIN para traer sucursales y sus relaciones
    const sql = `
      SELECT
        s.id,
        s.nombre,
        s.direccion,
        s.numero_telefono,
        s.id_empresa,
        e.nombre AS nombre_empresa,
        s.id_tipo_sucursal,
        ts.nombre_tipo AS nombre_tipo_sucursal,
        s.fecha_registro,
        s.fecha_actualizacion,
        s.id_status,
        st.nombre_status AS status_nombre
      FROM sucursales AS s
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN tipos_sucursal AS ts ON s.id_tipo_sucursal = ts.id
      JOIN status AS st ON s.id_status = st.id
    `;
    const sucursales = await query(sql);
    res.status(200).json(sucursales);
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error('Error al obtener todas las sucursales:', error);
    next(error);
  }
};

// * [GET] /api/sucursales/:id - Trae una sucursal específica por su ID (con relaciones)
const getSucursalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        s.id,
        s.nombre,
        s.direccion,
        s.numero_telefono,
        s.id_empresa,
        e.nombre AS nombre_empresa,
        s.id_tipo_sucursal,
        ts.nombre_tipo AS nombre_tipo_sucursal,
        s.fecha_registro,
        s.fecha_actualizacion,
        s.id_status,
        st.nombre_status AS status_nombre
      FROM sucursales AS s
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN tipos_sucursal AS ts ON s.id_tipo_sucursal = ts.id
      JOIN status AS st ON s.id_status = st.id
      WHERE s.id = ?
    `;
    const params = [id];
    const sucursales = await query(sql, params);
    if (sucursales.length === 0) {
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(sucursales[0]);
    }
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error(`Error al obtener sucursal con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/sucursales - Crea una nueva sucursal
const createSucursal = async (req, res, next) => {
  try {
    const { nombre, direccion, numero_telefono, id_empresa, id_tipo_sucursal, id_status } = req.body;
    // * Validación de campos obligatorios (nombre, id_empresa, id_tipo_sucursal)
    if (!nombre || id_empresa === undefined || id_tipo_sucursal === undefined) {
      return res.status(400).json({ message: 'Los campos nombre, id_empresa e id_tipo_sucursal son obligatorios.' });
    }
    // * Validar existencia de empresa
    const empresaExists = await query('SELECT id FROM empresas WHERE id = ?', [id_empresa]);
    if (empresaExists.length === 0) {
      return res.status(400).json({ message: `El ID de empresa ${id_empresa} no es válido.` });
    }
    // * Validar existencia de tipo de sucursal
    const tipoSucursalExists = await query('SELECT id FROM tipos_sucursal WHERE id = ?', [id_tipo_sucursal]);
    if (tipoSucursalExists.length === 0) {
      return res.status(400).json({ message: `El ID de tipo de sucursal ${id_tipo_sucursal} no es válido.` });
    }
    // * Validar existencia de status si se envió
    if (id_status !== undefined) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    // * Construcción dinámica de la consulta para insertar solo los campos presentes
    let sql = 'INSERT INTO sucursales (nombre, id_empresa, id_tipo_sucursal';
    let placeholders = ['?', '?', '?'];
    const values = [nombre, id_empresa, id_tipo_sucursal];
    if (direccion !== undefined) {
      sql += ', direccion';
      placeholders.push('?');
      values.push(direccion);
    }
    if (numero_telefono !== undefined) {
      sql += ', numero_telefono';
      placeholders.push('?');
      values.push(numero_telefono);
    }
    if (id_status !== undefined) {
      sql += ', id_status';
      placeholders.push('?');
      values.push(id_status);
    }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newSucursalId = result.insertId;
    res.status(201).json({
      message: 'Sucursal creada exitosamente',
      id: newSucursalId,
      nombre: nombre,
      id_empresa: id_empresa,
      id_tipo_sucursal: id_tipo_sucursal
    });
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error('Error al crear sucursal:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Ya existe una sucursal con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa}.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/sucursales/:id - Actualiza una sucursal por su ID
const updateSucursal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, numero_telefono, id_empresa, id_tipo_sucursal, id_status } = req.body;
    // * Validación: al menos un campo a actualizar
    if (nombre === undefined && direccion === undefined && numero_telefono === undefined && id_empresa === undefined && id_tipo_sucursal === undefined && id_status === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar (nombre, direccion, numero_telefono, id_empresa, id_tipo_sucursal, id_status).' });
    }
    if (id_empresa !== undefined) {
      const empresaExists = await query('SELECT id FROM empresas WHERE id = ?', [id_empresa]);
      if (empresaExists.length === 0) {
        return res.status(400).json({ message: `El ID de empresa ${id_empresa} no es válido.` });
      }
    }
    if (id_tipo_sucursal !== undefined) {
      const tipoSucursalExists = await query('SELECT id FROM tipos_sucursal WHERE id = ?', [id_tipo_sucursal]);
      if (tipoSucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de tipo de sucursal ${id_tipo_sucursal} no es válido.` });
      }
    }
    if (id_status !== undefined) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    let sql = 'UPDATE sucursales SET ';
    const params = [];
    const updates = [];
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (direccion !== undefined) {
      updates.push('direccion = ?');
      params.push(direccion);
    }
    if (numero_telefono !== undefined) {
      updates.push('numero_telefono = ?');
      params.push(numero_telefono);
    }
    if (id_empresa !== undefined) {
      updates.push('id_empresa = ?');
      params.push(id_empresa);
    }
    if (id_tipo_sucursal !== undefined) {
      updates.push('id_tipo_sucursal = ?');
      params.push(id_tipo_sucursal);
    }
    if (id_status !== undefined) {
      updates.push('id_status = ?');
      params.push(id_status);
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Sucursal con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error(`Error al actualizar sucursal con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Ya existe una sucursal con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa}.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/sucursales/:id - Elimina una sucursal por su ID
const deleteSucursal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM sucursales WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Sucursal con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    console.error(`Error al eliminar sucursal con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar la sucursal con ID ${req.params.id} porque está siendo utilizada por otras tablas (ej. áreas, empleados, etc.).`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
};