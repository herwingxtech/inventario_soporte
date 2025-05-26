// src/routes/empleados.routes.js
// Define las rutas HTTP para la entidad 'empleados'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras que contienen la lógica para manejar estas rutas.
const empleadosController = require('../controllers/empleados.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Asociamos cada ruta HTTP a su función controladora correspondiente.
// Estas rutas se montarán bajo el prefijo /api/empleados en server.js.
// ===============================================================

// [GET] /api/empleados
// Ruta para obtener todos los empleados.
router.get('/', empleadosController.getAllEmpleados);

// [GET] /api/empleados/:id
// Ruta para obtener un empleado específico por su ID.
router.get('/:id', empleadosController.getEmpleadoById);

// [POST] /api/empleados
// Ruta para crear un nuevo empleado.
router.post('/', empleadosController.createEmpleado);

// [PUT] /api/empleados/:id
// Ruta para actualizar un empleado existente por su ID.
router.put('/:id', empleadosController.updateEmpleado);

// [DELETE] /api/empleados/:id
// Ruta para eliminar un empleado por su ID.
router.delete('/:id', empleadosController.deleteEmpleado);

// Exportamos el objeto router.
// Esto permite que sea importado y "montado" por el archivo principal del servidor (server.js).
module.exports = router;