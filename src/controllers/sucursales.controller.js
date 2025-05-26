// src/controllers/sucursales.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Sucursales.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/sucursales
// Obtiene y devuelve todos los registros de la tabla 'sucursales'.
// Incluye el nombre de la empresa, tipo de sucursal y estado asociados mediante JOINs.
const getAllSucursales = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar sucursales.
    // Hacemos JOIN con 'empresas', 'tipos_sucursal' y 'status' para obtener nombres relacionados.
    const sql = `
      SELECT
        s.id,
        s.nombre,
        s.direccion,
        s.numero_telefono,
        s.id_empresa,
        e.nombre AS nombre_empresa, -- Nombre de la empresa.
        s.id_tipo_sucursal,
        ts.nombre_tipo AS nombre_tipo_sucursal, -- Nombre del tipo de sucursal (Corporativo/Tienda).
        s.fecha_registro,
        s.fecha_actualizacion, -- Incluido.
        s.id_status,
        st.nombre_status AS status_nombre -- Nombre del status.
      FROM sucursales AS s
      JOIN empresas AS e ON s.id_empresa = e.id -- Unir con empresas.
      JOIN tipos_sucursal AS ts ON s.id_tipo_sucursal = ts.id -- Unir con tipos_sucursal.
      JOIN status AS st ON s.id_status = st.id -- Unir con status.
    `;
    // Ejecutamos la consulta.
    const sucursales = await query(sql);

    // Enviamos la lista de sucursales como respuesta JSON (200 OK).
    res.status(200).json(sucursales);

  } catch (error) {
    console.error('Error al obtener todas las sucursales:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/sucursales/:id
// Obtiene y devuelve una sucursal específica por su ID.
// Incluye nombres de entidades relacionadas.
const getSucursalById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la sucursal.
    const { id } = req.params;

    // Consulta SQL para seleccionar una sucursal por ID con JOINs.
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
        s.fecha_actualizacion, -- Incluido.
        s.id_status,
        st.nombre_status AS status_nombre
      FROM sucursales AS s
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN tipos_sucursal AS ts ON s.id_tipo_sucursal = ts.id
      JOIN status AS st ON s.id_status = st.id
      WHERE s.id = ? -- Filtrar por ID.
    `;
    const params = [id]; // ID a buscar.
    const sucursales = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (sucursales.length === 0) {
      // Si no se encontró, 404 Not Found.
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      // Si se encontró, devolvemos el primer resultado (200 OK).
      res.status(200).json(sucursales[0]);
    }

  } catch (error) {
    console.error(`Error al obtener sucursal con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/sucursales
// Crea un nuevo registro en la tabla 'sucursales'.
const createSucursal = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos datos del body. nombre, id_empresa, id_tipo_sucursal son obligatorios.
    // direccion, numero_telefono, id_status son opcionales (id_status tiene DEFAULT).
    const { nombre, direccion, numero_telefono, id_empresa, id_tipo_sucursal, id_status } = req.body;

    // === Validaciones ===
    // Validar campos obligatorios.
    if (!nombre || id_empresa === undefined || id_tipo_sucursal === undefined) { // Usamos undefined para permitir 0 si fuera válido en otros casos
      return res.status(400).json({ message: 'Los campos nombre, id_empresa e id_tipo_sucursal son obligatorios.' });
    }

    // Validar si la empresa existe (FK).
    const empresaExists = await query('SELECT id FROM empresas WHERE id = ?', [id_empresa]);
    if (empresaExists.length === 0) {
        return res.status(400).json({ message: `El ID de empresa ${id_empresa} no es válido.` });
    }

    // Validar si el tipo de sucursal existe (FK).
    const tipoSucursalExists = await query('SELECT id FROM tipos_sucursal WHERE id = ?', [id_tipo_sucursal]);
    if (tipoSucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de tipo de sucursal ${id_tipo_sucursal} no es válido.` });
    }

    // Validar si el status existe (FK) si se proporcionó.
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }
    // fecha_registro y fecha_actualizacion usan DEFAULT/ON UPDATE.

    // Consulta SQL para insertar (construcción dinámica para campos opcionales).
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

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newSucursalId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Sucursal creada exitosamente',
      id: newSucursalId,
      nombre: nombre,
      id_empresa: id_empresa,
      id_tipo_sucursal: id_tipo_sucursal // Devolvemos el tipo para confirmación.
    });

  } catch (error) {
    console.error('Error al crear sucursal:', error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del nombre dentro de la empresa (UNIQUE constraint).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `Ya existe una sucursal con el nombre "${req.body.nombre}" para la empresa con ID ${req.body.id_empresa}.`,
           error: error.message
       });
    } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
    }
  }
};

// [PUT] /api/sucursales/:id
// Actualiza un registro existente en la tabla 'sucursales' por su ID.
const updateSucursal = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const { nombre, direccion, numero_telefono, id_empresa, id_tipo_sucursal, id_status } = req.body; // Campos a actualizar.

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar.
    if (nombre === undefined && direccion === undefined && numero_telefono === undefined && id_empresa === undefined && id_tipo_sucursal === undefined && id_status === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar (nombre, direccion, numero_telefono, id_empresa, id_tipo_sucursal, id_status).' });
    }

    // Validar si la empresa existe (FK) si se intenta actualizar id_empresa.
    if (id_empresa !== undefined) {
        const empresaExists = await query('SELECT id FROM empresas WHERE id = ?', [id_empresa]);
        if (empresaExists.length === 0) {
            return res.status(400).json({ message: `El ID de empresa ${id_empresa} no es válido.` });
        }
    }

    // Validar si el tipo de sucursal existe (FK) si se intenta actualizar id_tipo_sucursal.
    if (id_tipo_sucursal !== undefined) {
        const tipoSucursalExists = await query('SELECT id FROM tipos_sucursal WHERE id = ?', [id_tipo_sucursal]);
        if (tipoSucursalExists.length === 0) {
            return res.status(400).json({ message: `El ID de tipo de sucursal ${id_tipo_sucursal} no es válido.` });
        }
    }

     // Validar si el status existe (FK) si se intenta actualizar id_status.
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }

    // fecha_actualizacion se actualiza automáticamente en la DB.

    // Construir la consulta UPDATE dinámicamente.
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
    if (id_tipo_sucursal !== undefined) { // Incluido.
        updates.push('id_tipo_sucursal = ?');
        params.push(id_tipo_sucursal);
    }
     if (id_status !== undefined) {
        updates.push('id_status = ?');
        params.push(id_status);
    }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no fue encontrado.
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Sucursal con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar sucursal con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del nombre dentro de la empresa.
     if (error.code === 'ER_DUP_ENTRY') {
       // Construir mensaje de error más específico si se proporciona nombre y/o id_empresa
       const nombreSucursal = req.body.nombre !== undefined ? `"${req.body.nombre}"` : '[Sin cambiar]';
       const idEmpresa = req.body.id_empresa !== undefined ? req.body.id_empresa : '[Sin cambiar]';
       res.status(409).json({ // 409 Conflict.
           message: `Ya existe una sucursal con el nombre ${nombreSucursal} para la empresa con ID ${idEmpresa}.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/sucursales/:id
// Elimina un registro de la tabla 'sucursales' por su ID.
const deleteSucursal = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID de la sucursal a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM sucursales WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Sucursal con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar sucursal con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usada por otras tablas (areas, empleados, equipos, direcciones_ip, asignaciones)
     // debido a ON DELETE RESTRICT/SET NULL en las FKs.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar la sucursal con ID ${req.params.id} porque tiene áreas, empleados, equipos, direcciones IP o asignaciones asociadas.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// Exportamos las funciones del controlador.
module.exports = {
  getAllSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
};