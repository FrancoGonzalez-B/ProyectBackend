const { sequelize } = require('../database');
const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');

Categoria.hasMany(Producto, { foreignKey: 'categoriaId' });
Producto.belongsTo(Categoria, { foreignKey: 'categoriaId' });

Usuario.hasMany(Pedido, { foreignKey: 'clienteId' });
Pedido.belongsTo(Usuario, { foreignKey: 'clienteId' });

Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId' });

Producto.hasMany(DetallePedido, { foreignKey: 'productoId' });
DetallePedido.belongsTo(Producto, { foreignKey: 'productoId' });

const db = {
  sequelize,
  Usuario,
  Categoria,
  Producto,
  Pedido,
  DetallePedido,
};

module.exports = db;
