// src/controllers/direccionesIp.controller.js
// ! Controlador para la entidad Direcciones IP
// * Aquí gestiono todo lo relacionado con las direcciones IP del inventario: creación, consulta, actualización y eliminación.
// * Incluye validaciones de formato y relaciones con sucursales y status.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// Función de ayuda para validar formato básico de IPv4/IPv6 (simplificado)
// * Nota: Esto solo valida el formato, no garantiza que la IP sea asignable o ruteable.
function isValidIpAddress(ip) {
    // * Permito null o vacío si el campo no es obligatorio.
    if (!ip || typeof ip !== 'string') return false;
    ip = ip.trim();
    // Regex simple para IPv4 o IPv6 no comprimido
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i; // Simplificado, no cubre compresión IPv6
     // Para IPv6 más completo, usar una librería o regex más compleja.
     // Ejemplo de regex más completa para IPv6 (incluye compresión, link-local, etc.):
     // const ipv6FullRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/gi;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}


// ===============================================================
// * Funciones controladoras para cada endpoint de direcciones IP
// ===============================================================

// [GET] /api/direcciones-ip
// * Trae todas las direcciones IP con JOINs a sucursales y status
const getAllDireccionesIp = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada IP
    // LEFT JOIN para `sucursales` porque `id_sucursal` es NULLable.
    const sql = `
      SELECT
        di.id,
        di.direccion_ip,
        di.id_sucursal,
        s.nombre AS nombre_sucursal, -- Nombre de la sucursal (puede ser NULL).
        di.comentario,
        di.fecha_registro,
        di.fecha_actualizacion, -- Incluido el campo de última actualización.
        di.id_status,
        st.nombre_status AS status_nombre -- Nombre del status.
      FROM direcciones_ip AS di
      LEFT JOIN sucursales AS s ON di.id_sucursal = s.id -- LEFT JOIN porque id_sucursal es NULLable.
      JOIN status AS st ON di.id_status = st.id -- INNER JOIN porque id_status NO es NULLable.
    `;
    // Ejecutamos la consulta.
    const direcciones = await query(sql);

    // * Devuelvo la lista como JSON
    res.status(200).json(direcciones);

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las direcciones IP:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/direcciones-ip/:id
// * Trae una dirección IP específica por su ID (con relaciones)
const getDireccionIpById = async (req, res, next) => {
  try {
    // * Extraigo el ID desde los parámetros de la URL
    const { id } = req.params;

    // * Consulta SQL con JOINs para traer la IP y sus relaciones
    const sql = `
      SELECT
        di.id,
        di.direccion_ip,
        di.id_sucursal,
        s.nombre AS nombre_sucursal,
        di.comentario,
        di.fecha_registro,
        di.fecha_actualizacion, -- Incluido.
        di.id_status,
        st.nombre_status AS status_nombre
      FROM direcciones_ip AS di
      LEFT JOIN sucursales AS s ON di.id_sucursal = s.id
      JOIN status AS st ON di.id_status = st.id
      WHERE di.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const direcciones = await query(sql, params); // query siempre devuelve un array.

    // * Si no existe, devuelvo 404
    if (direcciones.length === 0) {
      // Si el array está vacío, la dirección IP no fue encontrada (404 Not Found).
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      // * Si existe, devuelvo el objeto
      res.status(200).json(direcciones[0]);
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener dirección IP con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/direcciones-ip
// * Crea una nueva dirección IP con validaciones
const createDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. Algunos campos son obligatorios, otros opcionales.
    const { direccion_ip, id_sucursal, comentario, id_status } = req.body;

    // * Validaciones de campos obligatorios y formatos
    // Validar campo obligatorio: direccion_ip.
    if (!direccion_ip) {
      return res.status(400).json({ message: 'El campo direccion_ip es obligatorio.' });
    }
    // Validar formato de la dirección IP.
    if (!isValidIpAddress(direccion_ip)) {
         return res.status(400).json({ message: `La dirección IP "${direccion_ip}" no tiene un formato válido.` });
    }

    // * Valido existencia de FKs (sucursal, status)
    // Validar si id_sucursal proporcionado existe (si el usuario lo envió y no es NULL).
    if (id_sucursal !== undefined && id_sucursal !== null) {
        const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
        if (sucursalExists.length === 0) {
            return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
        }
    }

    // Validar si id_status proporcionado existe (si el usuario lo envió y no es NULL).
     if (id_status !== undefined && id_status !== null) {
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }

    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO direcciones_ip (direccion_ip';
    const values = [direccion_ip];
    const placeholders = ['?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined/null).
    if (id_sucursal !== undefined && id_sucursal !== null) { sql += ', id_sucursal'; placeholders.push('?'); values.push(id_sucursal); }
    if (comentario !== undefined && comentario !== null) { sql += ', comentario'; placeholders.push('?'); values.push(comentario); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
     // Si id_status es undefined, la DB usa el DEFAULT.

    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newIpId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Dirección IP creada exitosamente',
      id: newIpId,
      direccion_ip: direccion_ip
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear dirección IP:', error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación de la direccion_ip (UNIQUE constraint).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `La dirección IP "${req.body.direccion_ip}" ya existe.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [PUT] /api/direcciones-ip/:id
// * Actualiza una dirección IP por su ID
const updateDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const { direccion_ip, id_sucursal, comentario, id_status } = req.body;

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar.
    const updatesCount = Object.keys(req.body).length;
    if (updatesCount === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // Validar formato de la dirección IP si se intenta actualizar.
    if (direccion_ip !== undefined && direccion_ip !== null) { // Permite actualizar a null si la columna lo permitiera, aunque no es el caso aquí.
        if (!isValidIpAddress(direccion_ip)) {
             return res.status(400).json({ message: `La dirección IP "${direccion_ip}" no tiene un formato válido.` });
        }
         // Si se envía null o cadena vacía para direccion_ip (que es NOT NULL), la DB debería lanzar un error.
         // Podemos añadir una validación explícita aquí para un 400 más amigable.
         if (direccion_ip === null || direccion_ip.trim() === '') {
             return res.status(400).json({ message: 'El campo direccion_ip no puede estar vacío.' });
         }
    }


    // Validar si id_sucursal existe (si se intenta actualizar y no es NULL).
    if (id_sucursal !== undefined && id_sucursal !== null) {
        const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
        if (sucursalExists.length === 0) {
            return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
        }
    } else if (id_sucursal === null) {
         // Si intentan poner null, y la columna lo permite, no hay validación de existencia.
         // No hacemos nada aquí, se manejará en la construcción del SQL.
    }

     // Validar si id_status existe (si se intenta actualizar y no es NULL).
     if (id_status !== undefined && id_status !== null) {
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }

    // fecha_actualizacion se actualiza automáticamente en la DB.

    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE direcciones_ip SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body.
    if (direccion_ip !== undefined) { updates.push('direccion_ip = ?'); params.push(direccion_ip); }
    if (id_sucursal !== undefined) { updates.push('id_sucursal = ?'); params.push(id_sucursal); } // Manejará null si se envía
    if (comentario !== undefined) { updates.push('comentario = ?'); params.push(comentario); } // Manejará null si se envía
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); } // Manejará null si se envía (pero 400 arriba lo impide)

    // Si no hay campos para actualizar, ya se manejó al inicio con `updatesCount`.
     if (updates.length === 0) {
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no fue encontrado.
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Dirección IP con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar dirección IP con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación de la direccion_ip.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `La dirección IP "${req.body.direccion_ip}" ya existe.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/direcciones-ip/:id
// * Elimina una dirección IP por su ID
const deleteDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo el ID de la IP a eliminar
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM direcciones_ip WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Dirección IP con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar dirección IP con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usada por asignaciones (ON DELETE SET NULL).
     // Similar a empleados, el SET NULL debería permitir la eliminación, pero manejamos el error por si acaso.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar la dirección IP con ID ${req.params.id} porque está siendo utilizada en asignaciones.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllDireccionesIp,
  getDireccionIpById,
  createDireccionIp,
  updateDireccionIp,
  deleteDireccionIp,
};