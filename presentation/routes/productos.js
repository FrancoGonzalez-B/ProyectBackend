const express = require('express');
const router = express.Router();
const ProductosController = require('../controllers/ProductosController');
const { validarDTO } = require('../middlewares/validarDTO');
const { validarId } = require('../middlewares/validarId');
const { validarProductoCrear } = require('../dtos/ProductoDTO');

function init(productoService) {
  const controller = new ProductosController({ productoService });

  router.post('', validarDTO(validarProductoCrear), (req, res, next) => controller.crear(req, res, next));
  router.get('', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', validarId, (req, res, next) => controller.obtener(req, res, next));
  router.put('/:id', validarId, validarDTO(validarProductoCrear), (req, res, next) => controller.actualizar(req, res, next));
  router.delete('/:id', validarId, (req, res, next) => controller.eliminar(req, res, next));

  return router;
}

module.exports = { init };
