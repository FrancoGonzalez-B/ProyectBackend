const ConflictoDeEstado = require('../exceptions/ConflictoDeEstado');

class Pedido {
  constructor({ id, clienteId, direccionEnvio, detalles, estado, fecha } = {}) {
    this.id = id || null;
    this.clienteId = clienteId;
    this.direccionEnvio = direccionEnvio;
    this.detalles = detalles || [];
    this.estado = estado || 'PENDIENTE';
    this.fecha = fecha || new Date();
  }

  get total() {
    return this.detalles.reduce(
      (sum, detalle) => sum + Math.round(detalle.cantidad * detalle.precioUnitario * 100),
      0,
    ) / 100;
  }

  avanzarEstado(nuevoEstado) {
    const orden = {
      PENDIENTE: 'CONFIRMADO',
      CONFIRMADO: 'ENVIADO',
      ENVIADO: 'ENTREGADO',
    };
    if (orden[this.estado] !== nuevoEstado) {
      throw new ConflictoDeEstado('No se puede pasar de ' + this.estado + ' a ' + nuevoEstado);
    }
    this.estado = nuevoEstado;
  }

  cancelar() {
    if (this.estado !== 'PENDIENTE') {
      throw new ConflictoDeEstado('Solo se pueden cancelar pedidos pendientes');
    }
    this.estado = 'CANCELADO';
  }

  toJSON() {
    return {
      id: this.id,
      clienteId: this.clienteId,
      direccionEnvio: this.direccionEnvio,
      detalles: this.detalles,
      estado: this.estado,
      fecha: this.fecha,
      total: this.total,
    };
  }
}

module.exports = Pedido;
