const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
module.exports = sequelize.define(
  'TablaPersonalizada',
  {
    nombre: { type: DataTypes.STRING(64), primaryKey: true, allowNull: false },
    definicion: { type: DataTypes.JSON, allowNull: false },
    estado: {
      type: DataTypes.ENUM('pendiente', 'creada', 'error'),
      allowNull: false,
    },
    error: { type: DataTypes.STRING(80), allowNull: true },
    creadorId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'tablas_personalizadas', timestamps: true },
);
