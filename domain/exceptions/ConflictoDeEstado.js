const ErrorDeDominio = require('./ErrorDeDominio');

class ConflictoDeEstado extends ErrorDeDominio {
  constructor(mensaje, detalles = []) {
    super(mensaje, 'CONFLICTO_ESTADO', detalles);
  }
}

module.exports = ConflictoDeEstado;
