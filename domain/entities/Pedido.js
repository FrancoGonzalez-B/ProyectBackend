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
    return this.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
  }

  avanzarEstado(nuevoEstado) {
    const orden = {
      PENDIENTE: 'CONFIRMADO',
      CONFIRMADO: 'ENVIADO',
      ENVIADO: 'ENTREGADO',
    };
    if (orden[this.estado] !== nuevoEstado) {
      throw new Error('No se puede pasar de ' + this.estado + ' a ' + nuevoEstado);
    }
    this.estado = nuevoEstado;
  }

  cancelar() {
    if (this.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden cancelar pedidos PENDIENTES');
    }
    this.estado = 'CANCELADO';
  }
}

module.exports = Pedido;
