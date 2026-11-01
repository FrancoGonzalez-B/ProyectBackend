const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sku: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true },
  },
  size: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true },
  },
  color: {
    type: DataTypes.STRING(40),
    allowNull: false,
    validate: { notEmpty: true },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: { min: 0 },
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'product_variants',
  timestamps: true,
});

module.exports = ProductVariant;
