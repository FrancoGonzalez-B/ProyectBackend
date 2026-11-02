'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('tablas_personalizadas', {
      nombre: { type: S.STRING(64), primaryKey: true, allowNull: false },
      definicion: { type: S.JSON, allowNull: false },
      estado: {
        type: S.ENUM('pendiente', 'creada', 'error'),
        allowNull: false,
      },
      error: { type: S.STRING(80), allowNull: true },
      creadorId: {
        type: S.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: { type: S.DATE, allowNull: false },
      updatedAt: { type: S.DATE, allowNull: false },
    });
  },
  async down(q) {
    const [rows] = await q.sequelize.query(
      'SELECT COUNT(*) AS n FROM tablas_personalizadas',
    );
    if (Number(rows[0].n))
      throw new Error(
        'Hay definiciones de tablas: conservar su registro o exportarlas antes de revertir',
      );
    await q.dropTable('tablas_personalizadas');
  },
};
