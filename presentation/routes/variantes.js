const express = require('express');
const { autenticar, soloAdmin } = require('../middlewares/auth');
const { validarDTO } = require('../middlewares/validarDTO');
function validar(data) {
  const d = data || {},
    errors = [];
  for (const [key, max] of [
    ['talla', 20],
    ['color', 40],
    ['sku', 80],
  ])
    if (typeof d[key] !== 'string' || !d[key].trim() || d[key].length > max)
      errors.push({ campo: key, mensaje: 'Texto requerido dentro del límite' });
  if (!Number.isSafeInteger(d.stock) || d.stock < 0 || d.stock > 100000)
    errors.push({
      campo: 'stock',
      mensaje: 'Stock debe estar entre 0 y 100000',
    });
  if (
    d.precio !== undefined &&
    d.precio !== null &&
    (!Number.isFinite(d.precio) ||
      d.precio <= 0 ||
      d.precio > 10000000 ||
      Number(d.precio.toFixed(2)) !== d.precio)
  )
    errors.push({ campo: 'precio', mensaje: 'Precio inválido' });
  return errors;
}
module.exports = function routes(service) {
  const router = express.Router({ mergeParams: true });
  router.use((req, res, next) => {
    if (
      !Number.isSafeInteger(Number(req.params.id)) ||
      Number(req.params.id) < 1
    )
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID inválido',
            details: [],
          },
        });
    next();
  });
  router.get('/', async (req, res, next) => {
    try {
      res.json(await service.listar(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  });
  router.use(autenticar, soloAdmin);
  router.param('varianteId', (req, res, next, id) => {
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1)
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Variante ID inválido',
            details: [],
          },
        });
    next();
  });
  router.post('/', validarDTO(validar), async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await service.crear(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  });
  router.put('/:varianteId', validarDTO(validar), async (req, res, next) => {
    try {
      res.json(
        await service.actualizar(
          Number(req.params.id),
          Number(req.params.varianteId),
          req.body,
        ),
      );
    } catch (e) {
      next(e);
    }
  });
  router.delete('/:varianteId', async (req, res, next) => {
    try {
      await service.eliminar(
        Number(req.params.id),
        Number(req.params.varianteId),
      );
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });
  return router;
};
