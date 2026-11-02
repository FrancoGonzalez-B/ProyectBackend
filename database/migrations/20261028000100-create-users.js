'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      firstName: { type: Sequelize.STRING(60), allowNull: false },
      lastName: { type: Sequelize.STRING(60), allowNull: false },
      email: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING(255), allowNull: true },
      role: { type: Sequelize.ENUM('customer', 'admin'), allowNull: false, defaultValue: 'customer' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
