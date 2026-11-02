const express = require('express');
const router = express.Router();
const CategoriasController = require('../controllers/CategoriasController');
const { validarDTO } = require('../middlewares/validarDTO');
const { validarId } = require('../middlewares/validarId');
const { validarCategoriaCrear } = require('../dtos/CategoriaDTO');

function init(categoriaService) {
  const controller = new CategoriasController({ categoriaService });

  router.post('', validarDTO(validarCategoriaCrear), (req, res, next) => controller.crear(req, res, next));
  router.get('', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', validarId, (req, res, next) => controller.obtener(req, res, next));
  router.put('/:id', validarId, validarDTO(validarCategoriaCrear), (req, res, next) => controller.actualizar(req, res, next));
  router.delete('/:id', validarId, (req, res, next) => controller.eliminar(req, res, next));

  return router;
}

module.exports = { init };
