const { z } = require('zod');


const MAX_PASSWORD_BYTES = 72;
const fitsBcrypt = (value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;
const TOO_LONG = `La contraseña no puede pasar de ${MAX_PASSWORD_BYTES} bytes (acentos y emojis ocupan más de uno)`;

const updateProfileSchema =z.object({//a z le decimos las reglas que va a tener cada uno
    name: z
        .string({ error: 'El nombre es obligatorio' })
        .trim()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(120, 'El nombre no puede pasar de 120 caracteres').optional(),
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual').optional(),
    newPassword: z
        .string({ error: 'La contraseña es obligatoria' })
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .refine(fitsBcrypt, TOO_LONG)
        .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
        .regex(/\d/, 'La contraseña debe incluir al menos un número').optional(),//son opcinales por que no nesesariamente cuando
        //cambias contrasena cambias el nombre 
}).refine(({name,currentPassword,newPassword})=>{
    if(name===undefined && currentPassword===undefined){//si no llega ninguna 
        return false;
    } 

    if ((currentPassword === undefined) !== (newPassword === undefined)) {
        return false;
    }
    return true;
});//rl primer argumento de refine tiene que ser una funcion por eso una arrow fuction

const listUsersSchema = z.object({
    role: z.enum(['usuario', 'operador']).optional(),
    q: z.string().trim().optional(),
});

module.exports = { listUsersSchema, updateProfileSchema };
