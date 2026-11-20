const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const { handleError } = require('../src/errors');
const { createAuthMiddleware } = require('../src/middleware/auth');
const {
  JWT_SECRET,
  createFakeUsers,
  createTestAuthService,
  listen,
  seedUsers,
} = require('../testing/helpers');

async function startProtectedApi(t) {
  const users = createFakeUsers(seedUsers());
  const authService = createTestAuthService(users);
  const { authenticate, authorize } = createAuthMiddleware(authService);

  const app = express();
  app.get('/privada', authenticate, (request, response) => response.json({ user: request.user }));
  app.get('/operadores', authenticate, authorize('operador'), (_request, response) => {
    response.json({ ok: true });
  });
  app.use(handleError);

  return { url: await listen(t, app), users };
}

const bearer = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const sign = (id, role, options = {}, secret = JWT_SECRET) =>
  jwt.sign({ role }, secret, { subject: String(id), expiresIn: '1h', ...options });

test('authenticate: sin cabecera Authorization responde 401', async (t) => {
  const { url } = await startProtectedApi(t);
  const response = await fetch(`${url}/privada`);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'MISSING_TOKEN');
});

test('authenticate: rechaza esquemas distintos de Bearer', async (t) => {
  const { url } = await startProtectedApi(t);
  const response = await fetch(`${url}/privada`, {
    headers: { Authorization: `Basic ${sign(3, 'usuario')}` },
  });

  assert.equal(response.status, 401);
});

test('authenticate: un token válido deja el usuario en request.user', async (t) => {
  const { url } = await startProtectedApi(t);
  const response = await fetch(`${url}/privada`, bearer(sign(3, 'usuario')));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.user, {
    id: 3,
    name: 'Usuario Demo',
    email: 'usuario@example.com',
    role: 'usuario',
  });
});

test('authenticate: rechaza tokens basura, expirados, de otro secreto y sin firma', async (t) => {
  const { url } = await startProtectedApi(t);
  const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
    JSON.stringify({ sub: '1', role: 'operador' }),
  ).toString('base64url')}.`;

  const tokens = {
    basura: 'esto-no-es-un-jwt',
    expirado: sign(3, 'usuario', { expiresIn: -10 }),
    'otro secreto': sign(3, 'usuario', {}, 'otro-secreto-distinto-de-treinta-y-dos-caracteres'),
    'sin firma (alg none)': unsigned,
  };

  for (const [name, token] of Object.entries(tokens)) {
    const response = await fetch(`${url}/privada`, bearer(token));
    assert.equal(response.status, 401, `debía rechazar el token ${name}`);
    assert.equal((await response.json()).error.code, 'INVALID_TOKEN');
  }
});

test('authenticate: el rol sale de la base, no del token', async (t) => {
  const { url } = await startProtectedApi(t);
  // Token que afirma ser operador, pero el usuario 3 es solo "usuario".
  const forged = sign(3, 'operador');
  const response = await fetch(`${url}/operadores`, bearer(forged));

  assert.equal(response.status, 403);
});

test('authenticate: un usuario dado de baja pierde el acceso aunque su token siga vigente', async (t) => {
  const { url, users } = await startProtectedApi(t);
  const token = sign(3, 'usuario');
  assert.equal((await fetch(`${url}/privada`, bearer(token))).status, 200);

  users.rows.find((row) => row.id === 3).is_active = 0;
  const response = await fetch(`${url}/privada`, bearer(token));

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'USER_INACTIVE');
});

test('authenticate: un usuario eliminado responde 401', async (t) => {
  const { url } = await startProtectedApi(t);
  const response = await fetch(`${url}/privada`, bearer(sign(999, 'usuario')));

  assert.equal(response.status, 401);
});

test('authorize: un usuario recibe 403 y un operador 200', async (t) => {
  const { url } = await startProtectedApi(t);

  const asUser = await fetch(`${url}/operadores`, bearer(sign(3, 'usuario')));
  assert.equal(asUser.status, 403);
  assert.equal((await asUser.json()).error.code, 'FORBIDDEN');

  const asOperator = await fetch(`${url}/operadores`, bearer(sign(1, 'operador')));
  assert.equal(asOperator.status, 200);
});
