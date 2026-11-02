require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    hooks: { afterConnect: require('../config/mysqlSession') },
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeData',
  },
};
