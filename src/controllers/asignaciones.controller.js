// src/controllers/asignaciones.controller.js
// * Controlador para manejar las operaciones CRUD de la entidad Asignaciones.
// * Incluye transacciones y lógica para actualizar el estado de equipos/IPs relacionados.

const { query, getConnection } = require('../config/db');

// * Función de ayuda para validar formato de fecha/hora.
function isValidDateTime(dateTimeString) {
    if (!dateTimeString) return true;
    const regex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
    if (!regex.test(dateTimeString)) return false;
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return false;
     if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
         const [year, month, day] = dateTimeString.split('-').map(Number);
         return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
     }
    return true;
}

// * IDs de Status que usaré en la lógica de negocio.
const STATUS_ASIGNADO_EQUIPO_IP = 4;
const STATUS_DISPONIBLE_EQUIPO_IP = 5;
const STATUS_ASIGNACION_ACTIVA = 1;
const STATUS_ASIGNACION_FINALIZADA = 6;

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/asignaciones
const getAllAsignaciones = async (req, res, next) => {
  console.log('Herwing - Backend: Solicitando TODAS las asignaciones con filtros:', req.query);
  try {
    const { equipoId, empleadoId, activa, sucursalId, areaId, ipId } = req.query;
    const sqlBase = `
      SELECT
        a.id, a.id_equipo, e.numero_serie AS equipo_numero_serie, e.nombre_equipo AS equipo_nombre,
        a.id_empleado, emp.nombres AS empleado_nombres, emp.apellidos AS empleado_apellidos,
        a.id_sucursal_asignado, s.nombre AS sucursal_asignada_nombre,
        a.id_area_asignado, ar.nombre AS area_asignada_nombre,
        a.id_equipo_padre, ep.numero_serie AS equipo_padre_numero_serie, ep.nombre_equipo AS equipo_padre_nombre,
        a.id_ip, ip.direccion_ip AS ip_direccion,
        a.fecha_asignacion, a.fecha_fin_asignacion, a.observacion,
        a.fecha_registro, a.fecha_actualizacion,
        a.id_status_asignacion, st.nombre_status AS status_nombre
      FROM asignaciones AS a
      LEFT JOIN equipos AS e ON a.id_equipo = e.id
      LEFT JOIN empleados AS emp ON a.id_empleado = emp.id
      LEFT JOIN sucursales AS s ON a.id_sucursal_asignado = s.id
      LEFT JOIN areas AS ar ON a.id_area_asignado = ar.id
      LEFT JOIN equipos AS ep ON a.id_equipo_padre = ep.id
      LEFT JOIN direcciones_ip AS ip ON a.id_ip = ip.id
      LEFT JOIN status AS st ON a.id_status_asignacion = st.id
    `;
    const whereClauses = [];
    const params = [];
    if (equipoId) { whereClauses.push('a.id_equipo = ?'); params.push(equipoId); }
    if (empleadoId) { whereClauses.push('a.id_empleado = ?'); params.push(empleadoId); }
    if (sucursalId) { whereClauses.push('a.id_sucursal_asignado = ?'); params.push(sucursalId); }
    if (areaId) { whereClauses.push('a.id_area_asignado = ?'); params.push(areaId); }
    if (ipId) { whereClauses.push('a.id_ip = ?'); params.push(ipId); }
    if (activa === 'true') { whereClauses.push('a.fecha_fin_asignacion IS NULL'); }
    else if (activa === 'false') { whereClauses.push('a.fecha_fin_asignacion IS NOT NULL'); }

    let sql = whereClauses.length > 0 ? `${sqlBase} WHERE ${whereClauses.join(' AND ')}` : sqlBase;
    sql += ' ORDER BY a.fecha_asignacion DESC, a.id DESC';

    const asignaciones = await query(sql, params);
    res.status(200).json(asignaciones);
  } catch (error) {
    console.error('Herwing - Backend (getAllAsignaciones): Error:', error);
    next(error);
  }
};

