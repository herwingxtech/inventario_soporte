// src/routes/direccionesIp.routes.js
// Define las rutas HTTP para la entidad 'direcciones_ip'.

const express = require('express');
const router = express.Router(); // Creamos una instancia del enrutador.

// Importamos las funciones controladoras.
const direccionesIpController = require('../controllers/direcciones_ip.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/direcciones-ip en server.js.
// ===============================================================

// [GET] /api/direcciones-ip
// Ruta para obtener todas las direcciones IP.
router.get('/', direccionesIpController.getAllDireccionesIp);

// [GET] /api/direcciones-ip/:id
// Ruta para obtener una dirección IP específica por su ID.
router.get('/:id', direccionesIpController.getDireccionIpById);

// [POST] /api/direcciones-ip
// Ruta para crear una nueva dirección IP.
router.post('/', direccionesIpController.createDireccionIp);

// [PUT] /api/direcciones-ip/:id
// Ruta para actualizar una dirección IP existente por su ID.
router.put('/:id', direccionesIpController.updateDireccionIp);

// [DELETE] /api/direcciones-ip/:id
// Ruta para eliminar una dirección IP por su ID.
router.delete('/:id', direccionesIpController.deleteDireccionIp);

// Exportamos el router.
module.exports = router;