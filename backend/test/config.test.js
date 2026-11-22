const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadAuthConfig } = require('../src/config');

test('loadAuthConfig falla si falta JWT_SECRET o es muy corto', () => {
  assert.throws(() => loadAuthConfig({}), /JWT_SECRET/);
  assert.throws(() => loadAuthConfig({ JWT_SECRET: 'corto' }), /JWT_SECRET/);
});

test('loadAuthConfig usa 8 horas de vigencia por defecto', () => {
  const secret = 'x'.repeat(32);

  assert.deepEqual(loadAuthConfig({ JWT_SECRET: secret }), {
    jwtSecret: secret,
    jwtExpiresIn: '8h',
  });
  assert.equal(
    loadAuthConfig({ JWT_SECRET: secret, JWT_EXPIRES_IN: '1h' }).jwtExpiresIn,
    '1h',
  );
});

const EXAMPLE = 'cambia-este-secreto-de-desarrollo-por-uno-largo-y-aleatorio';

test('loadAuthConfig solo acepta el secreto de ejemplo en development o test', () => {
  assert.equal(loadAuthConfig({ JWT_SECRET: EXAMPLE, NODE_ENV: 'development' }).jwtSecret, EXAMPLE);
  assert.equal(loadAuthConfig({ JWT_SECRET: EXAMPLE, NODE_ENV: 'test' }).jwtSecret, EXAMPLE);

  for (const NODE_ENV of ['production', 'staging', undefined]) {
    assert.throws(() => loadAuthConfig({ JWT_SECRET: EXAMPLE, NODE_ENV }), /ejemplo/, `NODE_ENV=${NODE_ENV}`);
  }
});

test('loadAuthConfig detecta al arrancar una vigencia JWT inválida', () => {
  const base = { JWT_SECRET: 'x'.repeat(32) };

  assert.throws(() => loadAuthConfig({ ...base, JWT_EXPIRES_IN: 'ocho horas' }), /JWT_EXPIRES_IN/);
  assert.throws(() => loadAuthConfig({ ...base, JWT_EXPIRES_IN: '8 hrs mas' }), /JWT_EXPIRES_IN/);
  assert.equal(loadAuthConfig({ ...base, JWT_EXPIRES_IN: '30m' }).jwtExpiresIn, '30m');
});