// [GET] /api/asignaciones/:id
const getAsignacionById = async (req, res, next) => {
  const { id } = req.params;
  console.log(`Herwing - Backend: Solicitando asignación con ID: ${id}`);
  try {
    const sql = `
      SELECT
        a.id, a.id_equipo, e.numero_serie AS equipo_numero_serie, e.nombre_equipo AS equipo_nombre,
        a.id_empleado, emp.nombres AS empleado_nombres, emp.apellidos AS empleado_apellidos,
        a.id_sucursal_asignado, s.nombre AS sucursal_asignada_nombre,
        a.id_area_asignado, ar.nombre AS area_asignada_nombre,
        a.id_equipo_padre, ep.numero_serie AS equipo_padre_numero_serie, ep.nombre_equipo AS equipo_padre_nombre,
        a.id_ip, ip.direccion_ip AS ip_direccion,
        a.fecha_asignacion, a.fecha_fin_asignacion, a.observacion,
        a.fecha_registro, a.fecha_actualizacion,
        a.id_status_asignacion, st.nombre_status AS status_nombre
      FROM asignaciones AS a
      LEFT JOIN equipos AS e ON a.id_equipo = e.id
      LEFT JOIN empleados AS emp ON a.id_empleado = emp.id
      LEFT JOIN sucursales AS s ON a.id_sucursal_asignado = s.id
      LEFT JOIN areas AS ar ON a.id_area_asignado = ar.id
      LEFT JOIN equipos AS ep ON a.id_equipo_padre = ep.id
      LEFT JOIN direcciones_ip AS ip ON a.id_ip = ip.id
      LEFT JOIN status AS st ON a.id_status_asignacion = st.id
      WHERE a.id = ?
    `;
    const params = [id];
    console.log(`Herwing - Backend (getAsignacionById): Ejecutando SQL: ${sql} con params:`, params);
    const asignacionesRows = await query(sql, params);
    console.log('Herwing - Backend (getAsignacionById): Resultado de la consulta:', JSON.stringify(asignacionesRows, null, 2));

    if (!asignacionesRows || asignacionesRows.length === 0) {
      console.log(`Herwing - Backend (getAsignacionById): ID ${id} no encontrado. Enviando 404.`);
      return res.status(404).json({ message: `Registro de asignación con ID ${id} no encontrado.` });
    }
    const asignacionData = asignacionesRows[0];
    console.log(`Herwing - Backend (getAsignacionById): ID ${id} encontrado. Enviando datos.`);
    res.status(200).json(asignacionData);

  } catch (error) {
    console.error(`Herwing - Backend (getAsignacionById): ERROR para ID ${id}:`, error);
    next(error);
  }
};

