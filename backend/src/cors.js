const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Opciones de CORS según `CORS_ORIGIN` (lista separada por comas).
 *
 * - Con `CORS_ORIGIN`: solo esos orígenes exactos.
 * - Sin `CORS_ORIGIN` en desarrollo: cualquier localhost/127.0.0.1, porque
 *   `flutter run -d chrome` usa un puerto distinto en cada arranque.
 * - Sin `CORS_ORIGIN` en producción: ningún origen del navegador.
 *
 * Las peticiones sin cabecera `Origin` (curl, app móvil) no pasan por CORS.
 */
function buildCorsOptions(env = process.env) {
  const configured = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isProduction = env.NODE_ENV === 'production';

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (configured.length > 0) {
        return callback(null, configured.includes(origin));
      }
      return callback(null, !isProduction && LOCALHOST_ORIGIN.test(origin));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  };
}

module.exports = { buildCorsOptions };
