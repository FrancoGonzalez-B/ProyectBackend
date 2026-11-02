class PedidosController {
  constructor({ pedidoService }) {
    this.pedidoService = pedidoService;
  }

  async crear(req, res, next) {
    try {
      const pedido = await this.pedidoService.crear(req.body);
      return res.status(201).json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async listar(req, res, next) {
    try {
      const pedidos = await this.pedidoService.listar(req.query);
      return res.json(pedidos);
    } catch (err) {
      next(err);
    }
  }

  async obtener(req, res, next) {
    try {
      const pedido = await this.pedidoService.obtener(Number(req.params.id));
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const pedido = await this.pedidoService.cambiarEstado(Number(req.params.id), req.body.estado);
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async cancelar(req, res, next) {
    try {
      const pedido = await this.pedidoService.cancelar(Number(req.params.id));
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PedidosController;
