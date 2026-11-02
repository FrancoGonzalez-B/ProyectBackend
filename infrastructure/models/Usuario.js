const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING(60), allowNull: false },
  lastName: { type: DataTypes.STRING(60), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'customer' },
  telefono: { type: DataTypes.STRING(20), allowNull: true },
  direccion: { type: DataTypes.STRING(200), allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = Usuario;