// [POST] /api/asignaciones
const createAsignacion = async (req, res, next) => {
    const {
        id_equipo, id_empleado, id_sucursal_asignado, id_area_asignado,
        id_equipo_padre, id_ip, fecha_asignacion,
        observacion, id_status_asignacion: input_id_status_asignacion
    } = req.body;
    let connection;

    try {
        // === Validaciones ===
        if (!id_equipo || !fecha_asignacion) return res.status(400).json({ message: 'id_equipo y fecha_asignacion son obligatorios.' });
        if (!isValidDateTime(fecha_asignacion)) return res.status(400).json({ message: 'Formato de fecha_asignacion inválido.' });
        
        const isCreatingActiveAssignment = true;
        const locationFks = [id_empleado, id_sucursal_asignado, id_area_asignado];
        const nonNullLocationFks = locationFks.filter(id => id !== undefined && id !== null);
        if (isCreatingActiveAssignment && nonNullLocationFks.length === 0) {
            return res.status(400).json({ message: 'Asignación activa debe tener empleado, sucursal o área.' });
        }
        
        // * Validaciones de existencia de FKs (CORREGIDO - sin desestructurar)
        if (id_equipo) { const eRows = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]); if(!eRows || eRows.length === 0) return res.status(400).json({message: `Equipo ID ${id_equipo} no existe`}); }
        // ... (resto de tus validaciones de FKs aquí) ...

        // === Reglas de Unicidad para Activas (CORREGIDO - sin desestructurar) ===
        const activeEquipoRows = await query('SELECT id FROM asignaciones WHERE id_equipo = ? AND fecha_fin_asignacion IS NULL', [id_equipo]);
        if (activeEquipoRows && activeEquipoRows.length > 0) return res.status(409).json({ message: `El equipo ID ${id_equipo} ya tiene una asignación activa.` });
        if (id_ip) {
            const activeIpRows = await query('SELECT id FROM asignaciones WHERE id_ip = ? AND fecha_fin_asignacion IS NULL', [id_ip]);
            if (activeIpRows && activeIpRows.length > 0) return res.status(409).json({ message: `La IP ID ${id_ip} ya tiene una asignación activa.` });
        }

        connection = await getConnection();
        await connection.beginTransaction();
        console.log('Herwing - Backend (createAsignacion): Transacción iniciada.');

        let sqlInsert = 'INSERT INTO asignaciones (id_equipo, fecha_asignacion';
        const valuesInsert = [id_equipo, fecha_asignacion.replace('T', ' ').substring(0,19)];
        const placeholdersInsert = ['?', '?'];

        if (id_empleado !== undefined) { sqlInsert += ', id_empleado'; placeholdersInsert.push('?'); valuesInsert.push(id_empleado); }
        if (id_sucursal_asignado !== undefined) { sqlInsert += ', id_sucursal_asignado'; placeholdersInsert.push('?'); valuesInsert.push(id_sucursal_asignado); }
        if (id_area_asignado !== undefined) { sqlInsert += ', id_area_asignado'; placeholdersInsert.push('?'); valuesInsert.push(id_area_asignado); }
        if (id_equipo_padre !== undefined) { sqlInsert += ', id_equipo_padre'; placeholdersInsert.push('?'); valuesInsert.push(id_equipo_padre); }
        if (id_ip !== undefined) { sqlInsert += ', id_ip'; placeholdersInsert.push('?'); valuesInsert.push(id_ip); }
        if (observacion !== undefined) { sqlInsert += ', observacion'; placeholdersInsert.push('?'); valuesInsert.push(observacion); }
        const finalStatusAsignacion = (input_id_status_asignacion !== undefined && input_id_status_asignacion !== null) ? input_id_status_asignacion : STATUS_ASIGNACION_ACTIVA;
        sqlInsert += ', id_status_asignacion'; placeholdersInsert.push('?'); valuesInsert.push(finalStatusAsignacion);
        sqlInsert += `) VALUES (${placeholdersInsert.join(', ')})`;

        const [resultAsignacion] = await connection.execute(sqlInsert, valuesInsert);
        const newAsignacionId = resultAsignacion.insertId;

        if (isCreatingActiveAssignment) {
            await connection.execute('UPDATE equipos SET id_status = ? WHERE id = ?', [STATUS_ASIGNADO_EQUIPO_IP, id_equipo]);
            if (id_ip) {
                await connection.execute('UPDATE direcciones_ip SET id_status = ? WHERE id = ?', [STATUS_ASIGNADO_EQUIPO_IP, id_ip]);
            }
        }
        await connection.commit();

        res.status(201).json({ message: 'Asignación creada y estados actualizados.', id: newAsignacionId, id_equipo: id_equipo });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Herwing - Backend (createAsignacion): Error, rollback ejecutado:', error);
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

