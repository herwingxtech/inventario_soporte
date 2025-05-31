// src/routes/cuentasEmail.routes.js
// Define las rutas HTTP para la entidad 'cuentas_email_corporativo'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de cuentas de email
const cuentasEmailController = require('../controllers/cuentas_email.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/cuentas-email en server.js.
// ===============================================================

// * [GET] /api/cuentas-email - Trae todas las cuentas de email (sin password_data por seguridad)
router.get('/', cuentasEmailController.getAllCuentasEmail);

// * [GET] /api/cuentas-email/:id - Trae una cuenta de email específica por su ID (sin password_data)
router.get('/:id', cuentasEmailController.getCuentaEmailById);

// * [POST] /api/cuentas-email - Crea una nueva cuenta de email (ver notas de seguridad en el controlador)
router.post('/', cuentasEmailController.createCuentaEmail);

// * [PUT] /api/cuentas-email/:id - Actualiza una cuenta de email por su ID (ver notas de seguridad en el controlador)
router.put('/:id', cuentasEmailController.updateCuentaEmail);

// * [DELETE] /api/cuentas-email/:id - Elimina una cuenta de email por su ID
router.delete('/:id', cuentasEmailController.deleteCuentaEmail);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;