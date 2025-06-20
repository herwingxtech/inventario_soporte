// src/controllers/equipos.controller.js
// * Controlador para manejar las operaciones CRUD de la entidad Equipos.

const { query } = require('../config/db');

// ===============================================================
// FUNCIONES DE VALIDACIÓN (Ayuda a mantener el código limpio)
// ===============================================================
function isValidDate(dateString) {
    if (!dateString) return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/equipos
const getAllEquipos = async (req, res, next) => {
    try {
        const sql = `
          SELECT
            e.id, e.numero_serie, e.nombre_equipo, e.marca, e.modelo,
            e.id_tipo_equipo, te.nombre_tipo AS nombre_tipo_equipo,
            e.id_sucursal_actual, s.nombre AS nombre_sucursal_actual,
             s.id_empresa, em.nombre AS nombre_empresa,
            e.procesador, e.ram, e.disco_duro, e.sistema_operativo, e.mac_address,
            e.otras_caracteristicas, e.fecha_compra, e.fecha_registro, e.fecha_actualizacion,
            e.id_status, st.nombre_status AS status_nombre
          FROM equipos AS e
         JOIN tipos_equipo AS te ON e.id_tipo_equipo = te.id
         JOIN sucursales AS s ON e.id_sucursal_actual = s.id
         JOIN empresas AS em ON s.id_empresa = em.id
         JOIN status AS st ON e.id_status = st.id
        `;
        const equipos = await query(sql);
        res.status(200).json(equipos);
    } catch (error) {
        console.error('Herwing - Backend (getAllEquipos): Error:', error);
        next(error);
    }
};

// [GET] /api/equipos/:id
const getEquipoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sql = `
          SELECT
            e.id, e.numero_serie, e.nombre_equipo, e.marca, e.modelo,
            e.id_tipo_equipo, te.nombre_tipo AS nombre_tipo_equipo,
            e.id_sucursal_actual, s.nombre AS nombre_sucursal_actual,
            e.procesador, e.ram, e.disco_duro, e.sistema_operativo, e.mac_address,
            e.otras_caracteristicas, e.fecha_compra, e.fecha_registro, e.fecha_actualizacion,
            e.id_status, st.nombre_status AS status_nombre
          FROM equipos AS e
          LEFT JOIN tipos_equipo AS te ON e.id_tipo_equipo = te.id
          LEFT JOIN sucursales AS s ON e.id_sucursal_actual = s.id
          LEFT JOIN status AS st ON e.id_status = st.id
          WHERE e.id = ?
        `;
        const equipos = await query(sql, [id]);
        if (!equipos || equipos.length === 0) {
            return res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
        }
        res.status(200).json(equipos[0]);
    } catch (error) {
        console.error(`Herwing - Backend (getEquipoById): Error para ID ${req.params.id}:`, error);
        next(error);
    }
};

// [POST] /api/equipos
const createEquipo = async (req, res, next) => {
    try {
        const {
            numero_serie, nombre_equipo, marca, modelo, id_tipo_equipo,
            id_sucursal_actual, procesador, ram, disco_duro, sistema_operativo,
            mac_address, otras_caracteristicas, fecha_compra, id_status
        } = req.body;

        // === Validaciones ===
        if (!numero_serie || id_tipo_equipo === undefined || id_sucursal_actual === undefined) {
            return res.status(400).json({ message: 'numero_serie, id_tipo_equipo e id_sucursal_actual son obligatorios.' });
        }
        if (numero_serie.trim() === '') return res.status(400).json({ message: 'numero_serie no puede estar vacío.' });
        if (!isValidDate(fecha_compra)) return res.status(400).json({ message: 'Formato de fecha_compra debe ser YYYY-MM-DD.' });

        // ... (tus otras validaciones de FKs para tipo_equipo, sucursal, status) ...

        let sql = 'INSERT INTO equipos (numero_serie, id_tipo_equipo, id_sucursal_actual';
        const values = [numero_serie, id_tipo_equipo, id_sucursal_actual];
        const placeholders = ['?', '?', '?'];

        // ... (tu lógica para construir el INSERT dinámico) ...
        if (nombre_equipo !== undefined) { sql += ', nombre_equipo'; placeholders.push('?'); values.push(nombre_equipo); }
        if (marca !== undefined) { sql += ', marca'; placeholders.push('?'); values.push(marca); }
        if (modelo !== undefined) { sql += ', modelo'; placeholders.push('?'); values.push(modelo); }
        if (procesador !== undefined) { sql += ', procesador'; placeholders.push('?'); values.push(procesador); }
        if (ram !== undefined) { sql += ', ram'; placeholders.push('?'); values.push(ram); }
        if (disco_duro !== undefined) { sql += ', disco_duro'; placeholders.push('?'); values.push(disco_duro); }
        if (sistema_operativo !== undefined) { sql += ', sistema_operativo'; placeholders.push('?'); values.push(sistema_operativo); }
        if (mac_address !== undefined) { sql += ', mac_address'; placeholders.push('?'); values.push(mac_address === null || mac_address.trim() === '' ? null : mac_address); }
        if (otras_caracteristicas !== undefined) { sql += ', otras_caracteristicas'; placeholders.push('?'); values.push(otras_caracteristicas); }
        if (fecha_compra !== undefined) { sql += ', fecha_compra'; placeholders.push('?'); values.push(fecha_compra); }
        if (id_status !== undefined) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }

        sql += `) VALUES (${placeholders.join(', ')})`;

        const result = await query(sql, values);
        const newEquipoId = result.insertId;

        res.status(201).json({ message: 'Equipo creado exitosamente', id: newEquipoId, numero_serie: numero_serie });
    } catch (error) {
        console.error('Herwing - Backend (createEquipo): Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El número de serie o MAC address ya existe.', error: error.message });
        }
        next(error);
    }
};

