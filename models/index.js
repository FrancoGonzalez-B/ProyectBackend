const sequelize = require('../config/database');
const User = require('./userModel');
const Category = require('./categoryModel');
const Product = require('./productModel');
const ProductVariant = require('./productVariantModel');

Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'RESTRICT',
});
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

Product.hasMany(ProductVariant, {
  foreignKey: 'productId',
  as: 'variants',
  onDelete: 'CASCADE',
});
ProductVariant.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductVariant,
};
