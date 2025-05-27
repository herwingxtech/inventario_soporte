// src/routes/usuariosSistema.routes.js
// Define las rutas HTTP para la entidad 'usuarios_sistema'.

const express = require('express');
const router = express.Router(); // Creamos una instancia del enrutador.

// Importamos las funciones controladoras.
const usuariosSistemaController = require('../controllers/usuarios_sistema.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/usuarios-sistema en server.js.
// ===============================================================

// [GET] /api/usuarios-sistema
// Ruta para obtener todos los usuarios del sistema.
router.get('/', usuariosSistemaController.getAllUsuariosSistema);

// [GET] /api/usuarios-sistema/:id
// Ruta para obtener un usuario del sistema específico por su ID.
router.get('/:id', usuariosSistemaController.getUsuarioSistemaById);

// [POST] /api/usuarios-sistema
// Ruta para crear un nuevo usuario del sistema.
// *** CRÍTICO: Esta ruta manejará el hashing de la contraseña. ***
router.post('/', usuariosSistemaController.createUsuarioSistema);

// [PUT] /api/usuarios-sistema/:id
// Ruta para actualizar un usuario del sistema existente por su ID.
// *** CRÍTICO: Esta ruta manejará la actualización de la contraseña si se proporciona. ***
router.put('/:id', usuariosSistemaController.updateUsuarioSistema);

// [DELETE] /api/usuarios-sistema/:id
// Ruta para eliminar un usuario del sistema por su ID.
router.delete('/:id', usuariosSistemaController.deleteUsuarioSistema);

// Exportamos el router.
module.exports = router;