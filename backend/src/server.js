const { createApp } = require('./app');
const { buildCorsOptions } = require('./cors');
const { pool, checkDatabase } = require('./database');

const port = Number(process.env.PORT || '3000');
const app = createApp({ checkDatabase, corsOptions: buildCorsOptions() });
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
