const { z } = require('zod');

const categoryFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(255).nullish(),
  color: z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Usa un color con formato #RRGGBB.').nullish(),
  icon: z.string().trim().max(50).nullish(),
};

const createCategorySchema = z.object(categoryFields);
const updateCategorySchema = z.object({
  ...categoryFields,
  isActive: z.boolean(),
}).partial().refine((changes) => Object.keys(changes).length > 0, {
  message: 'Envía al menos un campo para actualizar.',
});
const categoryParams = z.object({
  id: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(4294967295)),
});
const listCategoriesSchema = z.object({
  includeInactive: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
});

module.exports = { createCategorySchema, updateCategorySchema, categoryParams, listCategoriesSchema };
