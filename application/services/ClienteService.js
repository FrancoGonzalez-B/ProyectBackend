const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');

const normalizarCliente = ({ nombre, email, telefono, direccion }) => ({
  nombre: nombre.trim().replace(/\s+/g, ' '),
  email: email.trim().toLowerCase(),
  telefono: telefono.trim(),
  direccion: direccion.trim(),
});

class ClienteService {
  constructor({ clienteRepository }) {
    this.clienteRepository = clienteRepository;
  }

  async crear(datos) {
    const cliente = normalizarCliente(datos);
    const existente = await this.clienteRepository.obtenerPorEmail(
      cliente.email,
    );
    if (existente) {
      throw new ConflictoDeEstado(
        'Ya existe un cliente registrado con ese correo',
        [{ campo: 'email', valor: cliente.email }],
      );
    }
    return await this.clienteRepository.crear(cliente);
  }

  async listar() {
    return await this.clienteRepository.listar();
  }

  async obtener(id) {
    const cliente = await this.clienteRepository.obtenerPorId(id);
    if (!cliente) {
      throw new RecursoNoEncontrado(
        'No existe un cliente con el ID solicitado',
        [{ campo: 'clienteId', valor: id }],
      );
    }
    return cliente;
  }

  async actualizar(id, datos) {
    await this.obtener(id);
    const cliente = normalizarCliente(datos);
    const existente = await this.clienteRepository.obtenerPorEmail(
      cliente.email,
    );
    if (existente && Number(existente.id) !== Number(id)) {
      throw new ConflictoDeEstado(
        'Ya existe un cliente registrado con ese correo',
        [{ campo: 'email', valor: cliente.email }],
      );
    }
    const actualizado = await this.clienteRepository.actualizar(id, cliente);
    if (!actualizado) {
      throw new RecursoNoEncontrado(
        'No existe un cliente con el ID solicitado',
        [{ campo: 'clienteId', valor: id }],
      );
    }
    return actualizado;
  }

  async eliminar(id) {
    await this.obtener(id);
    const eliminados = await this.clienteRepository.eliminar(id);
    if (!eliminados) {
      throw new RecursoNoEncontrado(
        'No existe un cliente con el ID solicitado',
        [{ campo: 'clienteId', valor: id }],
      );
    }
  }
}

module.exports = ClienteService;
