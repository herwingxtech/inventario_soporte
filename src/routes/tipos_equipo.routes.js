// src/routes/tiposEquipo.routes.js
// Define las rutas HTTP para la entidad 'tipos_equipo'.

const express = require('express');
// Creamos una instancia del enrutador de Express. Este objeto nos permite definir rutas.
const router = express.Router();

// Importamos las funciones controladoras que contienen la lógica para manejar estas rutas.
const tiposEquipoController = require('../controllers/tipos_equipo.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/tipos-equipo en server.js.
// ===============================================================

// [GET] /api/tipos-equipo
// Ruta para obtener todos los tipos de equipo.
router.get('/', tiposEquipoController.getAllTiposEquipo);

// [GET] /api/tipos-equipo/:id
// Ruta para obtener un tipo de equipo específico por su ID.
// ':id' es un parámetro de ruta que será capturado en req.params.id.
router.get('/:id', tiposEquipoController.getTiposEquipoById);

// [POST] /api/tipos-equipo
// Ruta para crear un nuevo tipo de equipo.
router.post('/', tiposEquipoController.createTiposEquipo);

// [PUT] /api/tipos-equipo/:id
// Ruta para actualizar un tipo de equipo existente por su ID.
router.put('/:id', tiposEquipoController.updateTiposEquipo);

// [DELETE] /api/tipos-equipo/:id
// Ruta para eliminar un tipo de equipo por su ID.
router.delete('/:id', tiposEquipoController.deleteTiposEquipo);


// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;