const CATEGORY_COLUMNS = 'id, name, description, color, icon, is_active';
const EDITABLE_COLUMNS = {
  name: 'name',
  description: 'description',
  color: 'color',
  icon: 'icon',
  isActive: 'is_active',
};

function createCategoriesRepository(pool) {
  return {
    async list(includeInactive) {
      const where = includeInactive ? '' : 'WHERE is_active = 1';
      const [rows] = await pool.query(`SELECT ${CATEGORY_COLUMNS} FROM categories ${where} ORDER BY name, id`);
      return rows;
    },

    async findById(id) {
      const [rows] = await pool.query(`SELECT ${CATEGORY_COLUMNS} FROM categories WHERE id = ?`, [id]);
      return rows[0] ?? null;
    },

    async create({ name, description = null, color = null, icon = null }) {
      const [result] = await pool.query(
        'INSERT INTO categories (name, description, color, icon) VALUES (?, ?, ?, ?)',
        [name, description, color, icon],
      );
      return this.findById(result.insertId);
    },

    async update(id, changes) {
      const fields = [];
      const values = [];

      for (const [field, column] of Object.entries(EDITABLE_COLUMNS)) {
        if (changes[field] !== undefined) {
          fields.push(`${column} = ?`);
          values.push(changes[field]);
        }
      }

      await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
      return this.findById(id);
    },

    async deactivate(id) {
      await pool.query('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
    },
  };
}

module.exports = { createCategoriesRepository };
