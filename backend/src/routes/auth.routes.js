const express = require('express');
const { validateBody } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/auth.validators');

function createAuthRouter(controller) {
  const router = express.Router();

  router.post('/register', validateBody(registerSchema), controller.register);
  router.post('/login', validateBody(loginSchema), controller.login);

  return router;
}

module.exports = { createAuthRouter };
