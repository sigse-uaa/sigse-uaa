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
