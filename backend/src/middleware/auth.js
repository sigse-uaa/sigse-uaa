const { ApiError } = require('../errors');

/**
 * Middlewares de autenticación y autorización.
 *
 * `authenticate` valida el JWT, vuelve a consultar al usuario en la base (así
 * una baja o un cambio de rol surten efecto de inmediato) y deja el resultado
 * en `request.user` con `{ id, name, email, role }`.
 *
 * `authorize('operador')` debe ir después de `authenticate`.
 */
function createAuthMiddleware(authService) {
  async function authenticate(request, _response, next) {
    const header = request.get('Authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return next(new ApiError(401, 'MISSING_TOKEN', 'Inicia sesión para continuar.'));
    }

    try {
      request.user = await authService.authenticateToken(token);
      return next();
    } catch (error) {
      return next(error);
    }
  }

  function authorize(...roles) {
    return (request, _response, next) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return next(new ApiError(403, 'FORBIDDEN', 'No tienes permiso para esta acción.'));
      }
      return next();
    };
  }

  return { authenticate, authorize };
}

module.exports = { createAuthMiddleware };
