// src/routes/equipos.routes.js
// Define las rutas HTTP para la entidad 'equipos'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de equipos
const equiposController = require('../controllers/equipos.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Estas rutas se montarán bajo el prefijo /api/equipos en server.js.
// ===============================================================

// * [GET] /api/equipos - Trae todos los equipos
router.get('/', equiposController.getAllEquipos);

// * [GET] /api/equipos/:id - Trae un equipo específico por su ID
router.get('/:id', equiposController.getEquipoById);

// * [POST] /api/equipos - Crea un nuevo equipo
router.post('/', equiposController.createEquipo);

// * [PUT] /api/equipos/:id - Actualiza un equipo por su ID
router.put('/:id', equiposController.updateEquipo);

// * [DELETE] /api/equipos/:id - Elimina un equipo por su ID
router.delete('/:id', equiposController.deleteEquipo);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;