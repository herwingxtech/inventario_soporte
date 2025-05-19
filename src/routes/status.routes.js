// src/routes/status.routes.js

const express = require('express');
const router = express.Router(); // Creamos una instancia del enrutador de Express

// Importamos las funciones del controlador de status
const statusController = require('../controllers/status.controller');

// Definimos las rutas y asignamos la función del controlador que debe manejarlas

// GET /api/status - Obtener todos los estados
router.get('/', statusController.getAllStatuses);

// GET /api/status/:id - Obtener un estado por ID
router.get('/:id', statusController.getStatusById);

// POST /api/status - Crear un nuevo estado
router.post('/', statusController.createStatus);

// PUT /api/status/:id - Actualizar un estado por ID
router.put('/:id', statusController.updateStatus);

// DELETE /api/status/:id - Eliminar un estado por ID
router.delete('/:id', statusController.deleteStatus);

// Exportamos el enrutador para que pueda ser usado en server.js
module.exports = router;