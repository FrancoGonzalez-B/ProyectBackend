const db = require('../models');

class ClienteRepositorySQL {
  async obtenerPorId(id) {
    return await db.Usuario.findByPk(id);
  }

  async obtenerPorEmail(email) {
    return await db.Usuario.findOne({ where: { email } });
  }

  async listar() {
    return await db.Usuario.findAll();
  }

  async crear(cliente) {
    const nombrePartes = cliente.nombre.split(' ');
    return await db.Usuario.create({
      firstName: nombrePartes[0],
      lastName: nombrePartes.slice(1).join(' ') || '',
      email: cliente.email,
      passwordHash: '',
      role: 'customer',
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    });
  }

  async actualizar(id, datos) {
    const cliente = await db.Usuario.findByPk(id);
    if (!cliente) return null;
    await cliente.update(datos);
    return cliente;
  }

  async eliminar(id) {
    return await db.Usuario.destroy({ where: { id } });
  }
}

module.exports = ClienteRepositorySQL;
