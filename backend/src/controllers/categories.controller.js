function createCategoriesController(categoriesService) {
  return {
    async list(request, response) {
      const { includeInactive } = request.validated.query;
      const categories = await categoriesService.list(includeInactive);
      response.json({ data: categories });
    },

    async create(request, response) {
      const category = await categoriesService.create(request.body);
      response.status(201).json({ data: category });
    },

    async update(request, response) {
      const category = await categoriesService.update(request.validated.params.id, request.body);
      response.json({ data: category });
    },

    async deactivate(request, response) {
      await categoriesService.deactivate(request.validated.params.id);
      response.status(204).end();
    },
  };
}

module.exports = { createCategoriesController };
