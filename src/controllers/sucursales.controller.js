// src/controllers/sucursales.controller.js

const { query } = require('../config/db'); // Importamos la función de consulta DB

// Función para obtener TODAS las sucursales
const getAllSucursales = async (req, res) => {
  try {
    // Consulta SQL para seleccionar todos los campos de la tabla 'sucursales'
    // Hacemos JOINs con 'empresas' y 'status' para traer los nombres relacionados
    const sql = `
      SELECT
        s.id,
        s.nombre,
        s.direccion,
        s.numero_telefono,
        s.id_empresa,
        e.nombre AS nombre_empresa, -- Nombre de la empresa a la que pertenece
        s.fecha_registro,
        s.id_status,
        st.nombre_status AS status_nombre -- Nombre del status de la sucursal
      FROM sucursales AS s
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN status AS st ON s.id_status = st.id
    `; // Usamos alias s, e, st para abreviar
    const sucursales = await query(sql);

    res.status(200).json(sucursales);

  } catch (error) {
    console.error('Error al obtener todas las sucursales:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener las sucursales',
      error: error.message
    });
  }
};

// Función para obtener UNA sucursal por su ID
const getSucursalById = async (req, res) => {
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
        s.fecha_registro,
        s.id_status,
        st.nombre_status AS status_nombre
      FROM sucursales AS s
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN status AS st ON s.id_status = st.id
      WHERE s.id = ?
    `;
    const params = [id];
    const sucursales = await query(sql, params);

    if (sucursales.length === 0) {
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(sucursales[0]); // Enviamos el primer (y único) resultado
    }

  } catch (error) {
    console.error(`Error al obtener sucursal con ID ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener la sucursal',
      error: error.message
    });
  }
};

// Función para CREAR una nueva sucursal
const createSucursal = async (req, res) => {
  try {
    // Obtenemos los datos del cuerpo de la petición.
    // nombre y id_empresa son obligatorios según el modelo y lógica.
    // id_status tiene DEFAULT en la DB.
    const { nombre, direccion, numero_telefono, id_empresa, id_status } = req.body;

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
    // Construcción dinámica para incluir campos opcionales como direccion, numero_telefono, id_status
    let sql = 'INSERT INTO sucursales (nombre, id_empresa';
    let placeholders = ['?', '?'];
    const values = [nombre, id_empresa];

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

    sql += ') VALUES (' + placeholders.join(', ') + ')'; // Construimos el VALUES (?, ?, ...)

    const result = await query(sql, values);

    const newSucursalId = result.insertId;

    res.status(201).json({
      message: 'Sucursal creada exitosamente',
      id: newSucursalId,
      nombre: nombre,
      id_empresa: id_empresa
    });

  } catch (error) {
    console.error('Error al crear sucursal:', error);
    // Manejo específico para el error de UNIQUE constraint (nombre, id_empresa)
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `Ya existe una sucursal con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa}.`,
           error: error.message
       });
    } else {
        res.status(500).json({
            message: 'Error interno del servidor al crear la sucursal',
            error: error.message
        });
    }
  }
};

// Función para ACTUALIZAR una sucursal existente
const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    // Campos que se pueden actualizar
    const { nombre, direccion, numero_telefono, id_empresa, id_status } = req.body;

    // Validar si se recibió al menos un campo a actualizar
    if (nombre === undefined && direccion === undefined && numero_telefono === undefined && id_empresa === undefined && id_status === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar (nombre, direccion, numero_telefono, id_empresa, id_status).' });
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
     if (id_status !== undefined) {
        updates.push('id_status = ?');
        params.push(id_status);
    }


    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id); // El ID de la sucursal a actualizar va al final

    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      // Si no se afectaron filas, el ID probablemente no existe
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Sucursal con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar sucursal con ID ${req.params.id}:`, error);
     // Manejo específico para el error de UNIQUE constraint (nombre, id_empresa) si se intenta actualizar a un nombre/empresa ya existente
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict
           message: `Ya existe una sucursal con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa || '[No Cambiado]'}.`,
           error: error.message
       });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al actualizar la sucursal',
            error: error.message
        });
     }
  }
};

// Función para ELIMINAR una sucursal
const deleteSucursal = async (req, res) => {
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
    console.error(`Error al eliminar sucursal con ID ${req.params.id}:`, error);
     // Manejar el error si la sucursal tiene registros asociados en otras tablas (ubicaciones_internas, empleados, equipos)
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict
            message: `No se puede eliminar la sucursal con ID ${req.params.id} porque tiene ubicaciones internas, empleados o equipos asociados.`,
            error: error.message
        });
     } else {
        res.status(500).json({
            message: 'Error interno del servidor al eliminar la sucursal',
            error: error.message
        });
     }
  }
};

// Exportamos las funciones
module.exports = {
  getAllSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
};