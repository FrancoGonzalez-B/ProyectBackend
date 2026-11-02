function validarId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El ID debe ser un entero positivo',
        details: [{ campo: 'id', valor: req.params.id }],
      },
    });
  }
  return next();
}

module.exports = { validarId };
