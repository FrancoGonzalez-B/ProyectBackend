const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const DetallePedido = sequelize.define('DetallePedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pedidoId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pedidos', key: 'id' } },
  productoId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precioUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, {
  tableName: 'detalles_pedido',
  timestamps: true,
  underscored: true,
});

module.exports = DetallePedido;
