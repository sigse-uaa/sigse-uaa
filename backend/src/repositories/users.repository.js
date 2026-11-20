const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';

/** Acceso a la tabla `users`. Todas las consultas van parametrizadas. */
function createUsersRepository(pool) {
  return {
    async findByEmail(email) {
      const [rows] = await pool.query(
        'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1',
        [email],
      );
      return rows[0] ?? null;
    },

    async findById(id) {
      const [rows] = await pool.query(
        'SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = ? LIMIT 1',
        [id],
      );
      return rows[0] ?? null;
    },

    /** Crea un usuario con rol `usuario`. Devuelve `null` si el correo ya existe. */
    async createUser({ name, email, passwordHash }) {
      try {
        const [result] = await pool.query(
          "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'usuario')",
          [name, email, passwordHash],
        );
        return this.findById(result.insertId);
      } catch (error) {
        if (error.code === DUPLICATE_ENTRY) {
          return null;
        }
        throw error;
      }
    },
  };
}

module.exports = { createUsersRepository };
