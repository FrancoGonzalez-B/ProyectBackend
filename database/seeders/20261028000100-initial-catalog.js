'use strict';
const { Op, QueryTypes } = require('sequelize');
const seed = 'initial-catalog-v2';
module.exports = {
  async up(q) {
    return q.sequelize.transaction(async (transaction) => {
      const now = new Date();
      async function ensure(table, key, data) {
        const alternate =
          table === 'categories'
            ? ' OR name=:alternate'
            : table === 'products'
              ? ' OR sku=:alternate'
              : '';
        const select = () =>
          q.sequelize.query(
            `SELECT id FROM ${table} WHERE ${key}=:value${alternate}`,
            {
              replacements: {
                value: data[key],
                alternate: table === 'categories' ? data.name : data.sku,
              },
              type: QueryTypes.SELECT,
              transaction,
            },
          );
        let rows = await select();
        if (rows.length) return rows[0].id;
        await q.bulkInsert(
          table,
          [{ ...data, createdAt: now, updatedAt: now }],
          { transaction },
        );
        rows = await select();
        const id = rows[0].id;
        await q.bulkInsert(
          'catalog_seed_records',
          [{ seed, tableName: table, rowId: id }],
          { transaction },
        );
        return id;
      }
      const poleras = await ensure('categories', 'slug', {
        name: 'Poleras',
        slug: 'poleras',
        description: 'Poleras para uso diario.',
        isActive: true,
      });
      const pantalones = await ensure('categories', 'slug', {
        name: 'Pantalones',
        slug: 'pantalones',
        description: 'Pantalones y jeans.',
        isActive: true,
      });
      const polera = await ensure('products', 'slug', {
        name: 'Polera básica',
        slug: 'polera-basica',
        sku: 'POL-BAS-001',
        description: 'Polera de algodón.',
        price: 12990,
        stock: 0,
        categoryId: poleras,
        isActive: true,
      });
      const jeans = await ensure('products', 'slug', {
        name: 'Jeans rectos',
        slug: 'jeans-rectos',
        sku: 'JEA-REC-001',
        description: 'Jeans de corte recto.',
        price: 29990,
        stock: 0,
        categoryId: pantalones,
        isActive: true,
      });
      for (const data of [
        {
          sku: 'POL-BAS-BLA-M',
          size: 'M',
          color: 'Blanco',
          price: 12990,
          stock: 12,
          productId: polera,
        },
        {
          sku: 'POL-BAS-NEG-L',
          size: 'L',
          color: 'Negro',
          price: 12990,
          stock: 8,
          productId: polera,
        },
        {
          sku: 'JEA-REC-AZU-42',
          size: '42',
          color: 'Azul',
          price: 29990,
          stock: 6,
          productId: jeans,
        },
      ])
        await ensure('product_variants', 'sku', data);
    });
  },
  async down(q) {
    return q.sequelize.transaction(async (transaction) => {
      const records = await q.sequelize.query(
        'SELECT tableName,rowId FROM catalog_seed_records WHERE seed=:seed',
        { replacements: { seed }, type: QueryTypes.SELECT, transaction },
      );
      for (const table of ['product_variants', 'products', 'categories']) {
        const ids = records
          .filter((r) => r.tableName === table)
          .map((r) => r.rowId);
        if (ids.length)
          await q.bulkDelete(table, { id: { [Op.in]: ids } }, { transaction });
      }
      await q.bulkDelete('catalog_seed_records', { seed }, { transaction });
    });
  },
};
