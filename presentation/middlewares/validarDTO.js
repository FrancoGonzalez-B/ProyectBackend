function validarDTO(validador) {
  return (req, res, next) => {
    const errores = validador(req.body);
    if (errores.length > 0) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no cumplen las validaciones',
          details: errores,
        },
      });
    }
    next();
  };
}

module.exports = { validarDTO };
