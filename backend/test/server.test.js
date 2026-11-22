const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');

const serverFile = path.join(__dirname, '..', 'src', 'server.js');

function startServer(env) {
  return spawnSync(process.execPath, [serverFile], {
    env: { PATH: process.env.PATH, PORT: '0', ...env },
    encoding: 'utf8',
    timeout: 10_000,
  });
}

test('el servidor no arranca sin JWT_SECRET', () => {
  const result = startServer({});

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});

test('el servidor no arranca con el secreto de ejemplo fuera de un entorno local', () => {
  const result = startServer({
    JWT_SECRET: 'cambia-este-secreto-de-desarrollo-por-uno-largo-y-aleatorio',
    NODE_ENV: 'production',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ejemplo/);
});
