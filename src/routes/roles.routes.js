// src/routes/roles.routes.js
// Define las rutas HTTP para la entidad 'roles'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de roles
const rolesController = require('../controllers/roles.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/roles en server.js.
// ===============================================================

// * [GET] /api/roles - Trae todos los roles
router.get('/', rolesController.getAllRoles);

// * [GET] /api/roles/:id - Trae un rol específico por su ID
router.get('/:id', rolesController.getRoleById);

// * [POST] /api/roles - Crea un nuevo rol (en la práctica, los roles suelen ser fijos)
router.post('/', rolesController.createRole);

// * [PUT] /api/roles/:id - Actualiza un rol por su ID (en la práctica, los roles suelen ser fijos)
router.put('/:id', rolesController.updateRole);

// * [DELETE] /api/roles/:id - Elimina un rol por su ID (no debe eliminarse si está en uso)
router.delete('/:id', rolesController.deleteRole);

// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;