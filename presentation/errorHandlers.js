function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ErrorDeDominio') {
    const codigoHttp = {
      RECURSO_NO_ENCONTRADO: 404,
      REGLA_NEGOCIO_VIOLADA: 400,
      CONFLICTO_ESTADO: 409,
    }[err.codigo] || 400;

    return res.status(codigoHttp).json({
      error: {
        code: err.codigo,
        message: err.message,
        details: err.detalles || [],
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error interno. Intente nuevamente más tarde',
      details: [],
    },
  });
}

module.exports = errorHandler;
