const jwt = require('jsonwebtoken');

const MIN_SECRET_LENGTH = 32;
// Prefijo del valor de ejemplo de .env.example: es público, así que solo se
// acepta cuando NODE_ENV declara explícitamente un entorno local.
const EXAMPLE_SECRET_PREFIX = 'cambia-este-secreto';
const LOCAL_ENVIRONMENTS = ['development', 'test'];

/**
 * Lee y valida la configuración de autenticación. Falla al arrancar si algo es
 * inválido: es preferible no iniciar a firmar tokens con un secreto débil o a
 * descubrir una vigencia mal escrita cuando alguien intenta registrarse.
 */
function loadAuthConfig(env = process.env) {
  const secret = env.JWT_SECRET ?? '';
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET es obligatorio y debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`,
    );
  }
  if (secret.startsWith(EXAMPLE_SECRET_PREFIX) && !LOCAL_ENVIRONMENTS.includes(env.NODE_ENV)) {
    throw new Error(
      'JWT_SECRET es el valor de ejemplo: genera uno propio (solo se permite con NODE_ENV=development o test).',
    );
  }

  const jwtExpiresIn = env.JWT_EXPIRES_IN || '8h';
  try {
    jwt.sign({}, secret, { expiresIn: jwtExpiresIn });
  } catch {
    throw new Error(
      `JWT_EXPIRES_IN no es válido: "${jwtExpiresIn}". Usa un valor como 8h, 30m o 7d.`,
    );
  }

  return { jwtSecret: secret, jwtExpiresIn };
}

module.exports = { loadAuthConfig, MIN_SECRET_LENGTH };
