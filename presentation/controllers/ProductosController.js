const { validarProductoCrear } = require('../dtos/ProductoDTO');
const { validarDTO } = require('../middlewares/validarDTO');

class ProductosController {
  constructor({ productoService }) {
    this.productoService = productoService;
  }

  async crear(req, res, next) {
    try {
      const errores = validarProductoCrear(req.body);
      if (errores.length > 0) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados no cumplen las validaciones',
            details: errores,
          },
        });
      }
      const producto = await this.productoService.crear(req.body);
      return res.status(201).json(producto);
    } catch (err) {
      next(err);
    }
  }

  async listar(req, res, next) {
    try {
      const resultado = await this.productoService.listar(req.query);
      return res.json(resultado);
    } catch (err) {
      next(err);
    }
  }

  async obtener(req, res, next) {
    try {
      const producto = await this.productoService.obtener(parseInt(req.params.id));
      return res.json(producto);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const errores = validarProductoCrear(req.body);
      if (errores.length > 0) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados no cumplen las validaciones',
            details: errores,
          },
        });
      }
      const producto = await this.productoService.actualizar(parseInt(req.params.id), req.body);
      return res.json(producto);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      await this.productoService.eliminar(parseInt(req.params.id));
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProductosController;
