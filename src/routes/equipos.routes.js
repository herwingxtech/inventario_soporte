// src/routes/equipos.routes.js
// Define las rutas HTTP para la entidad 'equipos'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras que contienen la lógica para manejar estas rutas.
const equiposController = require('../controllers/equipos.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/equipos en server.js.
// ===============================================================

// [GET] /api/equipos
// Ruta para obtener todos los equipos.
router.get('/', equiposController.getAllEquipos);

// [GET] /api/equipos/:id
// Ruta para obtener un equipo específico por su ID.
router.get('/:id', equiposController.getEquipoById);

// [POST] /api/equipos
// Ruta para crear un nuevo equipo.
router.post('/', equiposController.createEquipo);

// [PUT] /api/equipos/:id
// Ruta para actualizar un equipo existente por su ID.
router.put('/:id', equiposController.updateEquipo);

// [DELETE] /api/equipos/:id
// Ruta para eliminar un equipo por su ID.
router.delete('/:id', equiposController.deleteEquipo);

// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;