const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Pedido = sequelize.define('Pedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clienteId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  direccionEnvio: { type: DataTypes.STRING(200), allowNull: false },
  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDIENTE' },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'pedidos',
  timestamps: true,
  underscored: true,
});

module.exports = Pedido;
