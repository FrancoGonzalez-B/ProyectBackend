const sequelize = require('../config/database');
const User = require('./userModel');
const Category = require('./categoryModel');
const Product = require('./productModel');
const ProductVariant = require('./productVariantModel');
const Order = require('./orderModel');
const OrderDetail = require('./orderDetailModel');

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

User.hasMany(Order, {
  foreignKey: 'clientId',
  as: 'orders',
  onDelete: 'RESTRICT',
});
Order.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client',
});

Order.hasMany(OrderDetail, {
  foreignKey: 'orderId',
  as: 'details',
  onDelete: 'CASCADE',
});
OrderDetail.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

Product.hasMany(OrderDetail, {
  foreignKey: 'productId',
  as: 'orderDetails',
  onDelete: 'RESTRICT',
});
OrderDetail.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductVariant,
  Order,
  OrderDetail,
};
