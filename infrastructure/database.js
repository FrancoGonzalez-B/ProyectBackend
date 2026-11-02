const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

async function conectar() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida');
  } catch (error) {
    console.error('No se pudo conectar a MySQL:', error);
    process.exit(1);
  }
}

module.exports = { sequelize, conectar };
