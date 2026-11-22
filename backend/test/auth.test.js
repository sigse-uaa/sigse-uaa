const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const {
  JWT_SECRET,
  SEED_PASSWORD,
  createFakeUsers,
  createTestAuthService,
  listen,
  postJson,
  seedUsers,
} = require('../testing/helpers');

async function startApi(t, users = createFakeUsers(seedUsers())) {
  const authService = createTestAuthService(users);
  const app = createApp({ checkDatabase: async () => {}, authService });
  const url = await listen(t, app);
  return { api: `${url}/api`, users };
}

test('registro: crea un usuario, devuelve token y nunca expone la contraseña', async (t) => {
  const { api, users } = await startApi(t);
  const response = await postJson(`${api}/auth/register`, {
    name: '  Ana López  ',
    email: '  ANA@UAA.MX ',
    password: 'Secreta123!',
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(Object.keys(body).sort(), ['token', 'user']);
  assert.equal(body.user.name, 'Ana López');
  assert.equal(body.user.email, 'ana@uaa.mx');
  assert.equal(body.user.role, 'usuario');
  assert.equal(JSON.stringify(body).includes('password'), false);

  const stored = users.rows.at(-1);
  assert.notEqual(stored.password_hash, 'Secreta123!');
  assert.match(stored.password_hash, /^\$2[aby]\$/);

  const payload = jwt.verify(body.token, JWT_SECRET);
  assert.equal(payload.sub, String(body.user.id));
  assert.equal(payload.role, 'usuario');
});

test('registro: ignora el rol enviado y siempre crea un usuario', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/register`, {
    name: 'Intruso',
    email: 'intruso@uaa.mx',
    password: 'Secreta123!',
    role: 'operador',
  });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).user.role, 'usuario');
});

test('registro: un correo repetido responde 409', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/register`, {
    name: 'Otro Usuario',
    email: 'USUARIO@example.com',
    password: 'Secreta123!',
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.error.code, 'EMAIL_TAKEN');
});

test('registro: datos inválidos responden 422 con el detalle por campo', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/register`, {
    name: 'ab',
    email: 'no-es-correo',
    password: 'corta',
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  const paths = body.error.details.map((detail) => detail.path);
  assert.ok(paths.includes('name'));
  assert.ok(paths.includes('email'));
  assert.ok(paths.includes('password'));
  assert.ok(body.error.details.every((detail) => typeof detail.message === 'string'));
});

test('registro: la contraseña necesita una letra y un número', async (t) => {
  const { api } = await startApi(t);

  for (const password of ['soloLetrasAqui', '1234567890']) {
    const response = await postJson(`${api}/auth/register`, {
      name: 'Ana López',
      email: 'ana@uaa.mx',
      password,
    });
    assert.equal(response.status, 422, `debía rechazar ${password}`);
  }
});

test('registro y login: un cuerpo vacío responde 422, no 500', async (t) => {
  const { api } = await startApi(t);

  assert.equal((await postJson(`${api}/auth/register`, {})).status, 422);
  assert.equal((await postJson(`${api}/auth/login`, {})).status, 422);
});

test('login: acepta el hash $2y$ real del seed de database/', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/login`, {
    email: 'operador1@example.com',
    password: SEED_PASSWORD,
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.user.role, 'operador');
  assert.equal(jwt.verify(body.token, JWT_SECRET).role, 'operador');
});

test('login: normaliza el correo (espacios y mayúsculas)', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/login`, {
    email: '  Usuario@Example.COM ',
    password: 'Usuario123!',
  });

  assert.equal(response.status, 200);
});

test('login: contraseña incorrecta y correo inexistente dan la misma respuesta 401', async (t) => {
  const { api } = await startApi(t);
  const wrongPassword = await postJson(`${api}/auth/login`, {
    email: 'usuario@example.com',
    password: 'incorrecta1',
  });
  const unknownEmail = await postJson(`${api}/auth/login`, {
    email: 'nadie@example.com',
    password: 'incorrecta1',
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.deepEqual(await wrongPassword.json(), await unknownEmail.json());
});

test('login: una cuenta desactivada responde 403', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/login`, {
    email: 'baja@example.com',
    password: 'Usuario123!',
  });
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.error.code, 'USER_INACTIVE');
});

test('login: la respuesta no incluye el hash ni la contraseña', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/login`, {
    email: 'usuario@example.com',
    password: 'Usuario123!',
  });
  const text = JSON.stringify(await response.json());

  assert.equal(text.includes('password'), false);
  assert.equal(text.includes('$2'), false);
});

test('registro y login: la contraseña se limita a 72 bytes, no a 72 caracteres', async (t) => {
  const { api } = await startApi(t);
  // 40 "ñ" = 40 caracteres pero 80 bytes: bcrypt truncaría sin avisar.
  const password = `${'ñ'.repeat(40)}a1`;

  const register = await postJson(`${api}/auth/register`, {
    name: 'Ana López',
    email: 'ana@uaa.mx',
    password,
  });
  const body = await register.json();
  assert.equal(register.status, 422);
  assert.match(body.error.details[0].message, /72 bytes/);

  const login = await postJson(`${api}/auth/login`, { email: 'usuario@example.com', password });
  assert.equal(login.status, 422);

  // 72 bytes exactos sí se aceptan.
  const exact = await postJson(`${api}/auth/register`, {
    name: 'Ana López',
    email: 'ana@uaa.mx',
    password: `${'a'.repeat(71)}1`,
  });
  assert.equal(exact.status, 201);
});

test('login: contraseña incorrecta en una cuenta desactivada responde 401, no 403', async (t) => {
  const { api } = await startApi(t);
  const response = await postJson(`${api}/auth/login`, {
    email: 'baja@example.com',
    password: 'incorrecta1',
  });

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'INVALID_CREDENTIALS');
});
