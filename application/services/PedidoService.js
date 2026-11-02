const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const ReglaDeNegocioViolada = require('../../domain/exceptions/ReglaDeNegocioViolada');

class PedidoService {
  constructor({ pedidoRepository, productoRepository, clienteRepository }) {
    this.pedidoRepository = pedidoRepository;
    this.productoRepository = productoRepository;
    this.clienteRepository = clienteRepository;
  }

  async crear({ clienteId, direccionEnvio, detalles }) {
    // Fase 1: Validar todo sin tocar nada
    const cliente = await this.clienteRepository.obtenerPorId(clienteId);
    if (!cliente) {
      throw new RecursoNoEncontrado('No existe un cliente con el ID indicado', [{ campo: 'clienteId', valor: clienteId }]);
    }

    const productos = {};
    const inexistentes = [];
    const sinStock = [];

    for (let i = 0; i < detalles.length; i++) {
      const producto = await this.productoRepository.obtenerPorId(detalles[i].productoId);
      if (!producto) {
        inexistentes.push({ campo: 'detalles[' + i + '].productoId', valor: detalles[i].productoId });
        continue;
      }
      productos[producto.id] = producto;
      if (!producto.tieneStockPara(detalles[i].cantidad)) {
        sinStock.push({
          productoId: producto.id,
          nombre: producto.nombre,
          stockDisponible: producto.stock,
          cantidadSolicitada: detalles[i].cantidad,
        });
      }
    }

    if (inexistentes.length > 0) {
      throw new RecursoNoEncontrado('Uno o más productos del pedido no existen', inexistentes);
    }
    if (sinStock.length > 0) {
      throw new ReglaDeNegocioViolada('No hay stock suficiente para uno o más productos', sinStock);
    }

    // Fase 2: Aplicar cambios
    const detalleObjetos = [];
    for (const d of detalles) {
      const producto = productos[d.productoId];
      producto.descontarStock(d.cantidad);
      await this.productoRepository.actualizar(producto.id, { stock: producto.stock, estado: producto.estado });
      detalleObjetos.push({
        productoId: producto.id,
        cantidad: d.cantidad,
        precioUnitario: producto.precio,
      });
    }

    const pedido = await this.pedidoRepository.crear({
      clienteId,
      direccionEnvio: direccionEnvio || cliente.direccion,
      detalles: detalleObjetos,
    });

    return pedido;
  }

  async listar({ clienteId, estado } = {}) {
    return await this.pedidoRepository.listar({ clienteId, estado });
  }

  async obtener(id) {
    const pedido = await this.pedidoRepository.obtenerPorId(id);
    if (!pedido) {
      throw new RecursoNoEncontrado('No existe un pedido con el ID solicitado', [{ campo: 'pedidoId', valor: id }]);
    }
    return pedido;
  }

  async cambiarEstado(id, nuevoEstado) {
    const pedido = await this.obtener(id);
    pedido.avanzarEstado(nuevoEstado);
    return await this.pedidoRepository.actualizar(id, { estado: pedido.estado });
  }

  async cancelar(id) {
    const pedido = await this.obtener(id);
    pedido.cancelar();
    for (const detalle of pedido.detalles) {
      const producto = await this.productoRepository.obtenerPorId(detalle.productoId);
      producto.reponerStock(detalle.cantidad);
      await this.productoRepository.actualizar(producto.id, { stock: producto.stock, estado: producto.estado });
    }
    return await this.pedidoRepository.actualizar(id, { estado: 'CANCELADO' });
  }
}

module.exports = PedidoService;
