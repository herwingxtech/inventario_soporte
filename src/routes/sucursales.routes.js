// src/routes/sucursales.routes.js

const express = require('express');
const router = express.Router();

// Importamos el controlador de sucursales
const sucursalesController = require('../controllers/sucursales.controller');

// Definimos las rutas para sucursales

// GET /api/sucursales - Obtener todas las sucursales
router.get('/', sucursalesController.getAllSucursales);

// GET /api/sucursales/:id - Obtener una sucursal por ID
router.get('/:id', sucursalesController.getSucursalById);

// POST /api/sucursales - Crear una nueva sucursal
router.post('/', sucursalesController.createSucursal);

// PUT /api/sucursales/:id - Actualizar una sucursal por ID
router.put('/:id', sucursalesController.updateSucursal);

// DELETE /api/sucursales/:id - Eliminar una sucursal por ID
router.delete('/:id', sucursalesController.deleteSucursal);

// Exportamos el enrutador
module.exports = router;