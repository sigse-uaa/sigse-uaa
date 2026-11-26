const express = require('express');
const { validateBody } = require('../middleware/validate');

const { loginSchema, registerSchema } = require('../validators/auth.validators');

function createAuthRouter(controller,createAuthMiddleware) {
  const router = express.Router();

  router.post('/register', validateBody(registerSchema), controller.register);
  router.post('/login', validateBody(loginSchema), controller.login);
  router.get('/me', createAuthMiddleware.authenticate, controller.me);

  return router;
}

module.exports = { createAuthRouter };
