// src/routes/tiposSucursal.routes.js
// Define las rutas HTTP para la entidad 'tipos_sucursal'.

const express = require('express');
// Creamos una instancia del enrutador de Express. Este objeto nos permite definir rutas.
const router = express.Router();

// Importamos las funciones controladoras que contienen la lógica para manejar estas rutas.
const tiposSucursalController = require('../controllers/tipos_sucursal.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/tipos-sucursal en server.js.
// ===============================================================

// [GET] /api/tipos-sucursal
// Ruta para obtener todos los tipos de sucursal.
router.get('/', tiposSucursalController.getAllTiposSucursal);

// [GET] /api/tipos-sucursal/:id
// Ruta para obtener un tipo de sucursal específico por su ID.
// ':id' es un parámetro de ruta que será capturado en req.params.id.
router.get('/:id', tiposSucursalController.getTiposSucursalById);

// [POST] /api/tipos-sucursal
// Ruta para crear un nuevo tipo de sucursal.
router.post('/', tiposSucursalController.createTiposSucursal);

// [PUT] /api/tipos-sucursal/:id
// Ruta para actualizar un tipo de sucursal existente por su ID.
router.put('/:id', tiposSucursalController.updateTiposSucursal);

// [DELETE] /api/tipos-sucursal/:id
// Ruta para eliminar un tipo de sucursal por su ID.
router.delete('/:id', tiposSucursalController.deleteTiposSucursal);


// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;