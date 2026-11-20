const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const { createApp } = require('../src/app');

async function startApi(t, checkDatabase) {
  const server = createApp({ checkDatabase }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  }));
  return `http://127.0.0.1:${server.address().port}/api`;
}

test('GET /health responde con el estado de Express sin consultar MySQL', async (t) => {
  const url = await startApi(t, () => assert.fail('La ruta no debe consultar MySQL'));
  const response = await fetch(`${url}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'sigse-api');
  assert.ok(typeof body.uptime === 'number' && body.uptime >= 0);
  assert.equal(new Date(body.timestamp).toISOString(), body.timestamp);
});

test('GET /health/db devuelve 200 cuando responde la base de datos', async (t) => {
  const checkDatabase = t.mock.fn(async () => {});
  const url = await startApi(t, checkDatabase);
  const response = await fetch(`${url}/health/db`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' });
  assert.equal(checkDatabase.mock.callCount(), 1);
});

test('GET /health/db devuelve 503 sin exponer detalles de MySQL', async (t) => {
  const url = await startApi(t, async () => {
    throw Object.assign(new Error('Detalle interno de MySQL'), { code: 'ECONNREFUSED' });
  });
  const response = await fetch(`${url}/health/db`);

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'DATABASE_UNAVAILABLE',
      message: 'La base de datos no está disponible.',
      details: [],
    },
  });
});

test('una ruta desconocida devuelve 404 en el formato de la API', async (t) => {
  const url = await startApi(t);
  const response = await fetch(`${url}/inexistente`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
});

test('un cuerpo JSON malformado devuelve 400 en el formato de la API', async (t) => {
  const url = await startApi(t);
  const response = await fetch(`${url}/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_JSON');
});
