const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');
const ReglaDeNegocioViolada = require('../../domain/exceptions/ReglaDeNegocioViolada');

const columnasOrdenables = ['id', 'nombre', 'name', 'precio', 'price', 'stock'];
const estadosValidos = ['DISPONIBLE', 'AGOTADO', 'DESCONTINUADO'];

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
    const paginaNumero = Number(pagina);
    const limiteNumero = Number(limite);
    if (!Number.isInteger(paginaNumero) || paginaNumero < 1 ||
        !Number.isInteger(limiteNumero) || limiteNumero < 1 || limiteNumero > 100) {
      throw new ReglaDeNegocioViolada('La paginación debe usar página mayor a 0 y límite entre 1 y 100');
    }
    if (estado && !estadosValidos.includes(estado)) {
      throw new ReglaDeNegocioViolada('El estado solicitado no es válido');
    }
    if (!columnasOrdenables.includes(ordenarPor)) {
      throw new ReglaDeNegocioViolada('La columna de ordenamiento no es válida');
    }
    if (categoria !== undefined && (!Number.isSafeInteger(Number(categoria)) || Number(categoria) < 1)) {
      throw new ReglaDeNegocioViolada('La categoría debe ser un ID entero positivo');
    }
    return await this.productoRepository.listar({
      categoria: categoria === undefined ? undefined : Number(categoria),
      estado,
      buscar,
      ordenarPor,
      descendente: descendente === true || descendente === 'true',
      pagina: paginaNumero,
      limite: limiteNumero,
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
    await this.obtener(id);
    const categoria = await this.categoriaRepository.obtenerPorId(datos.categoriaId);
    if (!categoria) {
      throw new RecursoNoEncontrado('No existe una categoría con el ID indicado', [
        { campo: 'categoriaId', valor: datos.categoriaId },
      ]);
    }
    const existenteSku = await this.productoRepository.obtenerPorSku(datos.sku);
    if (existenteSku && existenteSku.id !== Number(id)) {
      throw new ConflictoDeEstado('Ya existe un producto con ese SKU', [{ campo: 'sku', valor: datos.sku }]);
    }
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
