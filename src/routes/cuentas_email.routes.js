// src/routes/cuentasEmail.routes.js
// Define las rutas HTTP para la entidad 'cuentas_email_corporativo'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras.
const cuentasEmailController = require('../controllers/cuentas_email.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/cuentas-email en server.js.
// ===============================================================

// [GET] /api/cuentas-email
// Ruta para obtener todas las cuentas de email corporativo.
// IMPORTANTE: El controlador EXCLUYE el campo password_data por seguridad.
router.get('/', cuentasEmailController.getAllCuentasEmail);

// [GET] /api/cuentas-email/:id
// Ruta para obtener una cuenta de email específica por su ID.
// IMPORTANTE: El controlador EXCLUYE el campo password_data por seguridad.
router.get('/:id', cuentasEmailController.getCuentaEmailById);

// [POST] /api/cuentas-email
// Ruta para crear una nueva cuenta de email corporativo.
// Incluye validaciones y manejo del campo password_data (ver notas de seguridad en el controlador).
router.post('/', cuentasEmailController.createCuentaEmail);

// [PUT] /api/cuentas-email/:id
// Ruta para actualizar una cuenta de email corporativo existente por su ID.
// Permite actualizar el campo password_data (ver notas de seguridad en el controlador).
router.put('/:id', cuentasEmailController.updateCuentaEmail);

// [DELETE] /api/cuentas-email/:id
// Ruta para eliminar una cuenta de email corporativo por su ID.
router.delete('/:id', cuentasEmailController.deleteCuentaEmail);

// Exportamos el router.
module.exports = router;