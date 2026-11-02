const assert = require('node:assert/strict');
const test = require('node:test');
const db = require('../infrastructure/models');
const configuredSequelize = require('../config/database');

test('API models share the migration connection and use matching database fields', () => {
  assert.equal(db.sequelize, configuredSequelize);
  assert.equal(db.Producto.rawAttributes.categoryId.field, 'categoryId');
  assert.equal(db.Producto.rawAttributes.sku.allowNull, false);
  assert.ok(db.Producto.rawAttributes.stock);
  assert.equal(db.Usuario.rawAttributes.passwordHash.allowNull, true);
  assert.equal(db.Pedido.rawAttributes.clienteId.field, 'cliente_id');
  assert.deepEqual(db.Pedido.rawAttributes.estado.type.values, [
    'PENDIENTE',
    'CONFIRMADO',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
  ]);
  assert.equal(db.DetallePedido.rawAttributes.pedidoId.field, 'pedido_id');
  assert.equal(db.DetallePedido.rawAttributes.precioUnitario.field, 'precio_unitario');
});
