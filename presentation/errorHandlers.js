function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT_STATE',
        message: 'Ya existe un registro con esos datos',
        details: err.errors.map((error) => ({ campo: error.path, mensaje: error.message })),
      },
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT_STATE',
        message: 'El registro está relacionado con otros datos y no se puede modificar',
        details: [],
      },
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no cumplen las validaciones',
        details: err.errors.map((error) => ({ campo: error.path, mensaje: error.message })),
      },
    });
  }

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
