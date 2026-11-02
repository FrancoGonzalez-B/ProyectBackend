class VarianteService {
  constructor(repo) {
    this.repo = repo;
  }
  listar(id) {
    return this.repo.variantes(id);
  }
  crear(id, datos) {
    return this.repo.guardarVariante(id, null, datos);
  }
  actualizar(id, varianteId, datos) {
    return this.repo.guardarVariante(id, varianteId, datos);
  }
  eliminar(id, varianteId) {
    return this.repo.eliminarVariante(id, varianteId);
  }
}
module.exports = VarianteService;
