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
}

module.exports = ClientesController;
