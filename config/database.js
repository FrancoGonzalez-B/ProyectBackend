const { Sequelize } = require('sequelize');
require('dotenv').config();

const requiredVariables = ['DB_NAME', 'DB_USER', 'DB_HOST'];
const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

if (missingVariables.length > 0) {
  throw new Error(`Faltan variables de entorno para la base de datos: ${missingVariables.join(', ')}`);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  },
);

module.exports = sequelize;
