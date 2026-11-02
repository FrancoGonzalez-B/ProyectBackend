const { Op } = require('sequelize');
const db = require('../models');
const Pedido = require('../../domain/entities/Pedido');
const DetallePedido = require('../../domain/entities/DetallePedido');
const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');
const ReglaDeNegocioViolada = require('../../domain/exceptions/ReglaDeNegocioViolada');
const { totalCents } = require('../../domain/money');
function mapPedido(row) {
  if (!row) return null;
  const data = row.get({ plain: true });
  return new Pedido({
    ...data,
    detalles: (data.detalles || []).map(
      (d) =>
        new DetallePedido({ ...d, precioUnitario: Number(d.precioUnitario) }),
    ),
  });
}
const include = [{ model: db.DetallePedido, as: 'detalles' }];
class PedidoRepositorySQL {
  async obtenerPorId(id) {
    return mapPedido(await db.Pedido.findByPk(id, { include }));
  }
  async listar({ clienteId, estado } = {}) {
    const where = {};
    if (clienteId !== undefined) {
      if (!Number.isSafeInteger(Number(clienteId)) || Number(clienteId) < 1)
        throw new ReglaDeNegocioViolada('Cliente inválido');
      where.clienteId = Number(clienteId);
    }
    if (estado !== undefined) {
      if (
        ![
          'PENDIENTE',
          'CONFIRMADO',
          'ENVIADO',
          'ENTREGADO',
          'CANCELADO',
        ].includes(estado)
      )
        throw new ReglaDeNegocioViolada('Estado inválido');
      where.estado = estado;
    }
    return (
      await db.Pedido.findAll({ where, include, order: [['id', 'ASC']] })
    ).map(mapPedido);
  }
  async crear({ clienteId, direccionEnvio, detalles }) {
    return db.sequelize.transaction(async (transaction) => {
      const cliente = await db.Usuario.findByPk(clienteId, { transaction });
      if (!cliente)
        throw new RecursoNoEncontrado('No existe el cliente indicado');
      const address = (
        direccionEnvio === undefined ? cliente.direccion || '' : direccionEnvio
      ).trim();
      if (address.length < 5 || address.length > 500)
        throw new ReglaDeNegocioViolada('Dirección inválida');
      const ids = [...new Set(detalles.map((d) => d.productoId))].sort(
        (a, b) => a - b,
      );
      const products = await db.Producto.findAll({
        where: { id: { [Op.in]: ids } },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (products.length !== ids.length)
        throw new RecursoNoEncontrado('Uno o más productos no existen');
      const lines = [],
        used = new Set();
      for (const product of products) {
        const variants = await db.Variante.findAll({
          where: { productId: product.id },
          order: [['id', 'ASC']],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        for (const detail of detalles.filter(
          (d) => d.productoId === product.id,
        )) {
          const variant = detail.varianteId
            ? variants.find((v) => v.id === detail.varianteId)
            : variants.length === 1
              ? variants[0]
              : null;
          if (!variant)
            throw new ReglaDeNegocioViolada(
              'Debes indicar una variante válida del producto',
              [{ campo: 'varianteId', productoId: product.id }],
            );
          if (used.has(variant.id))
            throw new ReglaDeNegocioViolada('No se puede repetir una variante');
          used.add(variant.id);
          if (!product.isActive || variant.stock < detail.cantidad)
            throw new ReglaDeNegocioViolada('No hay stock suficiente');
          lines.push({
            productoId: product.id,
            varianteId: variant.id,
            cantidad: detail.cantidad,
            precioUnitario: Number(
              variant.price === null ? product.price : variant.price,
            ),
          });
        }
      }
      const total = totalCents(lines) / 100;
      const order = await db.Pedido.create(
        { clienteId, direccionEnvio: address, estado: 'PENDIENTE', total },
        { transaction },
      );
      await db.DetallePedido.bulkCreate(
        lines.map((line) => ({ ...line, pedidoId: order.id })),
        { transaction, validate: true },
      );
      for (const line of lines)
        await db.Variante.decrement('stock', {
          by: line.cantidad,
          where: { id: line.varianteId },
          transaction,
        });
      return mapPedido(
        await db.Pedido.findByPk(order.id, { include, transaction }),
      );
    });
  }
  async cambiarEstado(id, estado) {
    return db.sequelize.transaction(async (transaction) => {
      const row = await db.Pedido.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new RecursoNoEncontrado('No existe el pedido');
      new Pedido({ estado: row.estado }).avanzarEstado(estado);
      await row.update({ estado }, { transaction });
      return mapPedido(await db.Pedido.findByPk(id, { include, transaction }));
    });
  }
  async cancelar(id) {
    return db.sequelize.transaction(async (transaction) => {
      const order = await db.Pedido.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!order) throw new RecursoNoEncontrado('No existe el pedido');
      new Pedido({ estado: order.estado }).cancelar();
      const details = await db.DetallePedido.findAll({
        where: { pedidoId: id },
        order: [
          ['productoId', 'ASC'],
          ['varianteId', 'ASC'],
        ],
        transaction,
      });
      if (details.some((d) => !d.varianteId))
        throw new ConflictoDeEstado(
          'Pedido histórico sin variante: reconciliar el inventario antes de cancelar',
        );
      const ids = [...new Set(details.map((d) => d.productoId))].sort(
        (a, b) => a - b,
      );
      await db.Producto.findAll({
        where: { id: { [Op.in]: ids } },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      for (const detail of details) {
        const variant = await db.Variante.findByPk(detail.varianteId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!variant || variant.productId !== detail.productoId)
          throw new ConflictoDeEstado('No se puede reponer esta variante');
        await variant.increment('stock', { by: detail.cantidad, transaction });
      }
      await order.update({ estado: 'CANCELADO' }, { transaction });
      return mapPedido(await db.Pedido.findByPk(id, { include, transaction }));
    });
  }
  async existeConProducto(productoId) {
    return Boolean(await db.DetallePedido.findOne({ where: { productoId } }));
  }
}
module.exports = PedidoRepositorySQL;
