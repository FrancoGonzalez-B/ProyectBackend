const express = require('express');
const router = express.Router();
const ClientesController = require('../controllers/ClientesController');
const { validarDTO } = require('../middlewares/validarDTO');
const { validarClienteCrear } = require('../dtos/ClienteDTO');

function init(clienteService) {
  const controller = new ClientesController({ clienteService });

  router.post('', validarDTO(validarClienteCrear), (req, res, next) => controller.crear(req, res, next));
  router.get('', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', (req, res, next) => controller.obtener(req, res, next));

  return router;
}

module.exports = { init };
