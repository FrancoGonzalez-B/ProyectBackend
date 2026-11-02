const { validarPedidoCrear } = require('../dtos/PedidoDTO');
const { validarDTO } = require('../middlewares/validarDTO');

class PedidosController {
  constructor({ pedidoService }) {
    this.pedidoService = pedidoService;
  }

  async crear(req, res, next) {
    try {
      const errores = validarPedidoCrear(req.body);
      if (errores.length > 0) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados no cumplen las validaciones',
            details: errores,
          },
        });
      }
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
      const pedido = await this.pedidoService.obtener(parseInt(req.params.id));
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const pedido = await this.pedidoService.cambiarEstado(parseInt(req.params.id), req.body.estado);
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }

  async cancelar(req, res, next) {
    try {
      const pedido = await this.pedidoService.cancelar(parseInt(req.params.id));
      return res.json(pedido);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PedidosController;
