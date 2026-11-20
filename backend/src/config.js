const MIN_SECRET_LENGTH = 32;

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
  return {
    jwtSecret: secret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
  };
}

module.exports = { loadAuthConfig, MIN_SECRET_LENGTH };
