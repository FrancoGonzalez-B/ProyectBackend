class Categoria {
  constructor({ id, nombre, descripcion, activa, fechaCreacion } = {}) {
    this.id = id || null;
    this.nombre = nombre;
    this.descripcion = descripcion || null;
    this.activa = activa !== undefined ? activa : true;
    this.fechaCreacion = fechaCreacion || new Date();
  }
}

module.exports = Categoria;
