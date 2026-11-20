const MIN_SECRET_LENGTH = 32;
// Prefijo del valor de ejemplo de .env.example: sirve en local, pero nunca en producción.
const EXAMPLE_SECRET_PREFIX = 'cambia-este-secreto';

/**
 * Lee y valida la configuración de autenticación. Falla al arrancar si falta
 * `JWT_SECRET`: es preferible no iniciar a firmar tokens con un secreto débil.
 */
function loadAuthConfig(env = process.env) {
  const secret = env.JWT_SECRET ?? '';
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET es obligatorio y debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`,
    );
  }
  if (env.NODE_ENV === 'production' && secret.startsWith(EXAMPLE_SECRET_PREFIX)) {
    throw new Error('JWT_SECRET sigue siendo el valor de ejemplo: genera uno propio para producción.');
  }
  return {
    jwtSecret: secret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
  };
}

module.exports = { loadAuthConfig, MIN_SECRET_LENGTH };
