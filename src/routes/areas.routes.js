// src/routes/areas.routes.js

const express = require('express');
const router = express.Router();

// Importamos el controlador de areas
const areasController = require('../controllers/areas.controller');

// Definimos las rutas para areas

// GET /api/areas - Obtener todas las areas
router.get('/', areasController.getAllAreas);

// GET /api/areas/:id - Obtener un area por ID
router.get('/:id', areasController.getAreaById);

// POST /api/areas - Crear una nueva area
router.post('/', areasController.createArea);

// PUT /api/areas/:id - Actualizar un area por ID
router.put('/:id', areasController.updateArea);

// DELETE /api/areas/:id - Eliminar un area por ID
router.delete('/:id', areasController.deleteArea);

// Exportamos el enrutador
module.exports = router;