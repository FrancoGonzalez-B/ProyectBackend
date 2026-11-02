const { sequelize } = require('../database');
const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Variante = require('./Variante');
Producto.hasMany(Variante, {
  foreignKey: 'productId',
  as: 'variantes',
  onDelete: 'CASCADE',
});
Variante.belongsTo(Producto, { foreignKey: 'productId', as: 'producto' });
DetallePedido.belongsTo(Variante, {
  foreignKey: 'varianteId',
  as: 'variante',
  onDelete: 'RESTRICT',
});
Variante.hasMany(DetallePedido, {
  foreignKey: 'varianteId',
  as: 'detalles',
  onDelete: 'RESTRICT',
});

Categoria.hasMany(Producto, { foreignKey: 'categoryId', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoryId', as: 'categoria' });

Usuario.hasMany(Pedido, { foreignKey: 'clienteId', as: 'pedidos' });
Pedido.belongsTo(Usuario, { foreignKey: 'clienteId', as: 'cliente' });

Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

Producto.hasMany(DetallePedido, {
  foreignKey: 'productoId',
  as: 'detallesPedido',
});
DetallePedido.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

const db = {
  sequelize,
  Usuario,
  Categoria,
  Producto,
  Pedido,
  DetallePedido,
  Variante,
};

module.exports = db;
