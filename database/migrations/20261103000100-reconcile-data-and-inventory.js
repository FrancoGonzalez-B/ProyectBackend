'use strict';
module.exports = {
  async up(q, S) {
    const sql = (text, options) => q.sequelize.query(text, options);
    for (const suffix of ['insert', 'update', 'delete'])
      await sql(
        `DROP TRIGGER IF EXISTS product_variants_after_${suffix}_sync_stock`,
      );
    await q.changeColumn('users', 'passwordHash', {
      type: S.STRING(255),
      allowNull: true,
    });
    await q.changeColumn('products', 'description', {
      type: S.TEXT,
      allowNull: true,
    });
    await q.changeColumn('pedidos', 'total', {
      type: S.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    });
    const [unknown] = await sql(
      "SELECT id FROM pedidos WHERE UPPER(estado) NOT IN ('PENDIENTE','PAGADO','CONFIRMADO','ENVIADO','ENTREGADO','CANCELADO')",
    );
    if (unknown.length)
      throw new Error('Hay estados desconocidos; corregir antes de migrar');
    await q.changeColumn('pedidos', 'estado', {
      type: S.STRING(20),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    });
    await sql(
      "UPDATE pedidos SET estado=CASE WHEN UPPER(estado)='PAGADO' THEN 'CONFIRMADO' ELSE UPPER(estado) END",
    );
    await q.changeColumn('pedidos', 'estado', {
      type: S.ENUM(
        'PENDIENTE',
        'CONFIRMADO',
        'ENVIADO',
        'ENTREGADO',
        'CANCELADO',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    });
    const columns = await q.describeTable('detalles_pedido');
    if (!columns.variante_id)
      await q.addColumn('detalles_pedido', 'variante_id', {
        type: S.INTEGER,
        allowNull: true,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    const indexes = await q.showIndex('detalles_pedido');
    if (
      !indexes.some((i) => i.name === 'detalles_pedido_pedido_variante_unique')
    )
      await q.addIndex('detalles_pedido', ['pedido_id', 'variante_id'], {
        unique: true,
        name: 'detalles_pedido_pedido_variante_unique',
      });
    if (
      indexes.some((i) => i.name === 'detalles_pedido_pedido_producto_unique')
    )
      await q.removeIndex(
        'detalles_pedido',
        'detalles_pedido_pedido_producto_unique',
      );
    await sql(`INSERT INTO product_variants (sku,size,color,stock,productId,createdAt,updatedAt)
      SELECT CONCAT('MIG-',UUID_SHORT()),'UNICA','ESTANDAR',p.stock,p.id,NOW(),NOW() FROM products p
      WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.productId=p.id)`);
    // Vincula solamente variantes inequívocas, incluso las estándar recién creadas.
    await sql(`UPDATE detalles_pedido d JOIN (SELECT productId,MIN(id) AS variantId FROM product_variants GROUP BY productId HAVING COUNT(*)=1) v
      ON v.productId=d.producto_id SET d.variante_id=v.variantId WHERE d.variante_id IS NULL`);
    await sql(
      'UPDATE pedidos p SET total=(SELECT COALESCE(SUM(d.cantidad*d.precio_unitario),0) FROM detalles_pedido d WHERE d.pedido_id=p.id)',
    );
    await sql(
      'UPDATE products p SET stock=(SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.productId=p.id)',
    );
    // Deltas atómicos sobre la fila padre evitan sumas obsoletas bajo concurrencia.
    await sql(`CREATE TRIGGER product_variants_after_insert_sync_stock AFTER INSERT ON product_variants FOR EACH ROW
      UPDATE products SET stock=stock+NEW.stock WHERE id=NEW.productId`);
    await sql(`CREATE TRIGGER product_variants_after_update_sync_stock AFTER UPDATE ON product_variants FOR EACH ROW BEGIN
      IF OLD.productId=NEW.productId THEN UPDATE products SET stock=stock+NEW.stock-OLD.stock WHERE id=NEW.productId;
      ELSE UPDATE products SET stock=stock-OLD.stock WHERE id=OLD.productId;
      UPDATE products SET stock=stock+NEW.stock WHERE id=NEW.productId; END IF; END`);
    await sql(`CREATE TRIGGER product_variants_after_delete_sync_stock AFTER DELETE ON product_variants FOR EACH ROW
      UPDATE products SET stock=stock-OLD.stock WHERE id=OLD.productId`);
    if (!(await q.showAllTables()).includes('catalog_seed_records'))
      await q.createTable('catalog_seed_records', {
        seed: { type: S.STRING(100), primaryKey: true, allowNull: false },
        tableName: { type: S.STRING(60), primaryKey: true, allowNull: false },
        rowId: { type: S.INTEGER, primaryKey: true, allowNull: false },
      });
    for (const [table, name, condition] of [
      ['product_variants', 'variant_stock_nonnegative', 'stock>=0'],
      ['products', 'product_stock_nonnegative', 'stock>=0'],
      ['detalles_pedido', 'detail_quantity_positive', 'cantidad>0'],
      ['detalles_pedido', 'detail_price_nonnegative', 'precio_unitario>=0'],
      ['pedidos', 'order_total_nonnegative', 'total>=0'],
    ]) {
      const [found] = await sql(
        'SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME=:name',
        { replacements: { name } },
      );
      if (!found.length)
        await sql(
          `ALTER TABLE ${table} ADD CONSTRAINT ${name} CHECK (${condition})`,
        );
    }
  },
  async down() {
    throw new Error(
      'La conversión de datos históricos se revierte con otra migración; no eliminar variantes o estados de pedidos',
    );
  },
};
