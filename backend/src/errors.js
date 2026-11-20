class ApiError extends Error {
  constructor(status, code, message, options) {
    super(message, options);
    this.status = status;
    this.code = code;
  }
}

function handleError(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    if (error.code === 'DATABASE_UNAVAILABLE') {
      console.error('Falló la consulta de salud de MySQL:', error.cause?.code ?? 'UNKNOWN');
    }
    return response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido.' },
    });
  }

  if (error.type === 'entity.too.large') {
    return response.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo de la solicitud es demasiado grande.' },
    });
  }

  console.error(error);
  return response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno.' },
  });
}

module.exports = { ApiError, handleError };
