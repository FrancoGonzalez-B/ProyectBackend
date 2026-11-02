const sequelize = require('../../config/database');
const Table = require('../models/TablaPersonalizada');
const {
  attributesFor,
  checksFor,
  schemaMatches,
  exportMigration,
} = require('../customTableSchema');
const { normalizarDefinicion } = require('../../domain/customTableDefinition');
const ConflictoDeEstado = require('../../domain/exceptions/ConflictoDeEstado');
const RecursoNoEncontrado = require('../../domain/exceptions/RecursoNoEncontrado');
const plain = (row) => (row ? row.get({ plain: true }) : null);
class TablaRepositorySQL {
  async crear(definition, creator) {
    const q = sequelize.getQueryInterface();
    if ((await q.showAllTables()).includes(definition.nombre))
      throw new ConflictoDeEstado('La tabla ya existe; elige otro nombre');
    // Reserva única antes del DDL: dos solicitudes no pueden apropiarse del mismo nombre.
    const row = await Table.create({
      nombre: definition.nombre,
      definicion: definition,
      estado: 'pendiente',
      creadorId: creator,
    });
    try {
      // CREATE TABLE no se envuelve en una transacción de negocio: MySQL hace commit implícito.
      await q.createTable(definition.nombre, attributesFor(definition));
      const schema = await q.describeTable(definition.nombre);
      if (!schemaMatches(schema, checksFor(definition)))
        throw new Error('CUSTOM_SCHEMA_MISMATCH');
      await row.update({ estado: 'creada', error: null });
      return plain(row);
    } catch (error) {
      await row
        .update({
          estado: 'error',
          error: String(
            error.original?.code || error.code || 'CREATE_FAILED',
          ).slice(0, 80),
        })
        .catch(() => {});
      // Se conserva la evidencia del intento; nunca se borra una tabla como compensación automática.
      if (error.original?.code === 'ER_TABLE_EXISTS_ERROR')
        throw new ConflictoDeEstado('La tabla ya existe');
      throw error;
    }
  }
  async listar() {
    return (await Table.findAll({ order: [['createdAt', 'DESC']] })).map(plain);
  }
  async obtener(nombre) {
    const row = await Table.findByPk(nombre);
    if (!row)
      throw new RecursoNoEncontrado(
        'No existe una definición registrada con ese nombre',
      );
    return plain(row);
  }
  async migracion(nombre) {
    const row = await this.obtener(nombre);
    if (row.estado !== 'creada')
      throw new ConflictoDeEstado(
        'La tabla todavía no fue creada correctamente',
      );
    return exportMigration(
      normalizarDefinicion(
        typeof row.definicion === 'string'
          ? JSON.parse(row.definicion)
          : row.definicion,
      ),
    );
  }
}
module.exports = TablaRepositorySQL;
