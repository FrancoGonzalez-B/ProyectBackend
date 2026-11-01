'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      sku: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      size: { type: Sequelize.STRING(20), allowNull: false },
      color: { type: Sequelize.STRING(40), allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      imageUrl: { type: Sequelize.STRING(500), allowNull: true },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_variants');
  },
};
