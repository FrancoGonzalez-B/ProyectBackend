class ProductoRepository {
  async obtenerPorId(id) { throw new Error('Método no implementado'); }
  async obtenerPorSku(sku) { throw new Error('Método no implementado'); }
  async listar(filtros) { throw new Error('Método no implementado'); }
  async contarPorCategoria(categoriaId) { throw new Error('Método no implementado'); }
  async crear(producto) { throw new Error('Método no implementado'); }
  async actualizar(id, datos) { throw new Error('Método no implementado'); }
  async eliminar(id) { throw new Error('Método no implementado'); }
}

module.exports = ProductoRepository;
