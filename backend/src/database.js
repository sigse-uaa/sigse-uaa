const mysql = require('mysql2/promise');

// Compose publica SQL_PORT como dirección:puerto. MySQL requiere un puerto numérico.
const publishedPort = process.env.SQL_PORT?.split(':').at(-1);
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || publishedPort || '3306'),
  database: process.env.DB_NAME || process.env.SQL_DB || 'sigse',
  user: process.env.DB_USER || process.env.SQL_USER,
  password: process.env.DB_PASSWORD ?? process.env.SQL_PASSWORD,
  timezone: 'Z',
  connectTimeout: 3000,
});

async function checkDatabase() {
  await pool.query({ sql: 'SELECT 1', timeout: 3000 });
}

module.exports = { pool, checkDatabase };
