const { createApp } = require('./app');
const { loadAuthConfig } = require('./config');
const { buildCorsOptions } = require('./cors');
const { pool, checkDatabase } = require('./database');
const { createUsersRepository } = require('./repositories/users.repository');
const { createAuthService } = require('./services/auth.service');

const port = Number(process.env.PORT || '3000');
const authService = createAuthService({
  users: createUsersRepository(pool),
  ...loadAuthConfig(),
});
const app = createApp({ checkDatabase, corsOptions: buildCorsOptions(), authService });
const server = app.listen(port, () => {
  console.log(`SIGSE API disponible en el puerto ${server.address().port}`);
});

function shutdown() {
  server.close(async () => {
    try {
      await pool.end();
    } catch (error) {
      console.error('No se pudo cerrar el pool de MySQL:', error);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
