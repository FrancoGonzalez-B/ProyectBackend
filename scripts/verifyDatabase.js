require('dotenv').config({ quiet: true });
const sequelize = require('../config/database');
(async () => {
  const checks = {};
  [checks.stock] = await sequelize.query(
    'SELECT p.id,p.stock,COALESCE(SUM(v.stock),0) AS expected FROM products p LEFT JOIN product_variants v ON v.productId=p.id GROUP BY p.id,p.stock HAVING p.stock<>COALESCE(SUM(v.stock),0)',
  );
  [checks.sku] = await sequelize.query(
    'SELECT sku,COUNT(*) AS n FROM products GROUP BY sku HAVING COUNT(*)>1',
  );
  [checks.totals] = await sequelize.query(
    'SELECT p.id,p.total,COALESCE(SUM(d.cantidad*d.precio_unitario),0) AS expected FROM pedidos p LEFT JOIN detalles_pedido d ON d.pedido_id=p.id GROUP BY p.id,p.total HAVING p.total<>COALESCE(SUM(d.cantidad*d.precio_unitario),0)',
  );
  [checks.states] = await sequelize.query(
    "SELECT id,estado FROM pedidos WHERE estado NOT IN ('PENDIENTE','CONFIRMADO','ENVIADO','ENTREGADO','CANCELADO')",
  );
  [checks.variantReferences] = await sequelize.query(
    'SELECT d.id FROM detalles_pedido d JOIN product_variants v ON v.id=d.variante_id WHERE v.productId<>d.producto_id',
  );
  [checks.historicalUnassigned] = await sequelize.query(
    'SELECT id FROM detalles_pedido WHERE variante_id IS NULL',
  );
  console.log(JSON.stringify(checks, null, 2));
  if (
    Object.entries(checks).some(
      ([key, rows]) => key !== 'historicalUnassigned' && rows.length,
    )
  )
    process.exitCode = 1;
})()
  .catch((err) => {
    console.error(err.code || err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
