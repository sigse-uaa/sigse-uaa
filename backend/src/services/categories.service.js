const { ApiError } = require('../errors');
const { serializeCategory } = require('../serializers');

function handleCategoryWriteError(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new ApiError(409, 'CATEGORY_NAME_TAKEN', 'Ya existe una categoría con ese nombre.');
  }
  throw error;
}

function createCategoriesService(categories) {
  return {
    async list(includeInactive) {
      const rows = await categories.list(includeInactive);
      return rows.map(serializeCategory);
    },

    async create(details) {
      try {
        return serializeCategory(await categories.create(details));
      } catch (error) {
        handleCategoryWriteError(error);
      }
    },

    async update(id, changes) {
      try {
        const category = await categories.update(id, changes);
        if (!category) {
          throw new ApiError(404, 'NOT_FOUND', 'No se encontró la categoría.');
        }
        return serializeCategory(category);
      } catch (error) {
        handleCategoryWriteError(error);
      }
    },

    async deactivate(id) {
      await categories.deactivate(id);
    },
  };
}

module.exports = { createCategoriesService };
