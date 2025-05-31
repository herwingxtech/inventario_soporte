// ! Controlador para la entidad Tipos de Sucursal
// * Aquí gestiono el catálogo de tipos de sucursal (ej: Corporativo, Tienda). Incluye validaciones y operaciones CRUD.

// * Importo la función query para ejecutar consultas a la base de datos personalizada.
const { query } = require('../config/db');

// ===============================================================
// * Funciones controladoras para cada endpoint de tipos de sucursal
// ===============================================================

// * [GET] /api/tipos-sucursal - Trae todos los tipos de sucursal
const getAllTiposSucursal = async (req, res, next) => {
  try {
    // * Consulta SQL para traer todos los tipos de sucursal
    // * Si ocurre un error, lo paso al middleware global para manejo centralizado
    const sql = 'SELECT id, nombre_tipo, descripcion FROM tipos_sucursal';
    const tipos = await query(sql);
    res.status(200).json(tipos);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los tipos de sucursal:', error);
    next(error);
  }
};

// * [GET] /api/tipos-sucursal/:id - Trae un tipo de sucursal específico por su ID
const getTiposSucursalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT id, nombre_tipo, descripcion FROM tipos_sucursal WHERE id = ?';
    const params = [id];
    const tipos = await query(sql, params);
    if (tipos.length === 0) {
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(tipos[0]);
    }
  } catch (error) {
    console.error(`Error al obtener tipo de sucursal con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/tipos-sucursal - Crea un nuevo tipo de sucursal
// ? Si los tipos de sucursal son fijos, esta función podría estar restringida a admins
const createTiposSucursal = async (req, res, next) => {
  try {
    const { nombre_tipo, descripcion } = req.body;
    // * Validación: nombre_tipo es obligatorio
    if (!nombre_tipo) {
      return res.status(400).json({ message: 'El nombre_tipo es obligatorio.' });
    }
    const sql = 'INSERT INTO tipos_sucursal (nombre_tipo, descripcion) VALUES (?, ?)';
    const params = [nombre_tipo, descripcion];
    const result = await query(sql, params);
    const newId = result.insertId;
    res.status(201).json({
      message: 'Tipo de sucursal creado exitosamente',
      id: newId,
      nombre_tipo: nombre_tipo
    });
  } catch (error) {
    console.error('Error al crear tipo de sucursal:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de tipo de sucursal "${req.body.nombre_tipo}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/tipos-sucursal/:id - Actualiza un tipo de sucursal por su ID
const updateTiposSucursal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_tipo, descripcion } = req.body;
    // * Validación: al menos un campo a actualizar
    if (nombre_tipo === undefined && descripcion === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_tipo o descripcion para actualizar.' });
    }
    let sql = 'UPDATE tipos_sucursal SET ';
    const params = [];
    const updates = [];
    if (nombre_tipo !== undefined) {
      updates.push('nombre_tipo = ?');
      params.push(nombre_tipo);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(descripcion);
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Tipo de sucursal con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al actualizar tipo de sucursal con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de tipo de sucursal "${req.body.nombre_tipo}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/tipos-sucursal/:id - Elimina un tipo de sucursal por su ID
const deleteTiposSucursal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM tipos_sucursal WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Tipo de sucursal con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    console.error(`Error al eliminar tipo de sucursal con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el tipo de sucursal con ID ${req.params.id} porque tiene sucursales asociadas.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllTiposSucursal,
  getTiposSucursalById,
  createTiposSucursal,
  updateTiposSucursal,
  deleteTiposSucursal,
};