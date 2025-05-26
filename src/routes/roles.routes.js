// src/routes/roles.routes.js
// Define las rutas HTTP para la entidad 'roles'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras que contienen la lógica para manejar estas rutas.
const rolesController = require('../controllers/roles.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/roles en server.js.
// ===============================================================

// [GET] /api/roles
// Ruta para obtener todos los roles.
router.get('/', rolesController.getAllRoles);

// [GET] /api/roles/:id
// Ruta para obtener un rol específico por su ID.
// ':id' es un parámetro de ruta.
router.get('/:id', rolesController.getRoleById);

// [POST] /api/roles
// Ruta para crear un nuevo rol.
// NOTA: Los roles suelen ser fijos. Considera si necesitas esta ruta en tu aplicación final.
router.post('/', rolesController.createRole);

// [PUT] /api/roles/:id
// Ruta para actualizar un rol existente por su ID.
// NOTA: Los roles suelen ser fijos. Considera si necesitas esta ruta en tu aplicación final.
router.put('/:id', rolesController.updateRole);

// [DELETE] /api/roles/:id
// Ruta para eliminar un rol por su ID.
// NOTA: Los roles suelen ser fijos y no deben eliminarse si están en uso por usuarios.
router.delete('/:id', rolesController.deleteRole);

// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;