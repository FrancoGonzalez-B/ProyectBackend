const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');

class CategoriaService {
  constructor({ categoriaRepository, productoRepository }) {
    this.categoriaRepository = categoriaRepository;
    this.productoRepository = productoRepository;
  }

  async crear({ nombre, descripcion, activa }) {
    const nombreNormalizado = nombre.trim();
    const existente = await this.categoriaRepository.obtenerPorNombre(nombreNormalizado);
    if (existente) {
      throw new ConflictoDeEstado('Ya existe una categoría con ese nombre', [{ campo: 'nombre', valor: nombreNormalizado }]);
    }
    return await this.categoriaRepository.crear({ nombre: nombreNormalizado, descripcion, activa });
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
    const nombreNormalizado = nombre.trim();
    const existente = await this.categoriaRepository.obtenerPorNombre(nombreNormalizado);
    if (existente && existente.id !== id) {
      throw new ConflictoDeEstado('Ya existe una categoría con ese nombre', [{ campo: 'nombre', valor: nombreNormalizado }]);
    }
    return await this.categoriaRepository.actualizar(id, { nombre: nombreNormalizado, descripcion, activa });
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
