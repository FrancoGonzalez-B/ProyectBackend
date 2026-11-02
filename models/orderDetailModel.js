const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderDetail = sequelize.define('OrderDetail', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pedido_id',
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'producto_id',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cantidad',
    validate: { min: 1 },
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'precio_unitario',
    validate: { min: 0 },
  },
}, {
  tableName: 'detalles_pedido',
  timestamps: true,
  indexes: [{ unique: true, fields: ['pedido_id', 'producto_id'] }],
});

module.exports = OrderDetail;
