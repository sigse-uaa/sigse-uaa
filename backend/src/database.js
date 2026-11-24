const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'sigse',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  timezone: 'Z',
  connectTimeout: 3000,
});

async function checkDatabase() {
  await pool.query({ sql: 'SELECT 1', timeout: 3000 });
}

module.exports = { pool, checkDatabase };
