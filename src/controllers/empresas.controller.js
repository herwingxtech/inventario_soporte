// src/controllers/empresas.controller.js

const { query } = require('../config/db'); // Importamos la función de consulta DB

// Función para obtener TODAS las empresas
const getAllEmpresas = async (req, res) => {
  try {
    // Consulta SQL para seleccionar todos los campos de la tabla 'empresas'
    // Puedes añadir JOINs aquí si necesitas campos de la tabla 'status'
    const sql = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_registro,
        e.id_status,
        s.nombre_status AS status_nombre
      FROM empresas AS e
      JOIN status AS s ON e.id_status = s.id
    `; // Usamos alias 'e' y 's' para abreviar y un JOIN para traer el nombre del status
    const empresas = await query(sql);

    res.status(200).json(empresas);

  } catch (error) {
    console.error('Error al obtener todas las empresas:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener las empresas',
      error: error.message
    });
  }
};

// Función para obtener UNA empresa por su ID
const getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_registro,
        e.id_status,
        s.nombre_status AS status_nombre
      FROM empresas AS e
      JOIN status AS s ON e.id_status = s.id
      WHERE e.id = ?
    `;
    const params = [id];
    const empresas = await query(sql, params); // query siempre devuelve un array

    if (empresas.length === 0) {
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(empresas[0]); // Enviamos el primer (y único) resultado
    }

  } catch (error) {
    console.error(`Error al obtener empresa con ID ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener la empresa',
      error: error.message
    });
  }
};

// Función para CREAR una nueva empresa
const createEmpresa = async (req, res) => {
  try {
    // Obtenemos los datos del cuerpo de la petición. id_status tiene DEFAULT en la DB.
    const { nombre, id_status } = req.body; // nombre es obligatorio

    // Validar si se recibió el nombre (obligatorio)
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la empresa es obligatorio.' });
    }

    // Validar si el id_status proporcionado existe en la tabla 'status'
    if (id_status !== undefined) { // Si el usuario envió un id_status
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }
     // Si id_status es undefined, la DB usará su DEFAULT (1 = Activo)

    // Consulta SQL para insertar
    let sql = 'INSERT INTO empresas (nombre';
    let values = [nombre];
    let placeholders = ['?'];

    if (id_status !== undefined) {
        sql += ', id_status';
        values.push(id_status);
        placeholders.push('?');
    }

    sql += ') VALUES (' + placeholders.join(', ') + ')'; // Construimos el VALUES (?, ?, ...)
    const result = await query(sql, values);

    const newEmpresaId = result.insertId;

    res.status(201).json({
      message: 'Empresa creada exitosamente',
      id: newEmpresaId,
      nombre: nombre
    });

  } catch (error) {
    console.error('Error al crear empresa:', error);
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `El nombre de empresa "${req.body.nombre}" ya existe.`,
           error: error.message
       });
    } else {
        res.status(500).json({
            message: 'Error interno del servidor al crear la empresa',
            error: error.message
        });
    }
  }
};

// Función para ACTUALIZAR una empresa existente
const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, id_status } = req.body; // Campos que se pueden actualizar

    // Validar si se recibió al menos un campo a actualizar
    if (nombre === undefined && id_status === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos nombre o id_status para actualizar.' });
    }

    // Validar si el id_status proporcionado existe en la tabla 'status' si se intenta actualizar
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }

    // Construir la consulta UPDATE dinámicamente
    let sql = 'UPDATE empresas SET ';
    const params = [];
    const updates = [];

    if (nombre !== undefined) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
    if (id_status !== undefined) {
        updates.push('id_status = ?');
        params.push(id_status);
    }

    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id); // El ID de la empresa a actualizar va al final

    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      // Si no se afectaron filas, el ID probablemente no existe
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Empresa con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar empresa con ID ${req.params.id}:`, error);
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `El nombre de empresa "${req.body.nombre}" ya existe.`,
           error: error.message
       });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al actualizar la empresa',
            error: error.message
        });
     }
  }
};

// Función para ELIMINAR una empresa
const deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = 'DELETE FROM empresas WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Empresa con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar empresa con ID ${req.params.id}:`, error);
     // Manejar el error si la empresa tiene sucursales asociadas (por FK)
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict
            message: `No se puede eliminar la empresa con ID ${req.params.id} porque tiene sucursales asociadas.`,
            error: error.message
        });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al eliminar la empresa',
            error: error.message
        });
     }
  }
};

// Exportamos las funciones
module.exports = {
  getAllEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
};