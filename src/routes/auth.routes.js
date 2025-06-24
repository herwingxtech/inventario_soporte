// src/routes/auth.routes.js
// * Este archivo define las rutas para la autenticación, como el login.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// [POST] /api/auth/login
router.post('/login', authController.login);

//TODO: Añadir otras rutas de autenticación aquí en el futuro,
//      como /register, /forgot-password, /reset-password, etc.

module.exports = router; 