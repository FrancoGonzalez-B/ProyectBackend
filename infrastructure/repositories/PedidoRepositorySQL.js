const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');
const DetallePedido = require('../../domain/entities/DetallePedido');
const Pedido = require('../../domain/entities/Pedido');
const db = require('../models');

const mapPedido = (pedido) => {
  if (!pedido) return null;
  const data = pedido.get ? pedido.get({ plain: true }) : pedido;
  return new Pedido({
    id: data.id,
    clienteId: data.clienteId,
    direccionEnvio: data.direccionEnvio,
    estado: data.estado,
    fecha: data.fecha,
    detalles: (data.detalles || []).map((detalle) => new DetallePedido({
      id: detalle.id,
      pedidoId: detalle.pedidoId,
      productoId: detalle.productoId,
      cantidad: detalle.cantidad,
      precioUnitario: Number(detalle.precioUnitario),
    })),
  });
};

const includeDetalles = [{ model: db.DetallePedido, as: 'detalles' }];

class PedidoRepositorySQL {
  async obtenerPorId(id) {
    return mapPedido(await db.Pedido.findByPk(id, { include: includeDetalles }));
  }

  async listar({ clienteId, estado } = {}) {
    const where = {};
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;
    const pedidos = await db.Pedido.findAll({
      where,
      include: includeDetalles,
      order: [['id', 'ASC']],
    });
    return pedidos.map(mapPedido);
  }

  async crear(pedido, cambiosStock = []) {
    return db.sequelize.transaction(async (transaction) => {
      await this.actualizarStock(cambiosStock, transaction);
      const creado = await db.Pedido.create({
        clienteId: pedido.clienteId,
        direccionEnvio: pedido.direccionEnvio,
        estado: 'PENDIENTE',
        total: pedido.detalles.reduce(
          (total, detalle) => total + Math.round(detalle.cantidad * detalle.precioUnitario * 100),
          0,
        ) / 100,
      }, { transaction });

      await db.DetallePedido.bulkCreate(pedido.detalles.map((detalle) => ({
        pedidoId: creado.id,
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      })), { transaction });

      const pedidoCompleto = await db.Pedido.findByPk(creado.id, {
        include: includeDetalles,
        transaction,
      });
      return mapPedido(pedidoCompleto);
    });
  }

  async actualizar(id, datos) {
    const pedido = await db.Pedido.findByPk(id);
    if (!pedido) return null;
    await pedido.update(datos);
    return mapPedido(await db.Pedido.findByPk(id, { include: includeDetalles }));
  }

  async actualizarConStock(id, datos, cambiosStock) {
    return db.sequelize.transaction(async (transaction) => {
      const pedido = await db.Pedido.findByPk(id, { transaction });
      if (!pedido) return null;
      await this.actualizarStock(cambiosStock, transaction);
      await pedido.update(datos, { transaction });
      return mapPedido(await db.Pedido.findByPk(id, {
        include: includeDetalles,
        transaction,
      }));
    });
  }

  async actualizarStock(cambiosStock, transaction) {
    for (const cambio of cambiosStock) {
      const [actualizados] = await db.Producto.update(
        { stock: cambio.stock },
        { where: { id: cambio.id, stock: cambio.stockAnterior }, transaction },
      );
      if (actualizados !== 1) {
        throw new ConflictoDeEstado(
          'El inventario cambió mientras se procesaba el pedido; vuelve a intentarlo',
          [{ campo: 'productoId', valor: cambio.id }],
        );
      }
    }
  }

  async eliminar(id) {
    return db.Pedido.destroy({ where: { id } });
  }

  async existeConProducto(productoId) {
    return (await db.DetallePedido.findOne({ where: { productoId } })) !== null;
  }
}

module.exports = PedidoRepositorySQL;
