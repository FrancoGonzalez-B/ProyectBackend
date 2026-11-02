const db = require('../models');

class PedidoRepositorySQL {
  async obtenerPorId(id) {
    return await db.Pedido.findByPk(id, { include: [{ model: db.DetallePedido }] });
  }

  async listar({ clienteId, estado } = {}) {
    const where = {};
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;
    return await db.Pedido.findAll({ where, include: [{ model: db.DetallePedido }], order: [['id', 'ASC']] });
  }

  async crear(pedido) {
    const ormPedido = await db.Pedido.create({
      clienteId: pedido.clienteId,
      direccionEnvio: pedido.direccionEnvio,
      estado: pedido.estado,
      total: pedido.total || 0,
    });

    const detalleObjetos = pedido.detalles.map(d => ({
      pedidoId: ormPedido.id,
      productoId: d.productoId,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
    }));

    await db.DetallePedido.bulkCreate(detalleObjetos);

    return await db.Pedido.findByPk(ormPedido.id, { include: [{ model: db.DetallePedido }] });
  }

  async actualizar(id, datos) {
    const pedido = await db.Pedido.findByPk(id);
    if (!pedido) return null;
    await pedido.update(datos);
    return pedido;
  }

  async eliminar(id) {
    return await db.Pedido.destroy({ where: { id } });
  }

  async existeConProducto(productoId) {
    const existe = await db.DetallePedido.findOne({ where: { productoId } });
    return existe !== null;
  }
}

module.exports = PedidoRepositorySQL;
