// src/routes/tiposEquipo.routes.js
// Define las rutas HTTP para la entidad 'tipos_equipo'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de tipos de equipo
const tiposEquipoController = require('../controllers/tipos_equipo.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/tipos-equipo en server.js.
// ===============================================================

// * [GET] /api/tipos-equipo - Trae todos los tipos de equipo
router.get('/', tiposEquipoController.getAllTiposEquipo);

// * [GET] /api/tipos-equipo/:id - Trae un tipo de equipo específico por su ID
router.get('/:id', tiposEquipoController.getTiposEquipoById);

// * [POST] /api/tipos-equipo - Crea un nuevo tipo de equipo
router.post('/', tiposEquipoController.createTiposEquipo);

// * [PUT] /api/tipos-equipo/:id - Actualiza un tipo de equipo por su ID
router.put('/:id', tiposEquipoController.updateTiposEquipo);

// * [DELETE] /api/tipos-equipo/:id - Elimina un tipo de equipo por su ID
router.delete('/:id', tiposEquipoController.deleteTiposEquipo);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;