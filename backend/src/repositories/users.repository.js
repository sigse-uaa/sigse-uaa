const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';

/** Acceso a la tabla `users`. Todas las consultas van parametrizadas. */
function createUsersRepository(pool) {
    async function insertUser({ name, email, passwordHash }, role) {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role],
      );
      return result.insertId;
    }

    return {
    async listActive({ role, q }) {
      const conditions = ['is_active = 1'];
      const params = [];

      if (role !== undefined) {
        conditions.push('role = ?');
        params.push(role);
      }

      if (q) {
        conditions.push('(LOCATE(?, name) > 0 OR LOCATE(?, email) > 0)');
        params.push(q, q);
      }

      const [rows] = await pool.query(
        `SELECT id, name, email, role FROM users
         WHERE ${conditions.join(' AND ')}
         ORDER BY name, id`,
        params,
      );
      return rows;
    },

      async updateProfile(id, { name = null, passwordHash = null }) {
    await pool.query(
      `UPDATE users
      SET name = COALESCE(?, name),
          password_hash = COALESCE(?, password_hash)
      WHERE id = ?`,
      [name, passwordHash, id],
    );
    return this.findById(id);
  },
  
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
        const id = await insertUser({ name, email, passwordHash }, 'usuario');
        return this.findById(id);
      } catch (error) {
        if (error.code === DUPLICATE_ENTRY) {
          return null;
        }
        throw error;
      }
    },
    async createOperator(details) {
      try {
        const id = await insertUser(details, 'operador');
        return this.findById(id);
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
