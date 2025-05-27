// src/routes/mantenimientos.routes.js
// Define las rutas HTTP para la entidad 'mantenimientos'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras.
const mantenimientosController = require('../controllers/mantenimientos.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/mantenimientos en server.js.
// ===============================================================

// [GET] /api/mantenimientos
// Ruta para obtener todos los registros de mantenimiento.
router.get('/', mantenimientosController.getAllMantenimientos);

// [GET] /api/mantenimientos/:id
// Ruta para obtener un registro de mantenimiento específico por su ID.
router.get('/:id', mantenimientosController.getMantenimientoById);

// [POST] /api/mantenimientos
// Ruta para crear un nuevo registro de mantenimiento.
router.post('/', mantenimientosController.createMantenimiento);

// [PUT] /api/mantenimientos/:id
// Ruta para actualizar un registro de mantenimiento existente por su ID.
router.put('/:id', mantenimientosController.updateMantenimiento);

// [DELETE] /api/mantenimientos/:id
// Ruta para eliminar un registro de mantenimiento por su ID.
router.delete('/:id', mantenimientosController.deleteMantenimiento);

// Exportamos el router.
module.exports = router;