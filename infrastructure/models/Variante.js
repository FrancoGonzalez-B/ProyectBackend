const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
module.exports = sequelize.define(
  'Variante',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    sku: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    size: { type: DataTypes.STRING(20), allowNull: false },
    color: { type: DataTypes.STRING(40), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { isInt: true, min: 0 },
    },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  },
  { tableName: 'product_variants', timestamps: true },
);
