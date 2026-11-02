const { Op } = require('sequelize');
const { randomUUID } = require('node:crypto');
const Producto = require('../../domain/entities/Producto');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');
const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const db = require('../models');
const include = [{ model: db.Variante, as: 'variantes' }];
const mapVariant = (v) => ({
  id: v.id,
  sku: v.sku,
  talla: v.size,
  color: v.color,
  stock: v.stock,
  precio: v.price === null ? null : Number(v.price),
});
function mapProducto(row) {
  if (!row) return null;
  const p = row.get({ plain: true });
  return Object.assign(
    new Producto({
      id: p.id,
      nombre: p.name,
      precio: Number(p.price),
      stock: p.stock,
      sku: p.sku,
      categoriaId: p.categoryId,
      descripcion: p.description,
      estado: !p.isActive
        ? 'DESCONTINUADO'
        : p.stock === 0
          ? 'AGOTADO'
          : 'DISPONIBLE',
    }),
    { slug: p.slug, variantes: (p.variantes || []).map(mapVariant) },
  );
}
class ProductoRepositorySQL {
  async obtenerPorId(id) {
    return mapProducto(await db.Producto.findByPk(id, { include }));
  }
  async obtenerPorSku(sku) {
    return mapProducto(await db.Producto.findOne({ where: { sku }, include }));
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
    if (estado === 'DESCONTINUADO') where.isActive = false;
    else if (estado) {
      where.isActive = true;
      where.stock = estado === 'AGOTADO' ? 0 : { [Op.gt]: 0 };
    }
    if (buscar) where.name = { [Op.like]: `%${buscar}%` };
    const columns = {
      id: 'id',
      nombre: 'name',
      name: 'name',
      precio: 'price',
      price: 'price',
      stock: 'stock',
    };
    const { count, rows } = await db.Producto.findAndCountAll({
      where,
      include,
      distinct: true,
      order: [[columns[ordenarPor], descendente ? 'DESC' : 'ASC']],
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
  async contarPorCategoria(categoryId) {
    return db.Producto.count({ where: { categoryId } });
  }
  async crear(p) {
    return db.sequelize.transaction(async (transaction) => {
      const slug =
        p.nombre
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 150) +
        '-' +
        randomUUID().slice(0, 8);
      const row = await db.Producto.create(
        {
          name: p.nombre.trim(),
          slug,
          description: p.descripcion || null,
          price: p.precio,
          stock: 0,
          sku: p.sku,
          isActive: p.estado !== 'DESCONTINUADO',
          categoryId: p.categoriaId,
        },
        { transaction },
      );
      await db.Variante.create(
        {
          productId: row.id,
          sku: 'BASE-' + p.sku,
          size: 'UNICA',
          color: 'ESTANDAR',
          stock: p.stock,
          price: null,
        },
        { transaction },
      );
      return mapProducto(
        await db.Producto.findByPk(row.id, { include, transaction }),
      );
    });
  }
  async actualizar(id, p) {
    return db.sequelize.transaction(async (transaction) => {
      const row = await db.Producto.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new RecursoNoEncontrado('No existe el producto');
      const variants = await db.Variante.findAll({
        where: { productId: id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (variants.length !== 1 && p.stock !== row.stock)
        throw new ConflictoDeEstado(
          'Modificar el stock por variante cuando hay varias tallas/colores',
        );
      if (variants.length === 1)
        await variants[0].update({ stock: p.stock }, { transaction });
      await row.update(
        {
          name: p.nombre.trim(),
          description: p.descripcion || null,
          price: p.precio,
          sku: p.sku,
          isActive: p.estado !== 'DESCONTINUADO',
          categoryId: p.categoriaId,
        },
        { transaction },
      );
      return mapProducto(
        await db.Producto.findByPk(id, { include, transaction }),
      );
    });
  }
  async eliminar(id) {
    return db.Producto.destroy({ where: { id } });
  }
  async variantes(productId) {
    if (!(await db.Producto.findByPk(productId)))
      throw new RecursoNoEncontrado('No existe el producto');
    return (
      await db.Variante.findAll({
        where: { productId },
        order: [['id', 'ASC']],
      })
    ).map(mapVariant);
  }
  async guardarVariante(productId, id, data) {
    return db.sequelize.transaction(async (transaction) => {
      if (
        !(await db.Producto.findByPk(productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        }))
      )
        throw new RecursoNoEncontrado('No existe el producto');
      const fields = {
        productId,
        sku: data.sku,
        size: data.talla.trim(),
        color: data.color.trim(),
        stock: data.stock,
        price: data.precio ?? null,
      };
      let row;
      if (id) {
        row = await db.Variante.findOne({
          where: { id, productId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!row) throw new RecursoNoEncontrado('No existe la variante');
        await row.update(fields, { transaction });
      } else row = await db.Variante.create(fields, { transaction });
      return mapVariant(row);
    });
  }
  async eliminarVariante(productId, id) {
    return db.sequelize.transaction(async (transaction) => {
      if (
        !(await db.Producto.findByPk(productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        }))
      )
        throw new RecursoNoEncontrado('No existe el producto');
      const row = await db.Variante.findOne({
        where: { id, productId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new RecursoNoEncontrado('No existe la variante');
      await row.destroy({ transaction });
    });
  }
}
module.exports = ProductoRepositorySQL;
