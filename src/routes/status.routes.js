// ! Rutas para la entidad Status (estados del sistema)

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express para definir rutas específicas

// * Importo las funciones del controlador de status
const statusController = require('../controllers/status.controller');

// * Defino las rutas y les asigno la función del controlador correspondiente

// * [GET] /api/status - Trae todos los estados
router.get('/', statusController.getAllStatuses);

// * [GET] /api/status/:id - Trae un estado específico por su ID
router.get('/:id', statusController.getStatusById);

// * [POST] /api/status - Crea un nuevo estado
router.post('/', statusController.createStatus);

// * [PUT] /api/status/:id - Actualiza un estado por su ID
router.put('/:id', statusController.updateStatus);

// * [DELETE] /api/status/:id - Elimina un estado por su ID
router.delete('/:id', statusController.deleteStatus);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;