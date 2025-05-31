// ! Rutas para la entidad Sucursales

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo el controlador de sucursales
const sucursalesController = require('../controllers/sucursales.controller');

// * Defino las rutas para sucursales y les asigno el controlador correspondiente

// * [GET] /api/sucursales - Trae todas las sucursales
router.get('/', sucursalesController.getAllSucursales);

// * [GET] /api/sucursales/:id - Trae una sucursal específica por su ID
router.get('/:id', sucursalesController.getSucursalById);

// * [POST] /api/sucursales - Crea una nueva sucursal
router.post('/', sucursalesController.createSucursal);

// * [PUT] /api/sucursales/:id - Actualiza una sucursal por su ID
router.put('/:id', sucursalesController.updateSucursal);

// * [DELETE] /api/sucursales/:id - Elimina una sucursal por su ID
router.delete('/:id', sucursalesController.deleteSucursal);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;