class PedidoRepository {
  async obtenerPorId(id) { throw new Error('Método no implementado'); }
  async listar(filtros) { throw new Error('Método no implementado'); }
  async crear(pedido) { throw new Error('Método no implementado'); }
  async actualizar(id, datos) { throw new Error('Método no implementado'); }
  async eliminar(id) { throw new Error('Método no implementado'); }
  async existeConProducto(productoId) { throw new Error('Método no implementado'); }
}

module.exports = PedidoRepository;
