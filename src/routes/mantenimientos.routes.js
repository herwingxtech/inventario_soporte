// src/routes/mantenimientos.routes.js
// Define las rutas HTTP para la entidad 'mantenimientos'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de mantenimientos
const mantenimientosController = require('../controllers/mantenimientos.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/mantenimientos en server.js.
// ===============================================================

// * [GET] /api/mantenimientos - Trae todos los mantenimientos
router.get('/', mantenimientosController.getAllMantenimientos);

// * [GET] /api/mantenimientos/:id - Trae un mantenimiento específico por su ID
router.get('/:id', mantenimientosController.getMantenimientoById);

// * [POST] /api/mantenimientos - Crea un nuevo mantenimiento
router.post('/', mantenimientosController.createMantenimiento);

// * [PUT] /api/mantenimientos/:id - Actualiza un mantenimiento por su ID
router.put('/:id', mantenimientosController.updateMantenimiento);

// * [DELETE] /api/mantenimientos/:id - Elimina un mantenimiento por su ID
router.delete('/:id', mantenimientosController.deleteMantenimiento);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;