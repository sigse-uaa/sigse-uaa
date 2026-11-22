const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const { handleError } = require('../src/errors');
const { listen } = require('../testing/helpers');

test('los errores de MySQL no escriben consultas, correos ni hashes en el log', async (t) => {
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args));

  const mysqlError = Object.assign(new Error("Duplicate entry 'ana@uaa.mx' for key 'users.email'"), {
    code: 'ER_DUP_ENTRY',
    errno: 1062,
    sqlState: '23000',
    sqlMessage: "Duplicate entry 'ana@uaa.mx' for key 'users.email'",
    sql: "INSERT INTO users (email, password_hash) VALUES ('ana@uaa.mx', '$2b$12$hashsecreto')",
  });

  const app = express();
  app.get('/falla', () => {
    throw mysqlError;
  });
  app.get('/falla-anidada', () => {
    throw new Error('envuelto', { cause: mysqlError });
  });
  app.use(handleError);
  const url = await listen(t, app);

  for (const route of ['/falla', '/falla-anidada']) {
    const response = await fetch(`${url}${route}`);
    assert.equal(response.status, 500);
    assert.equal((await response.json()).error.code, 'INTERNAL_ERROR');
  }

  const output = JSON.stringify(logged);
  assert.equal(logged.length, 2);
  assert.match(output, /ER_DUP_ENTRY/);
  for (const secret of ['ana@uaa.mx', 'hashsecreto', 'INSERT']) {
    assert.equal(output.includes(secret), false, `el log contiene "${secret}"`);
  }
});

test('los demás errores inesperados siguen registrándose completos', async (t) => {
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args));

  const app = express();
  app.get('/falla', () => {
    throw new Error('fallo de lógica');
  });
  app.use(handleError);
  const url = await listen(t, app);
  await fetch(`${url}/falla`);

  assert.match(String(logged[0][0].stack), /fallo de lógica/);
});
