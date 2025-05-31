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

// ! Rutas para la entidad Notas

// * [GET] /api/notas - Trae todas las notas
router.get('/', notasController.getAllNotas);

// * [GET] /api/notas/:id - Trae una nota específica por su ID
router.get('/:id', notasController.getNotaById);

// * [POST] /api/notas - Crea una nueva nota
router.post('/', notasController.createNota);

// * [PUT] /api/notas/:id - Actualiza una nota por su ID
router.put('/:id', notasController.updateNota);

// * [DELETE] /api/notas/:id - Elimina una nota por su ID
router.delete('/:id', notasController.deleteNota);

// Exportamos el router.
module.exports = router;