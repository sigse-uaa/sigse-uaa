const { z } = require('zod');

const STATUSES = ['pendiente', 'asignada', 'en_proceso', 'finalizada', 'cancelada'];
const priority = z.enum(['baja', 'media', 'alta'], {
  error: 'La prioridad debe ser baja, media o alta.',
});
const categoryId = z
  .number({ error: 'La categoría es obligatoria y debe ser un número.' })
  .int('La categoría debe ser un número entero.')
  .min(1, 'La categoría debe ser mayor que cero.')
  .max(4_294_967_295, 'El identificador de categoría está fuera de rango.');
const positiveId = z.number().int().positive();
const numericParam = z.string().regex(/^[1-9]\d*$/).transform(Number);
const idParam = numericParam.pipe(positiveId);
const optionalBoolean = z.enum(['true', 'false']).transform((value) => value === 'true').default(false);
const fitsMySqlText = (value) => Buffer.byteLength(value, 'utf8') <= 65_535;

const createInspectionSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio.' })
    .trim()
    .min(1, 'El título es obligatorio.')
    .max(150, 'El título no puede superar 150 caracteres.'),
  description: z
    .string({ error: 'La descripción es obligatoria.' })
    .trim()
    .min(1, 'La descripción es obligatoria.')
    .refine(
      fitsMySqlText,
      'La descripción no puede superar 65 535 bytes en UTF-8.',
    ),
  categoryId,
  priority: priority.optional(),
  building: z.string().trim().max(120, 'El edificio no puede superar 120 caracteres.').nullish(),
  area: z.string().trim().max(120, 'El área no puede superar 120 caracteres.').nullish(),
  reference: z.string().trim().max(255, 'La referencia no puede superar 255 caracteres.').nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  tiltDegrees: z.number().min(-90).max(90).nullish(),
});

const updateInspectionSchema = createInspectionSchema.partial().refine(
  (fields) => Object.keys(fields).length > 0,
  'Envía al menos un campo editable.',
);

const listInspectionsSchema = z.object({
  q: z.string().trim().max(150).optional(),
  status: z.enum(STATUSES).optional(),
  categoryId: numericParam.pipe(categoryId).optional(),
  priority: priority.optional(),
  assignedToMe: optionalBoolean,
  mine: optionalBoolean,
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  page: idParam.default(1),
  limit: numericParam.pipe(z.number().int().min(1).max(50)).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'priority', 'created_at', 'updated_at']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).refine(({ from, to }) => !from || !to || from <= to, {
  path: ['to'],
  error: 'La fecha final debe ser igual o posterior a la inicial.',
}).refine(({ page, limit }) => Number.isSafeInteger((page - 1) * limit), {
  path: ['page'],
  error: 'La página solicitada está fuera de rango.',
});

const inspectionParams = z.object({ id: idParam });
const evidenceParams = inspectionParams.extend({ evidenceId: idParam });
const downloadParams = z.object({ filename: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/) });

const transitionSchema = z.object({
  status: z.enum(STATUSES),
  assignedTo: positiveId.optional(),
  reviewResult: z.string().trim().refine(fitsMySqlText, 'El resultado es demasiado largo.').optional(),
  finalCondition: z.enum(['buena', 'regular', 'mala', 'reemplazada']).optional(),
  comment: z.string().trim().refine(fitsMySqlText, 'El comentario es demasiado largo.').optional(),
});

const evidenceDescriptionSchema = z.object({
  description: z.string().trim().max(255, 'La descripción no puede superar 255 caracteres.').optional(),
});

module.exports = {
  STATUSES,
  createInspectionSchema,
  updateInspectionSchema,
  listInspectionsSchema,
  inspectionParams,
  evidenceParams,
  downloadParams,
  transitionSchema,
  evidenceDescriptionSchema,
};
