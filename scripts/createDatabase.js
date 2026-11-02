require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
(async () => {
  const name = process.env.DB_NAME;
  if (!name || !/^[a-zA-Z0-9_]+$/.test(name))
    throw new Error('DB_NAME debe contener solo letras, números y guion bajo');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  });
  try {
    await connection.query(
      'CREATE DATABASE IF NOT EXISTS ' +
        mysql.escapeId(name) +
        ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
    console.log('Base preparada: ' + name);
  } finally {
    await connection.end();
  }
})().catch((err) => {
  console.error(err.code || err.message);
  process.exitCode = 1;
});
