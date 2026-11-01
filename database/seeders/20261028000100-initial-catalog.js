'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('categories', [
      { name: 'Poleras', slug: 'poleras', description: 'Poleras para uso diario.', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Pantalones', slug: 'pantalones', description: 'Pantalones y jeans.', isActive: true, createdAt: now, updatedAt: now },
    ]);

    const [categories] = await queryInterface.sequelize.query('SELECT id, slug FROM categories');
    const categoryIdBySlug = Object.fromEntries(categories.map((category) => [category.slug, category.id]));

    await queryInterface.bulkInsert('products', [
      {
        name: 'Polera básica', slug: 'polera-basica', description: 'Polera de algodón de corte regular.',
        price: 12990, brand: 'Tienda', imageUrl: null, isActive: true,
        categoryId: categoryIdBySlug.poleras, createdAt: now, updatedAt: now,
      },
      {
        name: 'Jeans rectos', slug: 'jeans-rectos', description: 'Jeans de tiro medio y corte recto.',
        price: 29990, brand: 'Tienda', imageUrl: null, isActive: true,
        categoryId: categoryIdBySlug.pantalones, createdAt: now, updatedAt: now,
      },
    ]);

    const [products] = await queryInterface.sequelize.query('SELECT id, slug FROM products');
    const productIdBySlug = Object.fromEntries(products.map((product) => [product.slug, product.id]));

    await queryInterface.bulkInsert('product_variants', [
      { sku: 'POL-BAS-BLA-M', size: 'M', color: 'Blanco', price: 12990, stock: 12, imageUrl: null, productId: productIdBySlug['polera-basica'], createdAt: now, updatedAt: now },
      { sku: 'POL-BAS-NEG-L', size: 'L', color: 'Negro', price: 12990, stock: 8, imageUrl: null, productId: productIdBySlug['polera-basica'], createdAt: now, updatedAt: now },
      { sku: 'JEA-REC-AZU-42', size: '42', color: 'Azul', price: 29990, stock: 6, imageUrl: null, productId: productIdBySlug['jeans-rectos'], createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_variants', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  },
};
