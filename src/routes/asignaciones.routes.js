// src/routes/asignaciones.routes.js
// Define las rutas HTTP para la entidad 'asignaciones'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de asignaciones
const asignacionesController = require('../controllers/asignaciones.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/asignaciones en server.js.
// ===============================================================

// * [GET] /api/asignaciones - Trae todas las asignaciones (puede incluir filtros)
router.get('/', asignacionesController.getAllAsignaciones);

// * [GET] /api/asignaciones/:id - Trae una asignación específica por su ID
router.get('/:id', asignacionesController.getAsignacionById);

// * [POST] /api/asignaciones - Crea una nueva asignación (valida reglas de negocio)
router.post('/', asignacionesController.createAsignacion);

// * [PUT] /api/asignaciones/:id - Actualiza una asignación por su ID (valida reglas de negocio)
router.put('/:id', asignacionesController.updateAsignacion);

// * [DELETE] /api/asignaciones/:id - Elimina una asignación por su ID
router.delete('/:id', asignacionesController.deleteAsignacion);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;