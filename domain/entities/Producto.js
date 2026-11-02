class Producto {
  constructor({ id, nombre, precio, stock, sku, categoriaId, descripcion, estado } = {}) {
    this.id = id || null;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
    this.sku = sku;
    this.categoriaId = categoriaId;
    this.descripcion = descripcion || null;
    this.estado = estado || 'DISPONIBLE';
  }

  tieneStockPara(cantidad) {
    return cantidad <= this.stock;
  }

  descontarStock(cantidad) {
    if (!this.tieneStockPara(cantidad)) {
      throw new Error('Stock insuficiente');
    }
    this.stock -= cantidad;
    if (this.stock === 0 && this.estado === 'DISPONIBLE') {
      this.estado = 'AGOTADO';
    }
  }

  reponerStock(cantidad) {
    this.stock += cantidad;
    if (this.estado === 'AGOTADO' && this.stock > 0) {
      this.estado = 'DISPONIBLE';
    }
  }
}

module.exports = Producto;
