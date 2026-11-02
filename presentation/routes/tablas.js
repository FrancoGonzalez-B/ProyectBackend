const express = require('express');
const { autenticar, soloAdmin } = require('../middlewares/auth');
module.exports = function rutasTablas(service) {
  const router = express.Router();
  router.use(autenticar, soloAdmin);
  router.get('/', async (req, res, next) => {
    try {
      res.json(await service.listar());
    } catch (e) {
      next(e);
    }
  });
  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await service.crear(req.body, req.usuario.id));
    } catch (e) {
      next(e);
    }
  });
  router.get('/:nombre/migracion', async (req, res, next) => {
    try {
      res.json(await service.migracion(req.params.nombre));
    } catch (e) {
      next(e);
    }
  });
  return router;
};
