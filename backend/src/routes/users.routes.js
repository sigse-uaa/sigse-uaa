const express = require('express');
const { validateBody, validateQuery } = require('../middleware/validate');
const { listUsersSchema, updateProfileSchema } = require('../validators/users.validators');
const { registerSchema } = require('../validators/auth.validators');

function createUsersRouter(controller,createAuthMiddleware) {
    const router = express.Router();

    router.get('/', createAuthMiddleware.authenticate, createAuthMiddleware.authorize('operador'), validateQuery(listUsersSchema), controller.list);
    router.post('/', createAuthMiddleware.authenticate, createAuthMiddleware.authorize('operador'), validateBody(registerSchema), controller.createOperator);
    router.get('/me', createAuthMiddleware.authenticate, controller.me);
    router.patch('/me', createAuthMiddleware.authenticate, validateBody(updateProfileSchema), controller.updateMe)

    return router;
}
module.exports = { createUsersRouter };
