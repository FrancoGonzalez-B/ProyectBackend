const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
class PedidoService {
  constructor({ pedidoRepository }) {
    this.pedidoRepository = pedidoRepository;
  }
  async crear(datos) {
    return this.pedidoRepository.crear(datos);
  }
  async listar(filtros = {}) {
    return this.pedidoRepository.listar(filtros);
  }
  async obtener(id) {
    const pedido = await this.pedidoRepository.obtenerPorId(id);
    if (!pedido)
      throw new RecursoNoEncontrado('No existe el pedido solicitado');
    return pedido;
  }
  async cambiarEstado(id, estado) {
    return this.pedidoRepository.cambiarEstado(id, estado);
  }
  async cancelar(id) {
    return this.pedidoRepository.cancelar(id);
  }
}
module.exports = PedidoService;
