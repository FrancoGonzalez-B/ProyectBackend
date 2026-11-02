const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  brand: { type: DataTypes.STRING(80), allowNull: true },
  imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'categories', key: 'id' } },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

module.exports = Producto;
