// src/routes/empresas.routes.js

const express = require('express');
const router = express.Router();

// Importamos el controlador de empresas
const empresasController = require('../controllers/empresas.controller');

// Definimos las rutas para empresas

// GET /api/empresas - Obtener todas las empresas
router.get('/', empresasController.getAllEmpresas);

// GET /api/empresas/:id - Obtener una empresa por ID
router.get('/:id', empresasController.getEmpresaById);

// POST /api/empresas - Crear una nueva empresa
router.post('/', empresasController.createEmpresa);

// PUT /api/empresas/:id - Actualizar una empresa por ID
router.put('/:id', empresasController.updateEmpresa);

// DELETE /api/empresas/:id - Eliminar una empresa por ID
router.delete('/:id', empresasController.deleteEmpresa);

// Exportamos el enrutador
module.exports = router;