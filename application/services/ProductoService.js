const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');

class ProductoService {
  constructor({ productoRepository, categoriaRepository, pedidoRepository }) {
    this.productoRepository = productoRepository;
    this.categoriaRepository = categoriaRepository;
    this.pedidoRepository = pedidoRepository;
  }

  async crear({ nombre, precio, stock, sku, categoriaId, descripcion, estado }) {
    const categoria = await this.categoriaRepository.obtenerPorId(categoriaId);
    if (!categoria) {
      throw new RecursoNoEncontrado('No existe una categoría con el ID indicado', [{ campo: 'categoriaId', valor: categoriaId }]);
    }

    const existenteSku = await this.productoRepository.obtenerPorSku(sku);
    if (existenteSku) {
      throw new ConflictoDeEstado('Ya existe un producto con ese SKU', [{ campo: 'sku', valor: sku }]);
    }

    return await this.productoRepository.crear({ nombre, precio, stock, sku, categoriaId, descripcion, estado });
  }

  async listar({ categoria, estado, buscar, ordenarPor = 'id', descendente = false, pagina = 1, limite = 10 }) {
    return await this.productoRepository.listar({
      categoria,
      estado,
      buscar,
      ordenarPor,
      descendente,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
    });
  }

  async obtener(id) {
    const producto = await this.productoRepository.obtenerPorId(id);
    if (!producto) {
      throw new RecursoNoEncontrado('No existe un producto con el ID solicitado', [{ campo: 'productoId', valor: id }]);
    }
    return producto;
  }

  async actualizar(id, datos) {
    const producto = await this.obtener(id);
    return await this.productoRepository.actualizar(id, datos);
  }

  async eliminar(id) {
    const producto = await this.obtener(id);
    const usadoEnPedidos = await this.pedidoRepository.existeConProducto(id);
    if (usadoEnPedidos) {
      throw new ConflictoDeEstado('No se puede eliminar el producto porque aparece en pedidos', [{ campo: 'productoId', valor: id }]);
    }
    await this.productoRepository.eliminar(id);
  }
}

module.exports = ProductoService;