// [PUT] /api/equipos/:id
// * Actualiza un equipo. AHORA incluye validación para no cambiar el estado si está asignado o en mantenimiento.
const updateEquipo = async (req, res, next) => {
    const { id: equipoId } = req.params;
    const updateData = req.body;

    try {
        // * Si se está intentando cambiar el estado del equipo, realizo una validación especial.
        if (updateData.id_status !== undefined) {
            // * Primero, obtengo el estado actual del equipo para ver si está en un estado protegido.
            const equiposActuales = await query('SELECT id_status FROM equipos WHERE id = ?', [equipoId]);
            if (!equiposActuales || equiposActuales.length === 0) {
                return res.status(404).json({ message: `Equipo con ID ${equipoId} no encontrado.` });
            }
            const estadoActual = equiposActuales[0].id_status;

            // * Defino los IDs de los estados que son "automáticos" o "protegidos".
            const STATUS_ASIGNADO = 4;
            const STATUS_EN_MANTENIMIENTO = 3;

            // * Si el estado actual es uno de los protegidos...
            if ([STATUS_ASIGNADO, STATUS_EN_MANTENIMIENTO].includes(estadoActual)) {
                // * ... Y el nuevo estado que se intenta poner es DIFERENTE al actual...
                if (parseInt(updateData.id_status, 10) !== estadoActual) {
                    //! Regla de negocio: No se puede cambiar manualmente el estado de un equipo que está Asignado o En Mantenimiento.
                    let errorMessage = '';
                    if (estadoActual === STATUS_ASIGNADO) {
                        errorMessage = `El equipo está actualmente "Asignado". Para liberarlo, debe finalizar su asignación activa.`;
                    } else if (estadoActual === STATUS_EN_MANTENIMIENTO) {
                        errorMessage = `El equipo está actualmente "En Mantenimiento". Para liberarlo, debe finalizar el registro de mantenimiento.`;
                    }
                    return res.status(409).json({ message: errorMessage }); // 409 Conflict
                }
            }
        }


        // === El resto de la lógica de actualización ===
        // ... (tus otras validaciones de FKs para tipo_equipo, sucursal, etc.) ...
        if (updateData.fecha_compra !== undefined && !isValidDate(updateData.fecha_compra)) {
            return res.status(400).json({ message: 'Formato de fecha_compra debe ser YYYY-MM-DD.' });
        }

        // * Construcción dinámica del SQL UPDATE.
        let sqlUpdate = 'UPDATE equipos SET ';
        const valuesUpdate = [];
        const updates = [];
        Object.keys(updateData).forEach(key => {
            // * Me aseguro de que solo los campos válidos de la tabla equipos se incluyan.
            if (['numero_serie', 'nombre_equipo', 'marca', 'modelo', 'id_tipo_equipo', 'id_sucursal_actual', 'procesador', 'ram', 'disco_duro', 'sistema_operativo', 'mac_address', 'otras_caracteristicas', 'fecha_compra', 'id_status'].includes(key)) {
                updates.push(`${key} = ?`);
                valuesUpdate.push(updateData[key]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
        }

        sqlUpdate += updates.join(', ') + ' WHERE id = ?';
        valuesUpdate.push(equipoId);

        const result = await query(sqlUpdate, valuesUpdate);

        if (result.affectedRows === 0) {
            // Este caso es raro si la validación de estado pasó, pero es un buen fallback.
            return res.status(404).json({ message: `Equipo con ID ${equipoId} no encontrado o sin cambios.` });
        }

        res.status(200).json({ message: `Equipo con ID ${equipoId} actualizado exitosamente.` });

    } catch (error) {
        console.error(`Herwing - Backend (updateEquipo): Error al actualizar equipo ID ${equipoId}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El número de serie o MAC address ya existe.', error: error.message });
        }
        next(error);
    }
};

// [DELETE] /api/equipos/:id
const deleteEquipo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM equipos WHERE id = ?';
        const result = await query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
        }
        res.status(200).json({ message: `Equipo con ID ${id} eliminado exitosamente.` });
    } catch (error) {
        console.error(`Herwing - Backend (deleteEquipo): Error para ID ${req.params.id}:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: `No se puede eliminar el equipo con ID ${req.params.id} porque tiene asignaciones asociadas.`, error: error.message });
        }
        next(error);
    }
};

// Exportamos las funciones del controlador.
module.exports = {
    getAllEquipos,
    getEquipoById,
    createEquipo,
    updateEquipo,
    deleteEquipo,
};