const { ApiError } = require('../errors');

function parseRequest(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new ApiError(422, 'VALIDATION_ERROR', 'Revisa los datos enviados.', { details });
  }
  return result.data;
}

function validateRequest(source, schema) {
  return (request, _response, next) => {
    const data = parseRequest(schema, request[source]);
    if (source === 'body') {
      request.body = data;//que datos trae?
    } else {
      // Express expone query como getter y puede reconstruir params entre routers.
      request.validated ??= {};
      request.validated[source] = data;
    }
    return next();
  };
}

const validateBody = (schema) => validateRequest('body', schema);
const validateQuery = (schema) => validateRequest('query', schema);
const validateParams = (schema) => validateRequest('params', schema);

module.exports = { parseRequest, validateBody, validateQuery, validateParams };
