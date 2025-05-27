// src/routes/notas.routes.js
// Define las rutas HTTP para la entidad 'notas'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras.
const notasController = require('../controllers/notas.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/notas en server.js.
// ===============================================================

// [GET] /api/notas
// Ruta para obtener todos los registros de notas.
router.get('/', notasController.getAllNotas);

// [GET] /api/notas/:id
// Ruta para obtener un registro de nota específico por su ID.
router.get('/:id', notasController.getNotaById);

// [POST] /api/notas
// Ruta para crear un nuevo registro de nota.
router.post('/', notasController.createNota);

// [PUT] /api/notas/:id
// Ruta para actualizar un registro de nota existente por su ID.
router.put('/:id', notasController.updateNota);

// [DELETE] /api/notas/:id
// Ruta para eliminar un registro de nota por su ID.
router.delete('/:id', notasController.deleteNota);

// Exportamos el router.
module.exports = router;