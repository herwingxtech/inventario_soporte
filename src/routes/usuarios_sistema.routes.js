// src/routes/usuariosSistema.routes.js
// Define las rutas HTTP para la entidad 'usuarios_sistema'.

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo las funciones controladoras de usuarios del sistema
const usuariosSistemaController = require('../controllers/usuarios_sistema.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/usuarios-sistema en server.js.
// ===============================================================

// * [GET] /api/usuarios-sistema - Trae todos los usuarios del sistema
router.get('/', usuariosSistemaController.getAllUsuariosSistema);

// * [GET] /api/usuarios-sistema/:id - Trae un usuario específico por su ID
router.get('/:id', usuariosSistemaController.getUsuarioSistemaById);

// * [POST] /api/usuarios-sistema - Crea un nuevo usuario (maneja hash de contraseña)
router.post('/', usuariosSistemaController.createUsuarioSistema);

// * [PUT] /api/usuarios-sistema/:id - Actualiza un usuario por su ID (puede actualizar contraseña)
router.put('/:id', usuariosSistemaController.updateUsuarioSistema);

// * [DELETE] /api/usuarios-sistema/:id - Elimina un usuario por su ID
router.delete('/:id', usuariosSistemaController.deleteUsuarioSistema);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;