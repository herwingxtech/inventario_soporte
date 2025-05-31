// ! Rutas para la entidad Empresas

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo el controlador de empresas
const empresasController = require('../controllers/empresas.controller');

// * Defino las rutas para empresas y les asigno el controlador correspondiente

// * [GET] /api/empresas - Trae todas las empresas
router.get('/', empresasController.getAllEmpresas);

// * [GET] /api/empresas/:id - Trae una empresa específica por su ID
router.get('/:id', empresasController.getEmpresaById);

// * [POST] /api/empresas - Crea una nueva empresa
router.post('/', empresasController.createEmpresa);

// * [PUT] /api/empresas/:id - Actualiza una empresa por su ID
router.put('/:id', empresasController.updateEmpresa);

// * [DELETE] /api/empresas/:id - Elimina una empresa por su ID
router.delete('/:id', empresasController.deleteEmpresa);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;