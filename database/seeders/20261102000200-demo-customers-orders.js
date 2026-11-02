'use strict';

const { Op, QueryTypes } = require('sequelize');
const seed = 'demo-customers-orders-v1';
const examples = [
  {
    customer: {
      firstName: 'Camila',
      lastName: 'Ejemplo',
      email: 'camila.ejemplo@example.test',
      telefono: '+56911111111',
      direccion: 'Avenida de Prueba 101',
    },
    sku: 'POL-BAS-BLA-M',
    address: 'Dirección de demostración pedido 1',
  },
  {
    customer: {
      firstName: 'Diego',
      lastName: 'Ejemplo',
      email: 'diego.ejemplo@example.test',
      telefono: '+56922222222',
      direccion: 'Avenida de Prueba 202',
    },
    sku: 'JEA-REC-AZU-42',
    address: 'Dirección de demostración pedido 2',
  },
];

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const find = (sql, replacements = {}) =>
        queryInterface.sequelize.query(sql, {
          replacements,
          type: QueryTypes.SELECT,
          transaction,
        });
      const remember = (tableName, rowId) =>
        queryInterface.bulkInsert(
          'catalog_seed_records',
          [{ seed, tableName, rowId }],
          { transaction },
        );
      const now = new Date();

      for (const [index, example] of examples.entries()) {
        let [customers] = await find(
          'SELECT id FROM users WHERE email=:email',
          { email: example.customer.email },
        );
        if (!customers) {
          await queryInterface.bulkInsert(
            'users',
            [
              {
                ...example.customer,
                passwordHash: null,
                role: 'customer',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
          [customers] = await find(
            'SELECT id FROM users WHERE email=:email',
            { email: example.customer.email },
          );
          await remember('users', customers.id);
        }

        const [variants] = await find(
          `SELECT v.id, v.productId, v.stock,
                  COALESCE(v.price, p.price) AS price
           FROM product_variants v
           JOIN products p ON p.id=v.productId
           WHERE v.sku=:sku`,
          { sku: example.sku },
        );
        if (!variants)
          throw new Error(
            `No existe la variante ${example.sku}; ejecuta primero el seeder de catálogo`,
          );

        let [orders] = await find(
          'SELECT id, estado FROM pedidos WHERE cliente_id=:clienteId AND direccion_envio=:address',
          { clienteId: customers.id, address: example.address },
        );
        if (orders) {
          const details = await find(
            'SELECT id, producto_id, variante_id, cantidad FROM detalles_pedido WHERE pedido_id=:pedidoId',
            { pedidoId: orders.id },
          );
          if (
            details.length !== 1 ||
            details[0].producto_id !== variants.productId ||
            details[0].variante_id !== variants.id ||
            details[0].cantidad !== 1
          )
            throw new Error(
              `El pedido de demostración ${orders.id} existe con detalles distintos`,
            );
          continue;
        }
        if (variants.stock < 1)
          throw new Error(
            `Stock insuficiente para crear el pedido de demostración ${index + 1}`,
          );

        const [, update] = await queryInterface.sequelize.query(
          'UPDATE product_variants SET stock=stock-1 WHERE id=:id AND stock>=1',
          { replacements: { id: variants.id }, transaction },
        );
        if (!update.affectedRows)
          throw new Error(`No se pudo reservar stock de ${example.sku}`);

        await queryInterface.bulkInsert(
          'pedidos',
          [
            {
              cliente_id: customers.id,
              direccion_envio: example.address,
              estado: 'PENDIENTE',
              fecha: now,
              total: variants.price,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        [orders] = await find(
          'SELECT id FROM pedidos WHERE cliente_id=:clienteId AND direccion_envio=:address',
          { clienteId: customers.id, address: example.address },
        );
        await remember('pedidos', orders.id);

        await queryInterface.bulkInsert(
          'detalles_pedido',
          [
            {
              pedido_id: orders.id,
              producto_id: variants.productId,
              variante_id: variants.id,
              cantidad: 1,
              precio_unitario: variants.price,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [details] = await find(
          'SELECT id FROM detalles_pedido WHERE pedido_id=:pedidoId AND variante_id=:varianteId',
          { pedidoId: orders.id, varianteId: variants.id },
        );
        await remember('detalles_pedido', details.id);
      }
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const find = (sql, replacements = {}) =>
        queryInterface.sequelize.query(sql, {
          replacements,
          type: QueryTypes.SELECT,
          transaction,
        });
      const records = await find(
        'SELECT tableName, rowId FROM catalog_seed_records WHERE seed=:seed',
        { seed },
      );
      const idsFor = (tableName) =>
        records
          .filter((record) => record.tableName === tableName)
          .map((record) => record.rowId);
      const orderIds = idsFor('pedidos');
      const detailIds = idsFor('detalles_pedido');
      const customerIds = idsFor('users');
      const orderStates = new Map();
      const detailRows = [];

      for (const orderId of orderIds) {
        const [order] = await find(
          'SELECT id, cliente_id, estado FROM pedidos WHERE id=:id',
          { id: orderId },
        );
        if (!order) continue;
        orderStates.set(order.id, order.estado);
        const orderDetails = await find(
          'SELECT id, pedido_id, variante_id, cantidad FROM detalles_pedido WHERE pedido_id=:pedidoId',
          { pedidoId: orderId },
        );
        if (
          orderDetails.length !==
            orderDetails.filter((detail) => detailIds.includes(detail.id))
              .length ||
          orderDetails.length !== 1
        )
          throw new Error(
            `No se puede revertir el pedido ${orderId}: sus detalles cambiaron`,
          );
        detailRows.push(...orderDetails);
      }

      for (const customerId of customerIds) {
        const unrelatedOrders = await find(
          `SELECT id FROM pedidos
           WHERE cliente_id=:customerId
             AND id NOT IN (${orderIds.length ? orderIds.join(',') : '0'})`,
          { customerId },
        );
        if (unrelatedOrders.length)
          throw new Error(
            `No se puede eliminar el cliente de demostración ${customerId}: tiene otros pedidos`,
          );
      }

      for (const detail of detailRows) {
        if (orderStates.get(detail.pedido_id) !== 'CANCELADO')
          await queryInterface.sequelize.query(
            'UPDATE product_variants SET stock = stock + :quantity WHERE id=:variantId',
            {
              replacements: {
                quantity: detail.cantidad,
                variantId: detail.variante_id,
              },
              transaction,
            },
          );
      }

      for (const tableName of [
        'detalles_pedido',
        'pedidos',
        'users',
      ]) {
        const ids = idsFor(tableName);
        if (ids.length)
          await queryInterface.bulkDelete(
            tableName,
            { id: { [Op.in]: ids } },
            { transaction },
          );
      }
      await queryInterface.bulkDelete(
        'catalog_seed_records',
        { seed },
        { transaction },
      );
    });
  },
};
