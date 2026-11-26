const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../errors');
const { serializeUser } = require('../serializers');
const {serializeUserPorfile}=require('../serializers');

// Mismo coste que los hashes de database/seed.sql: con otro, el tiempo de login
// delataría si el correo existe.
const BCRYPT_ROUNDS = 12;

// Hash válido de una contraseña cualquiera: se compara aunque el correo no
// exista, para que el tiempo de respuesta no revele qué correos están registrados.
const DUMMY_HASH = bcrypt.hashSync('contraseña-inexistente', BCRYPT_ROUNDS);

function createAuthService({ users, jwtSecret, jwtExpiresIn }) {
  function signToken(user) {
    return jwt.sign({ role: user.role }, jwtSecret, {
      subject: String(user.id),
      expiresIn: jwtExpiresIn,
      algorithm: 'HS256',
    });
  }

  return {
    async register({ name, email, password }) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await users.createUser({ name, email, passwordHash });
      if (!user) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
      }
      return { token: signToken(user), user: serializeUser(user) };
    },

    async login({ email, password }) {
      const user = await users.findByEmail(email);
      const passwordOk = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

      if (!user || !passwordOk) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
      }
      if (!user.is_active) {
        throw new ApiError(403, 'USER_INACTIVE', 'Tu cuenta está desactivada.');
      }
      return { token: signToken(user), user: serializeUser(user) };
    },
    

    /** Devuelve el usuario activo dueño del token o lanza 401/403. */
    async authenticateToken(token) {
      let payload;
      try {
        payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      } catch {
        throw new ApiError(401, 'INVALID_TOKEN', 'Tu sesión expiró o no es válida.');
      }
      const user = await users.findById(payload.sub);
      if (!user) {
        throw new ApiError(401, 'INVALID_TOKEN', 'Tu sesión expiró o no es válida.');
      }
      if (!user.is_active) {
        throw new ApiError(403, 'USER_INACTIVE', 'Tu cuenta está desactivada.');//ya revisa si es activa o no no se para que quieren 
      }
      return serializeUser(user);
    },

    


  };
}

module.exports = { createAuthService };
