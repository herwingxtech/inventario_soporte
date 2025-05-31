// ! Rutas para la entidad Áreas

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo el controlador de áreas
const areasController = require('../controllers/areas.controller');

// * Defino las rutas para áreas y les asigno el controlador correspondiente

// * [GET] /api/areas - Trae todas las áreas
router.get('/', areasController.getAllAreas);

// * [GET] /api/areas/:id - Trae un área específica por su ID
router.get('/:id', areasController.getAreaById);

// * [POST] /api/areas - Crea una nueva área
router.post('/', areasController.createArea);

// * [PUT] /api/areas/:id - Actualiza un área por su ID
router.put('/:id', areasController.updateArea);

// * [DELETE] /api/areas/:id - Elimina un área por su ID
router.delete('/:id', areasController.deleteArea);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;