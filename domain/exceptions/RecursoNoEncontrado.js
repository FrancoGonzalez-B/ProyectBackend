const ErrorDeDominio = require('./ErrorDeDominio');

class RecursoNoEncontrado extends ErrorDeDominio {
  constructor(mensaje, detalles = []) {
    super(mensaje, 'RECURSO_NO_ENCONTRADO', detalles);
  }
}

module.exports = RecursoNoEncontrado;