// [PUT] /api/asignaciones/:id
// * Actualiza una asignación. Incluye transacciones y lógica de estados.
// * AHORA con lógica mejorada para sincronizar fecha_fin y estado_finalizado.
const updateAsignacion = async (req, res, next) => {
  const { id: asignacionId } = req.params;
  const updateData = req.body;
  let connection;

  try {
      connection = await getConnection();
      await connection.beginTransaction();
      console.log(`Herwing - Backend (updateAsignacion): Transacción iniciada para ID ${asignacionId}.`);

      // * 1. Obtengo la asignación actual.
      const [currentAsignacionesRows] = await connection.execute('SELECT * FROM asignaciones WHERE id = ?', [asignacionId]);
      if (currentAsignacionesRows.length === 0) {
          await connection.rollback(); if (connection) connection.release();
          return res.status(404).json({ message: `Asignación ID ${asignacionId} no encontrada.` });
      }
      const currentAsignacion = currentAsignacionesRows[0];
      const eraActiva = currentAsignacion.fecha_fin_asignacion === null;

        // === NUEVA REGLA DE NEGOCIO: Proteger asignaciones finalizadas ===
        // * Si la asignación YA está finalizada (`!eraActiva`), no permito la mayoría de las modificaciones.
        // * Solo permito cambiar 'observacion' o quizás el 'id_status_asignacion' a 'Cancelado', pero no reactivarla.
        if (!eraActiva) {
          // * Verifico si se está intentando reactivarla (quitar fecha_fin o cambiar estado a activo).
          if (updateData.fecha_fin_asignacion === null || (updateData.id_status_asignacion && updateData.id_status_asignacion === STATUS_ASIGNACION_ACTIVA)) {
              await connection.rollback(); if (connection) connection.release();
              return res.status(409).json({ message: 'Una asignación finalizada no puede ser reactivada. Debe crear una nueva asignación.' });
          }
          // * También podría restringir cambios a otros campos como id_equipo, id_empleado, etc. en registros históricos.
          // * Por ejemplo, solo permitir actualizar 'observacion'.
          const camposPermitidosEnHistorico = ['observacion']; // Puedes añadir más si lo consideras necesario
          const camposIntentados = Object.keys(updateData);
          const cambioNoPermitido = camposIntentados.some(campo => !camposPermitidosEnHistorico.includes(campo));
          if (cambioNoPermitido) {
               await connection.rollback(); if (connection) connection.release();
               return res.status(409).json({ message: 'Solo se pueden modificar las observaciones en una asignación histórica.' });
          }
      }
      // * 2. Determino los valores FINALES de los campos clave y ajusto la lógica de finalización.
      // * Si el campo NO está en updateData, uso el valor actual de currentAsignacion.
      let final_fecha_fin_asignacion_str = currentAsignacion.fecha_fin_asignacion;
      if (updateData.fecha_fin_asignacion !== undefined) {
          final_fecha_fin_asignacion_str = (updateData.fecha_fin_asignacion === '' || updateData.fecha_fin_asignacion === null) ? null : updateData.fecha_fin_asignacion.replace('T', ' ').substring(0,19);
      }

      let final_id_status_asignacion = updateData.id_status_asignacion !== undefined ? updateData.id_status_asignacion : currentAsignacion.id_status_asignacion;

      // === Regla de Negocio: Sincronización de Fecha Fin y Estado 'Finalizado' ===
      const seEstaFinalizandoPorStatus = final_id_status_asignacion === STATUS_ASIGNACION_FINALIZADA;
      const seEstaFinalizandoPorFecha = final_fecha_fin_asignacion_str !== null;

      if (seEstaFinalizandoPorStatus && !seEstaFinalizandoPorFecha) {
          // * Si el usuario establece el estado a 'Finalizado' pero no envía una fecha de fin,
          // * yo establezco la fecha de fin a la hora actual.
          const ahora = new Date();
          final_fecha_fin_asignacion_str = ahora.toISOString().slice(0, 19).replace('T', ' ');
          updateData.fecha_fin_asignacion = final_fecha_fin_asignacion_str; // Añado/sobreescribo para que se guarde en DB
          console.log(`Herwing - Asignación ${asignacionId} marcada como Finalizada, se auto-estableció fecha_fin a: ${final_fecha_fin_asignacion_str}`);
      } else if (seEstaFinalizandoPorFecha && !seEstaFinalizandoPorStatus) {
          // * Si el usuario establece una fecha de fin pero no cambia el estado,
          // * yo fuerzo el estado a 'Finalizado'.
          final_id_status_asignacion = STATUS_ASIGNACION_FINALIZADA;
          updateData.id_status_asignacion = STATUS_ASIGNACION_FINALIZADA; // Añado/sobreescribo para que se guarde en DB
          console.log(`Herwing - Asignación ${asignacionId} con fecha_fin establecida, se auto-estableció estado a Finalizado.`);
      } else if (!seEstaFinalizandoPorFecha && seEstaFinalizandoPorStatus) {
          // * Caso inválido: No se puede tener un estado 'Finalizado' sin una fecha de fin.
          // * Aunque el código de arriba lo arregla, añado esta validación por si acaso.
          await connection.rollback(); if (connection) connection.release();
          return res.status(400).json({ message: 'Una asignación con estado "Finalizado" debe tener una fecha de fin.' });
      } else if (seEstaFinalizandoPorFecha && final_id_status_asignacion === STATUS_ASIGNACION_ACTIVA) {
          // * Caso inválido: No se puede tener una fecha de fin y un estado 'Activo'.
          await connection.rollback(); if (connection) connection.release();
          return res.status(400).json({ message: 'Una asignación con una fecha de fin no puede tener el estado "Activo".' });
      }


      const esAhoraActiva = final_fecha_fin_asignacion_str === null;

      // ... (resto de validaciones de "al menos una asociación", unicidad, FKs, etc. igual que antes) ...


      // * 3. Lógica para actualizar estados de equipos/IPs relacionados.
      // * Esta lógica ahora es más fiable porque se basa en `eraActiva` y `esAhoraActiva`.
      if (eraActiva && !esAhoraActiva) { // Finalizando
          if (currentAsignacion.id_equipo) {
              await connection.execute('UPDATE equipos SET id_status = ? WHERE id = ?', [STATUS_DISPONIBLE_EQUIPO_IP, currentAsignacion.id_equipo]);
              console.log(`Herwing - Asignación finalizada: Equipo ${currentAsignacion.id_equipo} a DISPONIBLE.`);
          }
          if (currentAsignacion.id_ip) {
              await connection.execute('UPDATE direcciones_ip SET id_status = ? WHERE id = ?', [STATUS_DISPONIBLE_EQUIPO_IP, currentAsignacion.id_ip]);
              console.log(`Herwing - Asignación finalizada: IP ${currentAsignacion.id_ip} a DISPONIBLE.`);
          }
      }
      // ... (resto de la lógica de actualización de estados para otros casos, igual que antes) ...
      else if (!eraActiva && esAhoraActiva) { /* Activando */
          const final_id_equipo = updateData.id_equipo !== undefined ? updateData.id_equipo : currentAsignacion.id_equipo;
          const final_id_ip = updateData.id_ip !== undefined ? updateData.id_ip : currentAsignacion.id_ip;
          if (final_id_equipo) await connection.execute('UPDATE equipos SET id_status = ? WHERE id = ?', [STATUS_ASIGNADO_EQUIPO_IP, final_id_equipo]);
          if (final_id_ip) await connection.execute('UPDATE direcciones_ip SET id_status = ? WHERE id = ?', [STATUS_ASIGNADO_EQUIPO_IP, final_id_ip]);
          console.log(`Herwing - Asignación activada: Equipo ${final_id_equipo}, IP ${final_id_ip} -> ASIGNADO.`);
      }
      else if (eraActiva && esAhoraActiva) { /* Sigue activa, pero items pueden cambiar */
          const final_id_equipo = updateData.id_equipo !== undefined ? updateData.id_equipo : currentAsignacion.id_equipo;
          const final_id_ip = updateData.id_ip !== undefined ? updateData.id_ip : currentAsignacion.id_ip;
          if (updateData.id_equipo !== undefined && currentAsignacion.id_equipo !== final_id_equipo) {
              if (currentAsignacion.id_equipo) await connection.execute('UPDATE equipos SET id_status = ? WHERE id = ?', [STATUS_DISPONIBLE_EQUIPO_IP, currentAsignacion.id_equipo]);
              if (final_id_equipo) await connection.execute('UPDATE equipos SET id_status = ? WHERE id = ?', [STATUS_ASIGNADO_EQUIPO_IP, final_id_equipo]);
          }
          if (updateData.id_ip !== undefined && currentAsignacion.id_ip !== final_id_ip) {
              if (currentAsignacion.id_ip) await connection.execute('UPDATE direcciones_ip SET id_status = ? WHERE id = ?', [STATUS_DISPONIBLE_EQUIPO_IP, currentAsignacion.id_ip]);
              if (final_id_ip) await connection.execute('UPDATE direcciones_ip SET id_status = ? WHERE id = ?', [STATUS_ASIGNADO_EQUIPO_IP, final_id_ip]);
          }
      }

      // * 4. Construyo y ejecuto la SQL para actualizar la asignación misma.
      let sqlUpdate = 'UPDATE asignaciones SET ';
      const valuesUpdate = [];
      const updates = [];

      // Lleno `updates` y `valuesUpdate` solo con los campos que están presentes en `updateData`.
      // La lógica anterior ya ha modificado `updateData` si era necesario (ej. añadiendo fecha_fin o id_status_asignacion).
      Object.keys(updateData).forEach(key => {
          if (['id_equipo', 'id_empleado', 'id_sucursal_asignado', 'id_area_asignado', 'id_equipo_padre', 'id_ip', 'fecha_asignacion', 'fecha_fin_asignacion', 'observacion', 'id_status_asignacion'].includes(key)) {
              updates.push(`${key} = ?`);
              if (key === 'fecha_asignacion' || key === 'fecha_fin_asignacion') {
                   valuesUpdate.push(updateData[key] ? (String(updateData[key]).replace('T',' ').substring(0,19)) : null);
              } else {
                   valuesUpdate.push(updateData[key]);
              }
          }
      });
      
      if (updates.length > 0) {
          sqlUpdate += updates.join(', ') + ' WHERE id = ?';
          valuesUpdate.push(asignacionId);
          await connection.execute(sqlUpdate, valuesUpdate);
      } else {
           console.log('Herwing - No hubo campos para actualizar en la asignación, pero estados relacionados pudieron cambiar.');
      }

      await connection.commit();
      console.log('Herwing - Transacción completada (commit) para actualizar asignación.');

      res.status(200).json({ message: `Asignación ID ${asignacionId} y estados relacionados actualizados.` });

  } catch (error) {
      if (connection) await connection.rollback();
      console.error(`Herwing - Backend (updateAsignacion): Error, rollback ejecutado para ID ${asignacionId}:`, error);
      next(error);
  } finally {
      if (connection) {
          connection.release();
          console.log(`Herwing - Backend (updateAsignacion): Conexión liberada para ID ${asignacionId}.`);
      }
  }
};


