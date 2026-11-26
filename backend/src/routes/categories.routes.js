const express = require('express');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const {
  createCategorySchema, updateCategorySchema, categoryParams, listCategoriesSchema,
} = require('../validators/categories.validators');

function createCategoriesRouter(controller, auth) {
  const router = express.Router();
  const onlyOperator = auth.authorize('operador');

  router.use(auth.authenticate);
  router.get('/', validateQuery(listCategoriesSchema), (request, response, next) => {
    if (request.validated.query.includeInactive) {
      return onlyOperator(request, response, next);
    }
    return next();
  }, controller.list);
  router.post('/', onlyOperator, validateBody(createCategorySchema), controller.create);
  router.patch('/:id', onlyOperator, validateParams(categoryParams), validateBody(updateCategorySchema), controller.update);
  router.delete('/:id', onlyOperator, validateParams(categoryParams), controller.deactivate);

  return router;
}

module.exports = { createCategoriesRouter };
