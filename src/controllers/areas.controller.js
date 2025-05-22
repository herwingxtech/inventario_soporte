// src/controllers/areas.controller.js

const { query } = require('../config/db'); // Importamos la función de consulta DB

// Función para obtener TODAS las areas
const getAllAreas = async (req, res) => {
  try {
    // Consulta SQL para seleccionar todos los campos de la tabla 'areas'
    // Hacemos JOINs con 'empresas' y 'status' para traer los nombres relacionados
    const sql = `
      SELECT
        a.id,
        a.nombre,
        a.id_empresa,
        e.nombre AS nombre_empresa, -- Nombre de la empresa a la que pertenece
        a.fecha_registro,
        a.id_status,
        s.nombre_status AS status_nombre -- Nombre del status del área
      FROM areas AS a
      JOIN empresas AS e ON a.id_empresa = e.id
      JOIN status AS s ON a.id_status = s.id
    `; // Usamos alias a, e, s para abreviar
    const areas = await query(sql);

    res.status(200).json(areas);

  } catch (error) {
    console.error('Error al obtener todas las áreas:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener las áreas',
      error: error.message
    });
  }
};

// Función para obtener UN area por su ID
const getAreaById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        a.id,
        a.nombre,
        a.id_empresa,
        e.nombre AS nombre_empresa,
        a.fecha_registro,
        a.id_status,
        s.nombre_status AS status_nombre
      FROM areas AS a
      JOIN empresas AS e ON a.id_empresa = e.id
      JOIN status AS s ON a.id_status = s.id
      WHERE a.id = ?
    `;
    const params = [id];
    const areas = await query(sql, params); // query siempre devuelve un array

    if (areas.length === 0) {
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(areas[0]); // Enviamos el primer (y único) resultado
    }

  } catch (error) {
    console.error(`Error al obtener área con ID ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener el área',
      error: error.message
    });
  }
};

// Función para CREAR una nueva area
const createArea = async (req, res) => {
  try {
    // Obtenemos los datos del cuerpo de la petición.
    // nombre y id_empresa son obligatorios según el modelo y lógica.
    // id_status tiene DEFAULT en la DB.
    const { nombre, id_empresa, id_status } = req.body;

    // Validaciones básicas: campos obligatorios
    if (!nombre || !id_empresa) {
      return res.status(400).json({ message: 'Los campos nombre e id_empresa son obligatorios.' });
    }

    // Validar si la empresa existe (FK)
    const empresaExists = await query('SELECT id FROM empresas WHERE id = ?', [id_empresa]);
    if (empresaExists.length === 0) {
        return res.status(400).json({ message: `El ID de empresa ${id_empresa} no es válido.` });
    }

    // Validar si el status existe (FK) si se proporcionó
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }
    // Si id_status es undefined, la DB usará su DEFAULT (1 = Activo)


    // Consulta SQL para insertar
    // Construcción dinámica para incluir campo opcional id_status
    let sql = 'INSERT INTO areas (nombre, id_empresa';
    let placeholders = ['?', '?'];
    const values = [nombre, id_empresa];

    if (id_status !== undefined) {
        sql += ', id_status';
        placeholders.push('?');
        values.push(id_status);
    }

    sql += ') VALUES (' + placeholders.join(', ') + ')'; // Construimos el VALUES (?, ?, ...)

    const result = await query(sql, values);

    const newAreaId = result.insertId;

    res.status(201).json({
      message: 'Área creada exitosamente',
      id: newAreaId,
      nombre: nombre,
      id_empresa: id_empresa
    });

  } catch (error) {
    console.error('Error al crear área:', error);
    // Manejo específico para el error de UNIQUE constraint (nombre, id_empresa)
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `Ya existe un área con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa}.`,
           error: error.message
       });
    } else {
        res.status(500).json({
            message: 'Error interno del servidor al crear el área',
            error: error.message
        });
    }
  }
};

// Función para ACTUALIZAR una area existente
const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    // Campos que se pueden actualizar
    const { nombre, id_empresa, id_status } = req.body;

    // Validar si se recibió al menos un campo a actualizar
    if (nombre === undefined && id_empresa === undefined && id_status === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar (nombre, id_empresa, id_status).' });
    }

    // Validar si la empresa existe (FK) si se intenta actualizar el id_empresa
    if (id_empresa !== undefined) {
        const empresaExists = await query('SELECT id FROM empresas WHERE id = ?', [id_empresa]);
        if (empresaExists.length === 0) {
            return res.status(400).json({ message: `El ID de empresa ${id_empresa} no es válido.` });
        }
    }

     // Validar si el status existe (FK) si se intenta actualizar el id_status
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }


    // Construir la consulta UPDATE dinámicamente
    let sql = 'UPDATE areas SET ';
    const params = [];
    const updates = [];

    if (nombre !== undefined) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
     if (id_empresa !== undefined) {
        updates.push('id_empresa = ?');
        params.push(id_empresa);
    }
     if (id_status !== undefined) {
        updates.push('id_status = ?');
        params.push(id_status);
    }

    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id); // El ID del área a actualizar va al final

    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      // Si no se afectaron filas, el ID probablemente no existe
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Área con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar área con ID ${req.params.id}:`, error);
     // Manejo específico para el error de UNIQUE constraint (nombre, id_empresa) si se intenta actualizar a un nombre/empresa ya existente
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `Ya existe un área con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa || '[No Cambiado]'}.`,
           error: error.message
       });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al actualizar el área',
            error: error.message
        });
     }
  }
};

// Función para ELIMINAR una area
const deleteArea = async (req, res) => {
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
     // Manejar el error si el área tiene empleados o asignaciones asociadas (por FK)
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict
            message: `No se puede eliminar el área con ID ${req.params.id} porque tiene empleados o asignaciones asociadas.`,
            error: error.message
        });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al eliminar el área',
            error: error.message
        });
     }
  }
};

// Exportamos las funciones
module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};