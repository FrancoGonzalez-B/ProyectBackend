const express = require('express');
const ClientesController = require('../controllers/ClientesController');
const { validarDTO } = require('../middlewares/validarDTO');
const { validarId } = require('../middlewares/validarId');
const { validarClienteCrear } = require('../dtos/ClienteDTO');

function init(clienteService) {
  const router = express.Router();
  const controller = new ClientesController({ clienteService });

  router.post('', validarDTO(validarClienteCrear), (req, res, next) =>
    controller.crear(req, res, next),
  );
  router.get('', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', validarId, (req, res, next) =>
    controller.obtener(req, res, next),
  );
  router.put(
    '/:id',
    validarId,
    validarDTO(validarClienteCrear),
    (req, res, next) => controller.actualizar(req, res, next),
  );
  router.delete('/:id', validarId, (req, res, next) =>
    controller.eliminar(req, res, next),
  );

  return router;
}

module.exports = { init };
