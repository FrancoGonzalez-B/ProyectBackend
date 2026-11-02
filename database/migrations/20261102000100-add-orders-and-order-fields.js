'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Campos solicitados para los clientes existentes.
    await queryInterface.addColumn('users', 'telefono', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'direccion', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    // Campos solicitados para controlar el inventario a nivel de producto.
    await queryInterface.addColumn('products', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('products', 'sku', {
      type: Sequelize.STRING(80),
      allowNull: true,
    });

    // Los productos existentes necesitan un SKU antes de imponer unicidad y NOT NULL.
    await queryInterface.sequelize.query(
      "UPDATE products SET sku = CONCAT('SKU-', id) WHERE sku IS NULL",
    );
    await queryInterface.sequelize.query(
      `UPDATE products
       SET stock = (
         SELECT COALESCE(SUM(product_variants.stock), 0)
         FROM product_variants
         WHERE product_variants.productId = products.id
       )`,
    );
    await queryInterface.changeColumn('products', 'sku', {
      type: Sequelize.STRING(80),
      allowNull: false,
    });
    await queryInterface.addConstraint('products', {
      fields: ['sku'],
      type: 'unique',
      name: 'products_sku_unique',
    });

    await queryInterface.createTable('pedidos', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      direccion_envio: { type: Sequelize.STRING(500), allowNull: false },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },
      fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('detalles_pedido', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pedidos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint('detalles_pedido', {
      fields: ['pedido_id', 'producto_id'],
      type: 'unique',
      name: 'detalles_pedido_pedido_producto_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalles_pedido');
    await queryInterface.dropTable('pedidos');
    await queryInterface.removeConstraint('products', 'products_sku_unique');
    await queryInterface.removeColumn('products', 'sku');
    await queryInterface.removeColumn('products', 'stock');
    await queryInterface.removeColumn('users', 'direccion');
    await queryInterface.removeColumn('users', 'telefono');
  },
};
