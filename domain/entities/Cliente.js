class Cliente {
  constructor({ id, nombre, email, telefono, direccion } = {}) {
    this.id = id || null;
    this.nombre = nombre;
    this.email = email;
    this.telefono = telefono;
    this.direccion = direccion;
  }
}

module.exports = Cliente;