// [DELETE] /api/asignaciones/:id
const deleteAsignacion = async (req, res, next) => {
    const { id: asignacionId } = req.params;
    let connection;

    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const asignacionesRows = await query('SELECT id_equipo, id_ip, fecha_fin_asignacion FROM asignaciones WHERE id = ?', [asignacionId]);
        if (!asignacionesRows || asignacionesRows.length === 0) { // <-- CORRECCIÓN
            if(connection) { await connection.rollback(); connection.release(); }
            return res.status(404).json({ message: `Asignación ID ${asignacionId} no encontrada.` });
        }
        const asignacionToDelete = asignacionesRows[0];
        const eraActivaAlEliminar = asignacionToDelete.fecha_fin_asignacion === null;

        await connection.execute('DELETE FROM asignaciones WHERE id = ?', [asignacionId]);

        if (eraActivaAlEliminar) {
            if (asignacionToDelete.id_equipo) {
                await connection.execute('UPDATE equipos SET id_status = ? WHERE id = ?', [STATUS_DISPONIBLE_EQUIPO_IP, asignacionToDelete.id_equipo]);
            }
            if (asignacionToDelete.id_ip) {
                await connection.execute('UPDATE direcciones_ip SET id_status = ? WHERE id = ?', [STATUS_DISPONIBLE_EQUIPO_IP, asignacionToDelete.id_ip]);
            }
        }

        await connection.commit();
        res.status(200).json({ message: `Asignación ID ${asignacionId} eliminada y estados actualizados.` });

    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
  getAllAsignaciones,
  getAsignacionById,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
};