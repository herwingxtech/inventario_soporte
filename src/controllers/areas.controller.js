// ! Controlador para la entidad Áreas
// * Las áreas dependen de sucursales y solo pueden crearse en sucursales de tipo 'Corporativo'.

// * Importo la función query para ejecutar consultas a la base de datos
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de áreas
// ===============================================================

// * [GET] /api/areas - Trae todas las áreas (con nombres de sucursal, empresa y status)
const getAllAreas = async (req, res, next) => {
  try {
    // * Consulta SQL con JOIN para traer áreas y sus relaciones
    const sql = `
      SELECT
        a.id,
        a.nombre,
        a.id_sucursal,
        s.nombre AS nombre_sucursal,
        e.nombre AS nombre_empresa,
        a.fecha_registro,
        a.fecha_actualizacion,
        a.id_status,
        st.nombre_status AS status_nombre
      FROM areas AS a
      JOIN sucursales AS s ON a.id_sucursal = s.id
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN status AS st ON a.id_status = st.id
    `;
    const areas = await query(sql);
    res.status(200).json(areas);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las áreas:', error);
    next(error);
  }
};

// * [GET] /api/areas/:id - Trae un área específica por su ID (con relaciones)
const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        a.id,
        a.nombre,
        a.id_sucursal,
        s.nombre AS nombre_sucursal,
        e.nombre AS nombre_empresa,
        a.fecha_registro,
        a.fecha_actualizacion,
        a.id_status,
        st.nombre_status AS status_nombre
      FROM areas AS a
      JOIN sucursales AS s ON a.id_sucursal = s.id
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN status AS st ON a.id_status = st.id
      WHERE a.id = ?
    `;
    const params = [id];
    const areas = await query(sql, params);
    if (areas.length === 0) {
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(areas[0]);
    }
  } catch (error) {
    console.error(`Error al obtener área con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/areas - Crea una nueva área (solo en sucursales de tipo 'Corporativo')
const createArea = async (req, res, next) => {
  try {
    const { nombre, id_sucursal, id_status } = req.body;
    // * Validación de campos obligatorios
    if (!nombre || id_sucursal === undefined) {
      return res.status(400).json({ message: 'Los campos nombre e id_sucursal son obligatorios.' });
    }
    // * Validar existencia de sucursal y obtener su tipo
    const sucursalResult = await query('SELECT id, id_tipo_sucursal FROM sucursales WHERE id = ?', [id_sucursal]);
    if (sucursalResult.length === 0) {
      return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
    }
    const sucursal = sucursalResult[0];
    // * Obtener el ID del tipo de sucursal 'Corporativo'
    const tipoCorporativoResult = await query('SELECT id FROM tipos_sucursal WHERE nombre_tipo = ?', ['Corporativo']);
    if (tipoCorporativoResult.length === 0) {
      console.error("Error de configuración: No se encontró el tipo de sucursal 'Corporativo' en la DB.");
      return res.status(500).json({ message: 'Error interno de configuración del servidor: Tipo de sucursal "Corporativo" no definido.' });
    }
    const idTipoCorporativo = tipoCorporativoResult[0].id;
    // * Regla de negocio: solo se puede crear área en sucursal de tipo 'Corporativo'
    if (sucursal.id_tipo_sucursal !== idTipoCorporativo) {
      return res.status(400).json({ message: `Las áreas solo pueden ser creadas para sucursales de tipo 'Corporativo'. La sucursal con ID ${id_sucursal} no es de este tipo.` });
    }
    // * Validar existencia de status si se envió
    if (id_status !== undefined) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    // * Construcción dinámica de la consulta
    let sql = 'INSERT INTO areas (nombre, id_sucursal';
    let placeholders = ['?', '?'];
    const values = [nombre, id_sucursal];
    if (id_status !== undefined) {
      sql += ', id_status';
      placeholders.push('?');
      values.push(id_status);
    }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newAreaId = result.insertId;
    res.status(201).json({
      message: 'Área creada exitosamente',
      id: newAreaId,
      nombre: nombre,
      id_sucursal: id_sucursal
    });
  } catch (error) {
    console.error('Error al crear área:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Ya existe un área con el nombre "${req.body.nombre}" para la sucursal con ID ${req.body.id_sucursal}.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/areas/:id - Actualiza un área por su ID (solo en sucursales de tipo 'Corporativo')
const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, id_sucursal, id_status } = req.body;
    // * Validación: al menos un campo a actualizar
    if (nombre === undefined && id_sucursal === undefined && id_status === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar (nombre, id_sucursal, id_status).' });
    }
    // * Validar que la sucursal objetivo es de tipo 'Corporativo'
    let targetSucursalId = id_sucursal;
    if (targetSucursalId === undefined) {
      const currentAreaResult = await query('SELECT id_sucursal FROM areas WHERE id = ?', [id]);
      if (currentAreaResult.length === 0) {
        return res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
      }
      targetSucursalId = currentAreaResult[0].id_sucursal;
    }
    const sucursalResult = await query('SELECT id, id_tipo_sucursal FROM sucursales WHERE id = ?', [targetSucursalId]);
    if (sucursalResult.length === 0) {
      const errorMessage = id_sucursal !== undefined ?
        `El ID de sucursal ${id_sucursal} no es válido.` :
        `Error de integridad: Sucursal con ID ${targetSucursalId} asociada al área ${id} no encontrada.`;
      return res.status(id_sucursal !== undefined ? 400 : 500).json({ message: errorMessage });
    }
    const sucursal = sucursalResult[0];
    const tipoCorporativoResult = await query('SELECT id FROM tipos_sucursal WHERE nombre_tipo = ?', ['Corporativo']);
    if (tipoCorporativoResult.length === 0) {
      console.error("Error de configuración: No se encontró el tipo de sucursal 'Corporativo' en la DB.");
      return res.status(500).json({ message: 'Error interno de configuración del servidor: Tipo de sucursal "Corporativo" no definido.' });
    }
    const idTipoCorporativo = tipoCorporativoResult[0].id;
    if (sucursal.id_tipo_sucursal !== idTipoCorporativo) {
      return res.status(400).json({ message: `Las áreas solo pueden estar en sucursales de tipo 'Corporativo'. La sucursal con ID ${targetSucursalId} no es de este tipo.` });
    }
    if (id_status !== undefined) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    }
    let sql = 'UPDATE areas SET ';
    const params = [];
    const updates = [];
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (id_sucursal !== undefined) {
      updates.push('id_sucursal = ?');
      params.push(id_sucursal);
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
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Área con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al actualizar área con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `Ya existe un área con el nombre "${req.body.nombre}" para la sucursal con ID ${req.body.id_sucursal}.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/areas/:id - Elimina un área por su ID
const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM areas WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Área con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al eliminar área con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el área con ID ${req.params.id} porque está siendo utilizada por otras tablas (ej. empleados, equipos, etc.).`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};