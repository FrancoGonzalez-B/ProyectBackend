const { validarCategoriaCrear } = require('../dtos/CategoriaDTO');
const { validarDTO } = require('../middlewares/validarDTO');

class CategoriasController {
  constructor({ categoriaService }) {
    this.categoriaService = categoriaService;
  }

  async crear(req, res, next) {
    try {
      const errores = validarCategoriaCrear(req.body);
      if (errores.length > 0) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados no cumplen las validaciones',
            details: errores,
          },
        });
      }
      const categoria = await this.categoriaService.crear(req.body);
      return res.status(201).json(categoria);
    } catch (err) {
      next(err);
    }
  }

  async listar(req, res, next) {
    try {
      const categorias = await this.categoriaService.listar();
      return res.json(categorias);
    } catch (err) {
      next(err);
    }
  }

  async obtener(req, res, next) {
    try {
      const categoria = await this.categoriaService.obtener(parseInt(req.params.id));
      return res.json(categoria);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const errores = validarCategoriaCrear(req.body);
      if (errores.length > 0) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados no cumplen las validaciones',
            details: errores,
          },
        });
      }
      const categoria = await this.categoriaService.actualizar(parseInt(req.params.id), req.body);
      return res.json(categoria);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      await this.categoriaService.eliminar(parseInt(req.params.id));
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CategoriasController;
