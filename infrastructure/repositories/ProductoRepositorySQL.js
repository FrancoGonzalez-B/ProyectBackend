const db = require('../models');

class ProductoRepositorySQL {
  async obtenerPorId(id) {
    return await db.Producto.findByPk(id);
  }

  async obtenerPorSku(sku) {
    return await db.Producto.findOne({ where: { slug: sku } });
  }

  async listar({ categoria, estado, buscar, ordenarPor = 'id', descendente = false, pagina = 1, limite = 10 }) {
    const where = {};
    if (categoria) where.categoriaId = categoria;
    if (estado) where.isActive = (estado === 'DISPONIBLE');
    if (buscar) {
      where.name = { [db.Sequelize.Op.like]: '%' + buscar + '%' };
    }

    const { count, rows } = await db.Producto.findAndCountAll({
      where,
      order: [[ordenarPor, descendente ? 'DESC' : 'ASC']],
      offset: (pagina - 1) * limite,
      limit: limite,
    });

    return {
      items: rows,
      total: count,
      pagina: pagina,
      limite: limite,
      totalPaginas: Math.ceil(count / limite),
    };
  }

  async contarPorCategoria(categoriaId) {
    return await db.Producto.count({ where: { categoriaId } });
  }

  async crear(producto) {
    return await db.Producto.create({
      name: producto.nombre,
      slug: producto.sku,
      description: producto.descripcion,
      price: producto.precio,
      brand: null,
      imageUrl: null,
      isActive: producto.estado !== 'DESCONTINUADO',
      categoryId: producto.categoriaId,
    });
  }

  async actualizar(id, datos) {
    const producto = await db.Producto.findByPk(id);
    if (!producto) return null;
    await producto.update(datos);
    return producto;
  }

  async eliminar(id) {
    return await db.Producto.destroy({ where: { id } });
  }
}

module.exports = ProductoRepositorySQL;
