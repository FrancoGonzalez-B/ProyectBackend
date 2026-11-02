const db = require('../infrastructure/models');
module.exports = {
  sequelize: db.sequelize,
  User: db.Usuario,
  Category: db.Categoria,
  Product: db.Producto,
  ProductVariant: db.Variante,
  Order: db.Pedido,
  OrderDetail: db.DetallePedido,
};
