// src/routes/empleados.routes.js
// Define las rutas HTTP para la entidad 'empleados'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de empleados
const empleadosController = require('../controllers/empleados.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Estas rutas se montarán bajo el prefijo /api/empleados en server.js.
// ===============================================================

// * [GET] /api/empleados - Trae todos los empleados
router.get('/', empleadosController.getAllEmpleados);

// * [GET] /api/empleados/:id - Trae un empleado específico por su ID
router.get('/:id', empleadosController.getEmpleadoById);

// * [POST] /api/empleados - Crea un nuevo empleado
router.post('/', empleadosController.createEmpleado);

// * [PUT] /api/empleados/:id - Actualiza un empleado por su ID
router.put('/:id', empleadosController.updateEmpleado);

// * [DELETE] /api/empleados/:id - Elimina un empleado por su ID
router.delete('/:id', empleadosController.deleteEmpleado);

// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;