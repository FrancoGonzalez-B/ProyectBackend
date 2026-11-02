const express = require('express');
const router = express.Router();
const PedidosController = require('../controllers/PedidosController');
const { validarDTO } = require('../middlewares/validarDTO');
const { validarId } = require('../middlewares/validarId');
const { validarCambioEstado, validarPedidoCrear } = require('../dtos/PedidoDTO');

function init(pedidoService) {
  const controller = new PedidosController({ pedidoService });

  router.post('', validarDTO(validarPedidoCrear), (req, res, next) => controller.crear(req, res, next));
  router.get('', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', validarId, (req, res, next) => controller.obtener(req, res, next));
  router.patch('/:id/estado', validarId, validarDTO(validarCambioEstado), (req, res, next) => controller.cambiarEstado(req, res, next));
  router.post('/:id/cancelar', validarId, (req, res, next) => controller.cancelar(req, res, next));

  return router;
}

module.exports = { init };
