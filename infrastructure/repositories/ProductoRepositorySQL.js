const { Op } = require('sequelize');
const Producto = require('../../domain/entities/Producto');
const db = require('../models');

const mapProducto = (producto) => {
  if (!producto) return null;
  const data = producto.get ? producto.get({ plain: true }) : producto;
  const estado = !data.isActive ? 'DESCONTINUADO' : data.stock === 0 ? 'AGOTADO' : 'DISPONIBLE';
  return new Producto({
    id: data.id,
    nombre: data.name,
    precio: Number(data.price),
    stock: data.stock,
    sku: data.sku,
    categoriaId: data.categoryId,
    descripcion: data.description,
    estado,
  });
};

class ProductoRepositorySQL {
  async obtenerPorId(id) {
    return mapProducto(await db.Producto.findByPk(id));
  }

  async obtenerPorSku(sku) {
    return mapProducto(await db.Producto.findOne({ where: { sku } }));
  }

  async listar({
    categoria,
    estado,
    buscar,
    ordenarPor = 'id',
    descendente = false,
    pagina = 1,
    limite = 10,
  }) {
    const where = {};
    if (categoria) where.categoryId = categoria;
    if (estado === 'DESCONTINUADO') {
      where.isActive = false;
    } else if (estado === 'AGOTADO') {
      where.isActive = true;
      where.stock = 0;
    } else if (estado === 'DISPONIBLE') {
      where.isActive = true;
      where.stock = { [Op.gt]: 0 };
    }
    if (buscar) where.name = { [Op.like]: `%${buscar}%` };

    const columnasOrdenables = {
      id: 'id',
      nombre: 'name',
      name: 'name',
      precio: 'price',
      price: 'price',
      stock: 'stock',
    };
    const columna = columnasOrdenables[ordenarPor];
    const { count, rows } = await db.Producto.findAndCountAll({
      where,
      order: [[columna, descendente === true || descendente === 'true' ? 'DESC' : 'ASC']],
      offset: (pagina - 1) * limite,
      limit: limite,
    });

    return {
      items: rows.map(mapProducto),
      total: count,
      pagina,
      limite,
      totalPaginas: Math.ceil(count / limite),
    };
  }

  async contarPorCategoria(categoriaId) {
    return db.Producto.count({ where: { categoryId: categoriaId } });
  }

  async crear(producto) {
    const creada = await db.Producto.create({
      name: producto.nombre,
      slug: producto.sku.toLowerCase(),
      description: producto.descripcion || null,
      price: producto.precio,
      stock: producto.stock,
      sku: producto.sku,
      isActive: producto.estado !== 'DESCONTINUADO',
      categoryId: producto.categoriaId,
    });
    return mapProducto(creada);
  }

  async actualizar(id, datos) {
    const producto = await db.Producto.findByPk(id);
    if (!producto) return null;
    await producto.update({
      name: datos.nombre,
      slug: datos.sku.toLowerCase(),
      description: datos.descripcion || null,
      price: datos.precio,
      stock: datos.stock,
      sku: datos.sku,
      isActive: datos.estado !== 'DESCONTINUADO',
      categoryId: datos.categoriaId,
    });
    return mapProducto(producto);
  }

  async eliminar(id) {
    return db.Producto.destroy({ where: { id } });
  }
}

module.exports = ProductoRepositorySQL;
