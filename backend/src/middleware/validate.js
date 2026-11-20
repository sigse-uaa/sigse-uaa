const { ApiError } = require('../errors');

/** Valida `req.body` con un esquema Zod y lo reemplaza por el valor limpio. */
function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(
        new ApiError(422, 'VALIDATION_ERROR', 'Revisa los datos enviados.', { details }),
      );
    }
    request.body = result.data;
    return next();
  };
}

module.exports = { validateBody };
