class CategoriasController {
  constructor({ categoriaService }) {
    this.categoriaService = categoriaService;
  }

  async crear(req, res, next) {
    try {
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
      const categoria = await this.categoriaService.obtener(Number(req.params.id));
      return res.json(categoria);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const categoria = await this.categoriaService.actualizar(Number(req.params.id), req.body);
      return res.json(categoria);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      await this.categoriaService.eliminar(Number(req.params.id));
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CategoriasController;
