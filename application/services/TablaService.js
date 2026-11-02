const { normalizarDefinicion } = require('../../domain/customTableDefinition');
class TablaService {
  constructor(repo) {
    this.repo = repo;
  }
  crear(body, actor) {
    return this.repo.crear(normalizarDefinicion(body), actor);
  }
  listar() {
    return this.repo.listar();
  }
  migracion(nombre) {
    return this.repo.migracion(nombre);
  }
}
module.exports = TablaService;
