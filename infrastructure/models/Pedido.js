const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Pedido = sequelize.define('Pedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clienteId: { type: DataTypes.INTEGER, allowNull: false, field: 'cliente_id', references: { model: 'users', key: 'id' } },
  direccionEnvio: { type: DataTypes.STRING(500), allowNull: false, field: 'direccion_envio' },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
    field: 'estado',
  },
  fecha: { type: DataTypes.DATE, allowNull: false, field: 'fecha', defaultValue: DataTypes.NOW },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'pedidos',
  timestamps: true,
});

module.exports = Pedido;
