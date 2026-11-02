const db = require('../models');

const mapCategoria = (categoria) => {
  if (!categoria) return null;
  const data = categoria.get ? categoria.get({ plain: true }) : categoria;
  return {
    id: data.id,
    nombre: data.name,
    descripcion: data.description,
    activa: data.isActive,
  };
};

class CategoriaRepositorySQL {
  async obtenerPorId(id) {
    return mapCategoria(await db.Categoria.findByPk(id));
  }

  async obtenerPorNombre(nombre) {
    const categoria = await db.Categoria.findOne({ where: { name: nombre } });
    return mapCategoria(categoria);
  }

  async listar() {
    return (await db.Categoria.findAll()).map(mapCategoria);
  }

  async crear(categoria) {
    const creada = await db.Categoria.create({
      name: categoria.nombre,
      slug: categoria.nombre.trim().toLowerCase().replace(/\s+/g, '-'),
      description: categoria.descripcion || null,
      isActive: categoria.activa !== false,
    });
    return mapCategoria(creada);
  }

  async actualizar(id, datos) {
    const categoria = await db.Categoria.findByPk(id);
    if (!categoria) return null;
    await categoria.update({
      name: datos.nombre,
      slug: datos.nombre.trim().toLowerCase().replace(/\s+/g, '-'),
      description: datos.descripcion || null,
      isActive: datos.activa !== false,
    });
    return mapCategoria(categoria);
  }

  async eliminar(id) {
    return db.Categoria.destroy({ where: { id } });
  }
}

module.exports = CategoriaRepositorySQL;
