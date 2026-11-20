const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { ApiError, handleError } = require('./errors');

function createApp({ checkDatabase, corsOptions }) {
  const app = express();
  const api = express.Router();

  app.disable('x-powered-by');
  // Las evidencias (/uploads) se mostrarán desde la web de Flutter, que está en
  // otro origen: sin esto helmet bloquearía las imágenes.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(corsOptions));
  app.use(express.json());

  api.get('/health', (_request, response) => {
    response.set('Cache-Control', 'no-store').json({
      status: 'ok',
      service: 'sigse-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  api.get('/health/db', async (_request, response) => {
    response.set('Cache-Control', 'no-store');

    try {
      await checkDatabase();
    } catch (error) {
      throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible.', {
        cause: error,
      });
    }

    response.json({ status: 'ok', database: 'connected' });
  });

  app.use('/api', api);
  app.use((_request, _response, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'La ruta solicitada no existe.'));
  });
  app.use(handleError);

  return app;
}

module.exports = { createApp };
