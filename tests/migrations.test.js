const assert = require('node:assert/strict');
const test = require('node:test');
const Sequelize = require('sequelize');
const db = require('../infrastructure/models');

const migrationPaths = [
  '../database/migrations/20261028000100-create-users',
  '../database/migrations/20261028000200-create-categories',
  '../database/migrations/20261028000300-create-products',
  '../database/migrations/20261028000400-create-product-variants',
  '../database/migrations/20261102000100-add-orders-and-order-fields',
];

test('all migrations create every column required by the runtime models', async () => {
  const schema = new Map();
  const queryInterface = {
    sequelize: { query: async () => [[], {}] },
    createTable: async (table, columns) => schema.set(table, new Set(Object.keys(columns))),
    addColumn: async (table, column) => schema.get(table).add(column),
    changeColumn: async (table, column) => schema.get(table).add(column),
    addConstraint: async () => {},
  };

  for (const migrationPath of migrationPaths) {
    const migration = require(migrationPath);
    await migration.up(queryInterface, Sequelize);
  }

  const models = [
    db.Usuario,
    db.Categoria,
    db.Producto,
    db.Pedido,
    db.DetallePedido,
  ];
  for (const model of models) {
    const columns = schema.get(model.tableName);
    assert.ok(columns, `migration did not create ${model.tableName}`);
    for (const attribute of Object.values(model.rawAttributes)) {
      const column = attribute.field || attribute.fieldName;
      assert.ok(columns.has(column), `${model.tableName}.${column} is missing from migrations`);
    }
  }
});
