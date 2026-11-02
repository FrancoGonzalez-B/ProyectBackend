const Cliente = require('../../domain/entities/Cliente');
const db = require('../models');

const mapCliente = (cliente) => {
  if (!cliente) return null;
  const data = cliente.get ? cliente.get({ plain: true }) : cliente;
  return new Cliente({
    id: data.id,
    nombre: [data.firstName, data.lastName].filter(Boolean).join(' '),
    email: data.email,
    telefono: data.telefono,
    direccion: data.direccion,
  });
};

class ClienteRepositorySQL {
  async obtenerPorId(id) {
    return mapCliente(await db.Usuario.findByPk(id));
  }

  async obtenerPorEmail(email) {
    return mapCliente(await db.Usuario.findOne({ where: { email } }));
  }

  async listar() {
    return (await db.Usuario.findAll()).map(mapCliente);
  }

  async crear(cliente) {
    const nombrePartes = cliente.nombre.trim().split(/\s+/);
    const creado = await db.Usuario.create({
      firstName: nombrePartes.shift(),
      lastName: nombrePartes.join(' '),
      email: cliente.email,
      passwordHash: null,
      role: 'customer',
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    });
    return mapCliente(creado);
  }
}

module.exports = ClienteRepositorySQL;
