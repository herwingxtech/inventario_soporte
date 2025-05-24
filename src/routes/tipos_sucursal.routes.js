// src/routes/tiposSucursal.routes.js

const express = require('express');
const router = express.Router(); // Creamos una instancia del enrutador de Express

// Importamos las funciones del controlador de tipos de sucursal
const tiposSucursalController = require('../controllers/tipos_sucursal.controller');

// Definimos las rutas y asignamos la función del controlador que debe manejarlas

// GET /api/tipos-sucursal - Obtener todos los tipos de sucursal
router.get('/', tiposSucursalController.getAllTiposSucursal);

// GET /api/tipos-sucursal/:id - Obtener un tipo de sucursal por ID
router.get('/:id', tiposSucursalController.getTiposSucursalById);

// Las rutas POST, PUT, DELETE pueden no ser necesarias si los tipos son fijos,
// pero las incluimos por completitud si decides gestionarlos dinámicamente.
router.post('/', tiposSucursalController.createTiposSucursal);
router.put('/:id', tiposSucursalController.updateTiposSucursal);
router.delete('/:id', tiposSucursalController.deleteTiposSucursal);


// Exportamos el enrutador para que pueda ser usado en server.js
module.exports = router;