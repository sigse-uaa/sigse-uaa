class ApiError extends Error {
  constructor(status, code, message, options) {
    super(message, options);
    this.status = status;
    this.code = code;
    this.details = options?.details ?? [];
  }
}

/**
 * Los errores de mysql2 traen `sql` con los valores ya interpolados (correos,
 * hashes de contraseña) y `sqlMessage` puede repetirlos ("Duplicate entry '...'").
 * Para esos casos solo se registran los códigos.
 */
function logUnexpectedError(error) {
  const mysqlError = [error, error?.cause].find(
    (candidate) => candidate && (typeof candidate.sql === 'string' || candidate.sqlMessage),
  );
  if (mysqlError) {
    console.error('Error de MySQL:', {
      code: mysqlError.code,
      errno: mysqlError.errno,
      sqlState: mysqlError.sqlState,
    });
    return;
  }
  console.error(error);
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
      error: { code: error.code, message: error.message, details: error.details },
    });
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido.', details: [] },
    });
  }

  if (error.type === 'entity.too.large') {
    return response.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo de la solicitud es demasiado grande.', details: [] },
    });
  }

  logUnexpectedError(error);
  return response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno.', details: [] },
  });
}

module.exports = { ApiError, handleError };
