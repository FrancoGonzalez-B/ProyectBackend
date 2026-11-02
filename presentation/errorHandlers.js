function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const sendError = (status, code, message, details = []) =>
    res.status(status).json({
      error: { code, message, details },
    });
  if (err.type === 'entity.parse.failed') {
    return sendError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser JSON válido');
  }
  if (err.type === 'entity.too.large') {
    return sendError(
      413,
      'PAYLOAD_TOO_LARGE',
      'El cuerpo supera el tamaño permitido',
    );
  }
  if (
    err.type === 'encoding.unsupported' ||
    err.type === 'charset.unsupported'
  ) {
    return sendError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'La codificación del cuerpo no está permitida',
    );
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT_STATE',
        message: 'Ya existe un registro con esos datos',
        details: (err.errors || []).map((error) => ({
          campo: error.path,
          mensaje: error.message,
        })),
      },
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT_STATE',
        message:
          'El registro está relacionado con otros datos y no se puede modificar',
        details: [],
      },
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no cumplen las validaciones',
        details: (err.errors || []).map((error) => ({
          campo: error.path,
          mensaje: error.message,
        })),
      },
    });
  }

  if (err.name === 'ErrorDeDominio') {
    const codigoHttp =
      {
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

  const databaseCode = err.original?.code || err.parent?.code;
  if (
    [
      'ER_DATA_TOO_LONG',
      'ER_WARN_DATA_OUT_OF_RANGE',
      'ER_TRUNCATED_WRONG_VALUE',
      'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
      'WARN_DATA_TRUNCATED',
      'ER_BAD_NULL_ERROR',
      'ER_CHECK_CONSTRAINT_VIOLATED',
      'ER_CONSTRAINT_FAILED',
    ].includes(databaseCode)
  ) {
    return sendError(
      422,
      'VALIDATION_ERROR',
      'Los datos enviados no cumplen las restricciones de la base de datos',
    );
  }
  if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(databaseCode)) {
    return sendError(
      409,
      'CONFLICT_STATE',
      'Otra operación modificó estos datos; vuelve a intentarlo',
    );
  }
  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    return sendError(
      err.status,
      err.code || 'VALIDATION_ERROR',
      err.message || 'Solicitud inválida',
    );
  }
  console.error(err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error interno. Intente nuevamente más tarde',
      details: [],
    },
  });
}

module.exports = errorHandler;
