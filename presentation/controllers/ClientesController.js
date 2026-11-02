class ClientesController {
  constructor({ clienteService }) {
    this.clienteService = clienteService;
  }

  async crear(req, res, next) {
    try {
      const cliente = await this.clienteService.crear(req.body);
      return res.status(201).json(cliente);
    } catch (err) {
      next(err);
    }
  }

  async listar(req, res, next) {
    try {
      const clientes = await this.clienteService.listar();
      return res.json(clientes);
    } catch (err) {
      next(err);
    }
  }

  async obtener(req, res, next) {
    try {
      const cliente = await this.clienteService.obtener(Number(req.params.id));
      return res.json(cliente);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const cliente = await this.clienteService.actualizar(
        Number(req.params.id),
        req.body,
      );
      return res.json(cliente);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      await this.clienteService.eliminar(Number(req.params.id));
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClientesController;
