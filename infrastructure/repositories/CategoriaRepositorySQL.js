const db = require('../models');

class CategoriaRepositorySQL {
  async obtenerPorId(id) {
    return await db.Categoria.findByPk(id);
  }

  async obtenerPorNombre(nombre) {
    return await db.Categoria.findOne({ where: { name: nombre } });
  }

  async listar() {
    return await db.Categoria.findAll();
  }

  async crear(categoria) {
    return await db.Categoria.create({
      name: categoria.nombre,
      slug: categoria.nombre.toLowerCase().replace(/\s+/g, '-'),
      description: categoria.descripcion,
      isActive: categoria.activa,
    });
  }

  async actualizar(id, datos) {
    const categoria = await db.Categoria.findByPk(id);
    if (!categoria) return null;
    await categoria.update(datos);
    return categoria;
  }

  async eliminar(id) {
    return await db.Categoria.destroy({ where: { id } });
  }
}

module.exports = CategoriaRepositorySQL;
