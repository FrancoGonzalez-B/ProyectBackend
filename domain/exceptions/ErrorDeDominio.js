class ErrorDeDominio extends Error {
  constructor(mensaje, codigo = 'DOMAIN_ERROR', detalles = []) {
    super(mensaje);
    this.name = 'ErrorDeDominio';
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

module.exports = ErrorDeDominio;
