class DetallePedido {
  constructor({
    id,
    productoId,
    varianteId,
    cantidad,
    precioUnitario,
    pedidoId,
  } = {}) {
    this.id = id || null;
    this.productoId = productoId;
    this.varianteId = varianteId;
    this.cantidad = cantidad;
    this.precioUnitario = precioUnitario;
    this.pedidoId = pedidoId || null;
  }

  get subtotal() {
    return this.cantidad * this.precioUnitario;
  }
}

module.exports = DetallePedido;
