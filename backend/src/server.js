const path = require('node:path');
const { createApp } = require('./app');
const { loadAuthConfig } = require('./config');
const { buildCorsOptions } = require('./cors');
const { pool, checkDatabase } = require('./database');
const { createInspectionsRepository } = require('./repositories/inspections.repository');
const { createUsersRepository } = require('./repositories/users.repository');
const { createAuthService } = require('./services/auth.service');
const { createInspectionsService } = require('./services/inspections.service');
const { createEvidenceStorage } = require('./storage/evidences');

const port = Number(process.env.PORT || '3000');
const authService = createAuthService({
  users: createUsersRepository(pool),
  ...loadAuthConfig(),
});
const inspectionsService = createInspectionsService(
  createInspectionsRepository(pool),
  createEvidenceStorage(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')),
);
const app = createApp({ checkDatabase, corsOptions: buildCorsOptions(), authService, inspectionsService });
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
