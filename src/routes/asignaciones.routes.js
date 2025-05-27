// src/routes/asignaciones.routes.js
// Define las rutas HTTP para la entidad 'asignaciones'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras.
const asignacionesController = require('../controllers/asignaciones.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/asignaciones en server.js.
// ===============================================================

// [GET] /api/asignaciones
// Ruta para obtener todos los registros de asignación.
// Puede incluir filtros (ej. por equipo, empleado, activas/históricas).
router.get('/', asignacionesController.getAllAsignaciones);

// [GET] /api/asignaciones/:id
// Ruta para obtener un registro de asignación específico por su ID.
router.get('/:id', asignacionesController.getAsignacionById);

// [POST] /api/asignaciones
// Ruta para crear un nuevo registro de asignación.
// *** Incluye validación de reglas de negocio para asignaciones activas. ***
router.post('/', asignacionesController.createAsignacion);

// [PUT] /api/asignaciones/:id
// Ruta para actualizar un registro de asignación existente por su ID.
// *** Incluye validación de reglas de negocio para asignaciones activas (ej. finalizar asignación). ***
router.put('/:id', asignacionesController.updateAsignacion);

// [DELETE] /api/asignaciones/:id
// Ruta para eliminar un registro de asignación por su ID.
router.delete('/:id', asignacionesController.deleteAsignacion);

// Exportamos el router.
module.exports = router;