const { once } = require('node:events');
const bcrypt = require('bcryptjs');
const { createAuthService } = require('../src/services/auth.service');

const JWT_SECRET = 'secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres';

// Hash real del seed de database/seed.sql (formato $2y$ de PHP), contraseña SigseDemo2026!
const SEED_HASH_OPERADOR1 = '$2y$12$m6.VQbQNOZTHedo72mDzXOq3404WVrI0Z9osdN2H6uzdDZAi4QIhG';
const SEED_PASSWORD = 'SigseDemo2026!';

/** Repositorio de usuarios en memoria con la misma interfaz que el real. */
function createFakeUsers(initial = []) {
  const rows = [...initial];
  let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

  return {
    rows,
    async findByEmail(email) {
      return rows.find((row) => row.email === email) ?? null;
    },
    async findById(id) {
      return rows.find((row) => row.id === Number(id)) ?? null;
    },
    async createUser({ name, email, passwordHash }) {
      if (rows.some((row) => row.email === email)) {
        return null;
      }
      const row = {
        id: nextId++,
        name,
        email,
        password_hash: passwordHash,
        role: 'usuario',
        is_active: 1,
      };
      rows.push(row);
      return row;
    },
  };
}

function seedUsers() {
  return [
    {
      id: 1,
      name: 'Operador Demo 1',
      email: 'operador1@example.com',
      password_hash: SEED_HASH_OPERADOR1,
      role: 'operador',
      is_active: 1,
    },
    {
      id: 3,
      name: 'Usuario Demo',
      email: 'usuario@example.com',
      password_hash: bcrypt.hashSync('Usuario123!', 4),
      role: 'usuario',
      is_active: 1,
    },
    {
      id: 4,
      name: 'Usuario Baja',
      email: 'baja@example.com',
      password_hash: bcrypt.hashSync('Usuario123!', 4),
      role: 'usuario',
      is_active: 0,
    },
  ];
}

function createTestAuthService(users, overrides = {}) {
  return createAuthService({
    users,
    jwtSecret: JWT_SECRET,
    jwtExpiresIn: '8h',
    ...overrides,
  });
}

async function listen(t, app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

module.exports = {
  JWT_SECRET,
  SEED_PASSWORD,
  createFakeUsers,
  createTestAuthService,
  listen,
  postJson,
  seedUsers,
};
