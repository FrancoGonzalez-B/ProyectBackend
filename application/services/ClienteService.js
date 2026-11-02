const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');

class ClienteService {
  constructor({ clienteRepository }) {
    this.clienteRepository = clienteRepository;
  }

  async crear({ nombre, email, telefono, direccion }) {
    const existente = await this.clienteRepository.obtenerPorEmail(email);
    if (existente) {
      throw new ConflictoDeEstado('Ya existe un cliente registrado con ese correo', [{ campo: 'email', valor: email }]);
    }
    return await this.clienteRepository.crear({ nombre, email, telefono, direccion });
  }

  async listar() {
    return await this.clienteRepository.listar();
  }

  async obtener(id) {
    const cliente = await this.clienteRepository.obtenerPorId(id);
    if (!cliente) {
      throw new RecursoNoEncontrado('No existe un cliente con el ID solicitado', [{ campo: 'clienteId', valor: id }]);
    }
    return cliente;
  }
}

module.exports = ClienteService;
