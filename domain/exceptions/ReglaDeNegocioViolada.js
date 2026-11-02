const ErrorDeDominio = require('./ErrorDeDominio');

class ReglaDeNegocioViolada extends ErrorDeDominio {
  constructor(mensaje, detalles = []) {
    super(mensaje, 'REGLA_NEGOCIO_VIOLADA', detalles);
  }
}

module.exports = ReglaDeNegocioViolada;
