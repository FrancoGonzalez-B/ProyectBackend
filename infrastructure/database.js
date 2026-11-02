const sequelize = require('../config/database');
require('dotenv').config();

async function conectar() {
  const requiredVariables = ['DB_NAME', 'DB_USER', 'DB_HOST'];
  const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);
  if (missingVariables.length > 0) {
    throw new Error(`Faltan variables de entorno para la base de datos: ${missingVariables.join(', ')}`);
  }

  await sequelize.authenticate();
  console.log('Conexión a MySQL establecida');
}

module.exports = { sequelize, conectar };
