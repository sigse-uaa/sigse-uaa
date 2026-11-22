const { z } = require('zod');

const email = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .max(150, 'El correo no puede pasar de 150 caracteres')
  .pipe(z.email('Correo inválido'));

// bcrypt solo usa los primeros 72 BYTES: un acento ocupa 2 y un emoji 4, así que
// contar caracteres dejaría pasar contraseñas que se truncan en silencio.
const MAX_PASSWORD_BYTES = 72;
const fitsBcrypt = (value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;
const TOO_LONG = `La contraseña no puede pasar de ${MAX_PASSWORD_BYTES} bytes (acentos y emojis ocupan más de uno)`;

const registerSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(120, 'El nombre no puede pasar de 120 caracteres'),
  email,
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine(fitsBcrypt, TOO_LONG)
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
});

const loginSchema = z.object({
  email,
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .refine(fitsBcrypt, TOO_LONG),
});

module.exports = { registerSchema, loginSchema };
