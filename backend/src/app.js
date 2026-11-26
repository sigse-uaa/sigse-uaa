const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { createAuthController } = require('./controllers/auth.controller');
const { createInspectionsController } = require('./controllers/inspections.controller');
const { ApiError, handleError } = require('./errors');
const { createAuthMiddleware } = require('./middleware/auth');
const { validateParams } = require('./middleware/validate');
const { createAuthRouter } = require('./routes/auth.routes');
const { createInspectionsRouter } = require('./routes/inspections.routes');
const { downloadParams } = require('./validators/inspections.validators');
const { createUsersRouter } = require('./routes/users.routes');
const { createUsersController } = require('./controllers/users.controller');
const { createUsersRepository } = require('./repositories/users.repository');
const { createUsersService } = require('./services/users.service');
const { pool } = require('./database');
const { createCategoriesRouter } = require('./routes/categories.routes');
const { createCategoriesController } = require('./controllers/categories.controller');
const { createCategoriesRepository } = require('./repositories/categories.repository');
const { createCategoriesService } = require('./services/categories.service');

function createApp({ checkDatabase, corsOptions, authService, inspectionsService, usersService, categoriesService }) {
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

  // `authenticate` y `authorize` se pasan a los routers que los necesiten
  // (usuarios, categorías, inspecciones...).
  const auth = createAuthMiddleware(authService);
  const authController = createAuthController(authService);
  api.use('/auth', createAuthRouter(authController, auth));
  if (inspectionsService) {
    const controller = createInspectionsController(inspectionsService);
    api.use('/inspections', createInspectionsRouter(controller, auth.authenticate));
    app.get('/uploads/:filename', auth.authenticate, validateParams(downloadParams), controller.download);
  }

  const usersController = createUsersController(usersService ?? createUsersService(createUsersRepository(pool)));
  const usersRouter = createUsersRouter({ me: authController.me, ...usersController }, auth);
  api.use('/users', usersRouter);
  const categories = categoriesService ?? createCategoriesService(createCategoriesRepository(pool));
  api.use('/categories', createCategoriesRouter(createCategoriesController(categories), auth));

  app.use('/api', api);
  app.use((_request, _response, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'La ruta solicitada no existe.'));
  });
  app.use(handleError);

  app.locals.auth = auth;

  return app;
}

module.exports = { createApp };
