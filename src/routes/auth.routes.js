// src/routes/auth.routes.js
// * Este archivo define las rutas para la autenticación, como el login.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// [POST] /api/auth/login
// Ruta para que los usuarios inicien sesión.
router.post('/login', authController.login);

//TODO: Podrías añadir otras rutas de autenticación aquí en el futuro,
//      como /register (aunque ya tienes un CRUD para usuarios), /forgot-password, /reset-password, etc.

module.exports = router; 