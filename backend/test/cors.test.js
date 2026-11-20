const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const { createApp } = require('../src/app');
const { buildCorsOptions } = require('../src/cors');

async function startApi(t, env) {
  const app = createApp({
    checkDatabase: async () => {},
    corsOptions: buildCorsOptions(env),
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}/api`;
}

function get(url, origin) {
  return fetch(`${url}/health`, { headers: origin ? { Origin: origin } : {} });
}

test('con CORS_ORIGIN solo acepta los orígenes configurados', async (t) => {
  const url = await startApi(t, { CORS_ORIGIN: 'https://app.example.com, https://otra.example.com' });

  const allowed = await get(url, 'https://otra.example.com');
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://otra.example.com');

  const denied = await get(url, 'https://malicioso.example.com');
  assert.equal(denied.status, 200);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('en desarrollo sin CORS_ORIGIN acepta cualquier puerto de localhost', async (t) => {
  const url = await startApi(t, { NODE_ENV: 'development' });

  const local = await get(url, 'http://localhost:54321');
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:54321');

  const remote = await get(url, 'https://malicioso.example.com');
  assert.equal(remote.headers.get('access-control-allow-origin'), null);
});

test('en producción sin CORS_ORIGIN no acepta ningún origen del navegador', async (t) => {
  const url = await startApi(t, { NODE_ENV: 'production' });

  const response = await get(url, 'http://localhost:54321');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('las peticiones sin Origin (curl, app móvil) siguen funcionando', async (t) => {
  const url = await startApi(t, { NODE_ENV: 'production' });

  assert.equal((await get(url)).status, 200);
});

test('responde la comprobación previa (preflight) con los métodos y cabeceras permitidos', async (t) => {
  const url = await startApi(t, { CORS_ORIGIN: 'https://app.example.com' });

  const response = await fetch(`${url}/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://app.example.com',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.match(response.headers.get('access-control-allow-methods'), /PATCH/);
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/i);
});

test('helmet agrega cabeceras de seguridad y permite cargar recursos desde otro origen', async (t) => {
  const url = await startApi(t, { NODE_ENV: 'development' });
  const response = await get(url);

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('los errores incluyen el campo details del contrato', async (t) => {
  const url = await startApi(t, { NODE_ENV: 'development' });
  const body = await (await fetch(`${url}/inexistente`)).json();

  assert.deepEqual(body.error.details, []);
});
