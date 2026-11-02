const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');

class CategoriaService {
  constructor({ categoriaRepository, productoRepository }) {
    this.categoriaRepository = categoriaRepository;
    this.productoRepository = productoRepository;
  }

  async crear({ nombre, descripcion, activa }) {
    const existente = await this.categoriaRepository.obtenerPorNombre(nombre);
    if (existente) {
      throw new ConflictoDeEstado('Ya existe una categoría con ese nombre', [{ campo: 'nombre', valor: nombre }]);
    }
    return await this.categoriaRepository.crear({ nombre, descripcion, activa });
  }

  async listar() {
    return await this.categoriaRepository.listar();
  }

  async obtener(id) {
    const categoria = await this.categoriaRepository.obtenerPorId(id);
    if (!categoria) {
      throw new RecursoNoEncontrado('No existe una categoría con el ID solicitado', [{ campo: 'categoriaId', valor: id }]);
    }
    return categoria;
  }

  async actualizar(id, { nombre, descripcion, activa }) {
    const categoria = await this.obtener(id);
    const existente = await this.categoriaRepository.obtenerPorNombre(nombre);
    if (existente && existente.id !== id) {
      throw new ConflictoDeEstado('Ya existe una categoría con ese nombre', [{ campo: 'nombre', valor: nombre }]);
    }
    return await this.categoriaRepository.actualizar(id, { nombre, descripcion, activa });
  }

  async eliminar(id) {
    const categoria = await this.obtener(id);
    const cantidadProductos = await this.productoRepository.contarPorCategoria(id);
    if (cantidadProductos > 0) {
      throw new ConflictoDeEstado('No se puede eliminar la categoría porque tiene productos asociados', [{ campo: 'categoriaId', valor: id }]);
    }
    await this.categoriaRepository.eliminar(id);
  }
}

module.exports = CategoriaService;
