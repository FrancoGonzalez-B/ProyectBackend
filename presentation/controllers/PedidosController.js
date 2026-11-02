class PedidosController {
  constructor({ pedidoService }) {
    this.pedidoService = pedidoService;
  }

  async crear(req, res, next) {
    try {
      if (req.usuario.role !== 'admin' && req.body.clienteId !== req.usuario.id)
        return res
          .status(403)
          .json({
            error: {
              code: 'FORBIDDEN',
              message: 'Solo puedes crear tus pedidos',
              details: [],
            },
          });
      const pedido = await this.pedidoService.crear(req.body);
      return res.status(201).json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async listar(req, res, next) {
    try {
      const filtros = { ...req.query };
      if (req.usuario.role !== 'admin') filtros.clienteId = req.usuario.id;
      const pedidos = await this.pedidoService.listar(filtros);
      return res.json(pedidos);
    } catch (err) {
      next(err);
    }
  }

  async obtener(req, res, next) {
    try {
      const pedido = await this.pedidoService.obtener(Number(req.params.id));
      if (req.usuario.role !== 'admin' && pedido.clienteId !== req.usuario.id)
        return res
          .status(403)
          .json({
            error: {
              code: 'FORBIDDEN',
              message: 'No puedes acceder a este pedido',
              details: [],
            },
          });
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      if (req.usuario.role !== 'admin')
        return res
          .status(403)
          .json({
            error: {
              code: 'FORBIDDEN',
              message: 'Operación de administrador',
              details: [],
            },
          });
      const pedido = await this.pedidoService.cambiarEstado(
        Number(req.params.id),
        req.body.estado,
      );
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async cancelar(req, res, next) {
    try {
      const existente = await this.pedidoService.obtener(Number(req.params.id));
      if (
        req.usuario.role !== 'admin' &&
        existente.clienteId !== req.usuario.id
      )
        return res
          .status(403)
          .json({
            error: {
              code: 'FORBIDDEN',
              message: 'No puedes cancelar este pedido',
              details: [],
            },
          });
      const pedido = await this.pedidoService.cancelar(Number(req.params.id));
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PedidosController;
