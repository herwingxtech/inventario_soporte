// src/controllers/tipos_ucursal.controller.js

// Controlador para manejar las operaciones de la entidad Tipos de Sucursal

const { query } = require('../config/db'); // Importamos la función de consulta DB

// Función para obtener TODOS los tipos de sucursal
const getAllTiposSucursal = async (req, res, next) => {
  try {
    // Consulta SQL para seleccionar todos los registros de la tabla 'tipos_sucursal'
    const sql = 'SELECT id, nombre_tipo, descripcion FROM tipos_sucursal';
    const tipos = await query(sql);

    res.status(200).json(tipos);

  } catch (error) {
    console.error('Error al obtener todos los tipos de sucursal:', error);
    next(error); // Pasamos el error al middleware global
  }
};

// Función para obtener UN tipo de sucursal por su ID
const getTiposSucursalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = 'SELECT id, nombre_tipo, descripcion FROM tipos_sucursal WHERE id = ?';
    const params = [id];
    const tipos = await query(sql, params); // query siempre devuelve un array

    if (tipos.length === 0) {
      res.status(404).json({ message: `Tipo de sucursal con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(tipos[0]); // Enviamos el primer (y único) resultado
    }

  } catch (error) {
    console.error(`Error al obtener tipo de sucursal con ID ${req.params.id}:`, error);
    next(error); // Pasamos el error al middleware global
  }
};

// Función para CREAR un nuevo tipo de sucursal
// Considera si necesitas esta función si los tipos son fijos
const createTiposSucursal = async (req, res, next) => {
  try {
    const { nombre_tipo, descripcion } = req.body;

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
        next(error); // Pasar error al middleware global
     }
  }
};

// Función para ACTUALIZAR un tipo de sucursal
// Considera si necesitas esta función si los tipos son fijos
const updateTiposSucursal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_tipo, descripcion } = req.body;

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
        next(error); // Pasar error al middleware global
     }
  }
};

// Función para ELIMINAR un tipo de sucursal
// Considera si necesitas esta función si los tipos son fijos
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
     // Manejar el error si el tipo está siendo usado por sucursales
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({
            message: `No se puede eliminar el tipo de sucursal con ID ${req.params.id} porque tiene sucursales asociadas.`,
            error: error.message
        });
     } else {
        next(error); // Pasar error al middleware global
     }
  }
};


module.exports = {
  getAllTiposSucursal,
  getTiposSucursalById,
  createTiposSucursal,
  updateTiposSucursal,
  deleteTiposSucursal,
};