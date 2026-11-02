class ClienteRepository {
  async obtenerPorId(id) { throw new Error('Método no implementado'); }
  async obtenerPorEmail(email) { throw new Error('Método no implementado'); }
  async listar() { throw new Error('Método no implementado'); }
  async crear(cliente) { throw new Error('Método no implementado'); }
  async actualizar(id, datos) { throw new Error('Método no implementado'); }
  async eliminar(id) { throw new Error('Método no implementado'); }
}

module.exports = ClienteRepository;
