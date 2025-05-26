// src/controllers/areas.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Áreas.
// Ahora las áreas dependen de Sucursales y solo pueden crearse en Sucursales de tipo 'Corporativo'.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/areas
// Obtiene y devuelve todos los registros de la tabla 'areas'.
// Incluye el nombre de la sucursal y empresa asociada, y el estado, mediante JOINs.
const getAllAreas = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar áreas.
    // Hacemos JOIN con 'sucursales', 'empresas' (a través de sucursales) y 'status'.
    // El JOIN principal ahora es a `sucursales`.
    const sql = `
      SELECT
        a.id,
        a.nombre,
        a.id_sucursal, -- Ahora FK a sucursales.
        s.nombre AS nombre_sucursal, -- Nombre de la sucursal a la que pertenece el área.
        e.nombre AS nombre_empresa, -- Nombre de la empresa (obtenido a través de la sucursal).
        a.fecha_registro,
        a.fecha_actualizacion, -- Incluido.
        a.id_status,
        st.nombre_status AS status_nombre -- Nombre del status.
      FROM areas AS a
      JOIN sucursales AS s ON a.id_sucursal = s.id -- Unir con sucursales.
      JOIN empresas AS e ON s.id_empresa = e.id -- Unir con empresas a través de sucursales.
      JOIN status AS st ON a.id_status = st.id -- Unir con status.
    `;
    // Ejecutamos la consulta.
    const areas = await query(sql);

    // Enviamos la lista de áreas como respuesta JSON (200 OK).
    res.status(200).json(areas);

  } catch (error) {
    console.error('Error al obtener todas las áreas:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/areas/:id
// Obtiene y devuelve un área específica por su ID.
// Incluye nombres de entidades relacionadas.
const getAreaById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del área.
    const { id } = req.params;

    // Consulta SQL para seleccionar un área por ID con JOINs.
     const sql = `
      SELECT
        a.id,
        a.nombre,
        a.id_sucursal, -- FK a sucursales.
        s.nombre AS nombre_sucursal,
        e.nombre AS nombre_empresa,
        a.fecha_registro,
        a.fecha_actualizacion, -- Incluido.
        a.id_status,
        st.nombre_status AS status_nombre
      FROM areas AS a
      JOIN sucursales AS s ON a.id_sucursal = s.id
      JOIN empresas AS e ON s.id_empresa = e.id
      JOIN status AS st ON a.id_status = st.id
      WHERE a.id = ? -- Filtrar por ID.
    `;
    const params = [id]; // ID a buscar.
    const areas = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (areas.length === 0) {
      // Si no se encontró, 404 Not Found.
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      // Si se encontró, devolvemos el primer resultado (200 OK).
      res.status(200).json(areas[0]);
    }

  } catch (error) {
    console.error(`Error al obtener área con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/areas
// Crea un nuevo registro en la tabla 'areas'.
// Incluye validación para asegurar que solo se crea en sucursales de tipo 'Corporativo'.
const createArea = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos datos del body. nombre e id_sucursal son obligatorios.
    // id_status es opcional (tiene DEFAULT).
    const { nombre, id_sucursal, id_status } = req.body; // CAMBIADO de id_empresa a id_sucursal.

    // === Validaciones ===
    // Validar campos obligatorios.
    if (!nombre || id_sucursal === undefined) {
      return res.status(400).json({ message: 'Los campos nombre e id_sucursal son obligatorios.' }); // Mensaje actualizado.
    }

    // Validar si la sucursal existe (FK) Y obtener su tipo para la regla de negocio.
    const sucursalResult = await query('SELECT id, id_tipo_sucursal FROM sucursales WHERE id = ?', [id_sucursal]);
    if (sucursalResult.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
    }
    const sucursal = sucursalResult[0]; // Obtenemos los datos de la sucursal.

    // Obtener el ID del tipo de sucursal 'Corporativo'.
    // En una aplicación más grande, este ID se podría obtener una vez al inicio o desde un archivo de constantes.
    const tipoCorporativoResult = await query('SELECT id FROM tipos_sucursal WHERE nombre_tipo = ?', ['Corporativo']);
    if (tipoCorporativoResult.length === 0) {
         // Esto indica que el tipo 'Corporativo' no existe en la tabla tipos_sucursal. Es un error de configuración de DB.
         console.error("Error de configuración: No se encontró el tipo de sucursal 'Corporativo' en la DB.");
         // Devolver un error 500 porque es un problema interno, no de la petición del cliente.
         return res.status(500).json({ message: 'Error interno de configuración del servidor: Tipo de sucursal "Corporativo" no definido.' });
    }
    const idTipoCorporativo = tipoCorporativoResult[0].id; // ID del tipo 'Corporativo'.

    // === Regla de Negocio: Validar que la sucursal sea de tipo 'Corporativo' ===
    if (sucursal.id_tipo_sucursal !== idTipoCorporativo) {
        // Si la sucursal no es corporativa, devolver un error 400.
        return res.status(400).json({ message: `Las áreas solo pueden ser creadas para sucursales de tipo 'Corporativo'. La sucursal con ID ${id_sucursal} no es de este tipo.` });
    }

    // Validar si el status existe (FK) si se proporcionó.
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }
    // fecha_registro y fecha_actualizacion usan DEFAULT/ON UPDATE.

    // Consulta SQL para insertar (construcción dinámica).
    let sql = 'INSERT INTO areas (nombre, id_sucursal'; // CAMBIADO: id_empresa a id_sucursal.
    let placeholders = ['?', '?'];
    const values = [nombre, id_sucursal]; // CAMBIADO: id_empresa a id_sucursal.

    if (id_status !== undefined) {
        sql += ', id_status';
        placeholders.push('?');
        values.push(id_status);
    }

    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newAreaId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Área creada exitosamente',
      id: newAreaId,
      nombre: nombre,
      id_sucursal: id_sucursal // Devolvemos la sucursal asociada.
    });

  } catch (error) {
    console.error('Error al crear área:', error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del nombre dentro de la sucursal (UNIQUE constraint).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `Ya existe un área con el nombre "${req.body.nombre}" para la sucursal con ID ${req.body.id_sucursal}.`, // Mensaje actualizado.
           error: error.message
       });
    } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
    }
  }
};

// [PUT] /api/areas/:id
// Actualiza un registro existente en la tabla 'areas' por su ID.
// Incluye validación para asegurar que el área permanece o se mueve a una sucursal 'Corporativo'.
const updateArea = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const { nombre, id_sucursal, id_status } = req.body; // Campos a actualizar.

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar.
    if (nombre === undefined && id_sucursal === undefined && id_status === undefined) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar (nombre, id_sucursal, id_status).' }); // Mensaje actualizado.
    }

    // === Validar si la sucursal (nueva o actual) es de tipo 'Corporativo' ===
    let targetSucursalId = id_sucursal; // La sucursal a la que el área intentará asociarse (si se está actualizando id_sucursal).

    if (targetSucursalId === undefined) {
        // Si no se está actualizando el id_sucursal, necesitamos obtener el ID de la sucursal actual
        // del área para verificar su tipo.
        const currentAreaResult = await query('SELECT id_sucursal FROM areas WHERE id = ?', [id]);
        if (currentAreaResult.length === 0) {
             return res.status(404).json({ message: `Área con ID ${id} no encontrada.` }); // El área a actualizar no existe.
        }
        targetSucursalId = currentAreaResult[0].id_sucursal; // ID de la sucursal actual del área.
    }

    // Ahora, con el ID de la sucursal objetivo (nueva o actual), validamos su tipo.
    const sucursalResult = await query('SELECT id, id_tipo_sucursal FROM sucursales WHERE id = ?', [targetSucursalId]);
    // Si la sucursal actual/nueva no existe, es un error de FK o validación previa (debería dar 400 arriba si se envió id_sucursal)
    // o un error de integridad de datos si la sucursal actual del área no existe.
    if (sucursalResult.length === 0) {
         // Si targetSucursalId venía del body, el 400 ya se manejó. Si venía de la DB, es un error de integridad.
         const errorMessage = id_sucursal !== undefined ?
             `El ID de sucursal ${id_sucursal} no es válido.` : // Error del cliente al enviar ID.
             `Error de integridad: Sucursal con ID ${targetSucursalId} asociada al área ${id} no encontrada.`; // Error interno/DB.
         return res.status(id_sucursal !== undefined ? 400 : 500).json({ message: errorMessage });
    }
    const sucursal = sucursalResult[0]; // Datos de la sucursal objetivo.

    // Obtener el ID del tipo 'Corporativo'.
    const tipoCorporativoResult = await query('SELECT id FROM tipos_sucursal WHERE nombre_tipo = ?', ['Corporativo']);
     if (tipoCorporativoResult.length === 0) {
         console.error("Error de configuración: No se encontró el tipo de sucursal 'Corporativo' en la DB.");
         return res.status(500).json({ message: 'Error interno de configuración del servidor: Tipo de sucursal "Corporativo" no definido.' });
    }
    const idTipoCorporativo = tipoCorporativoResult[0].id;

    // Validar que la sucursal objetivo es de tipo 'Corporativo'.
    if (sucursal.id_tipo_sucursal !== idTipoCorporativo) {
        // Si la sucursal objetivo no es corporativa, devolver un error 400.
        return res.status(400).json({ message: `Las áreas solo pueden estar en sucursales de tipo 'Corporativo'. La sucursal con ID ${targetSucursalId} no es de este tipo.` });
    }


     // Validar si el status existe (FK) si se intenta actualizar id_status.
    if (id_status !== undefined) {
        const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
        if (statusExists.length === 0) {
            return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
        }
    }

    // fecha_actualizacion se actualiza automáticamente.

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE areas SET ';
    const params = [];
    const updates = [];

    if (nombre !== undefined) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
     if (id_sucursal !== undefined) { // CAMBIADO: id_empresa a id_sucursal.
        updates.push('id_sucursal = ?'); // CAMBIADO.
        params.push(id_sucursal); // CAMBIADO.
    }
     if (id_status !== undefined) {
        updates.push('id_status = ?');
        params.push(id_status);
    }

    // Si no hay campos para actualizar (solo se envió el ID pero sin body o body vacío),
    // esto ya se manejó al inicio. Pero si updates está vacío por alguna razón, evitar SQL inválido.
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
      // (La validación inicial de existencia ya lo cubre si no se cambia id_sucursal,
      // pero si se cambia id_sucursal y el ID del área original no existe, llega aquí).
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Área con ID ${id} actualizada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar área con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Si hay duplicación del nombre dentro de la sucursal.
     if (error.code === 'ER_DUP_ENTRY') {
       // Construir mensaje de error más específico si se proporciona nombre y/o id_sucursal
       const nombreArea = req.body.nombre !== undefined ? `"${req.body.nombre}"` : '[Sin cambiar]';
       const idSucursal = req.body.id_sucursal !== undefined ? req.body.id_sucursal : '[Sin cambiar]';
       res.status(409).json({ // 409 Conflict.
           message: `Ya existe un área con el nombre ${nombreArea} para la sucursal con ID ${idSucursal}.`, // Mensaje actualizado.
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/areas/:id
// Elimina un registro de la tabla 'areas' por su ID.
const deleteArea = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del área a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM areas WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Área con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar área con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usada por otras tablas (empleados, asignaciones)
     // debido a ON DELETE SET NULL en las FKs.
     // Aunque la FK es SET NULL, el error ER_ROW_IS_REFERENCED_2 aún puede ocurrir
     // si hay otras restricciones o si el motor de DB lo reporta así antes de SET NULL.
     // Es seguro manejar este error aquí, aunque SET NULL permitiría la eliminación en cascada de FKs.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el área con ID ${req.params.id} porque tiene empleados o asignaciones asociadas.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// Exportamos las funciones del controlador.
module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};