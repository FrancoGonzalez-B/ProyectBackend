const { DataTypes, literal } = require('sequelize');

function attributesFor(definition) {
  const attributes = Object.create(null);
  attributes.id = {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  };
  for (const c of definition.columnas) {
    const types = {
      texto: DataTypes.STRING(c.longitud || 150),
      entero: DataTypes.INTEGER,
      decimal: DataTypes.DECIMAL(14, 2),
      booleano: DataTypes.BOOLEAN,
      fecha: DataTypes.DATE,
    };
    attributes[c.nombre] = { type: types[c.tipo], allowNull: !c.obligatorio };
  }
  for (const name of ['createdAt', 'updatedAt'])
    attributes[name] = {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: literal('CURRENT_TIMESTAMP'),
    };
  return attributes;
}

function checksFor(definition) {
  return definition.columnas.map((c) => ({
    name: c.nombre,
    nullable: !c.obligatorio,
    pattern: {
      texto: `^VARCHAR\\(${c.longitud || 150}\\)$`,
      entero: '^INT(?:EGER)?(?:\\(\\d+\\))?$',
      decimal: '^DECIMAL\\(14,2\\)$',
      booleano: '^TINYINT\\(1\\)$',
      fecha: '^DATETIME$',
    }[c.tipo],
  }));
}

function schemaMatches(schema, checks) {
  return (
    Object.keys(schema).length === checks.length + 3 &&
    schema.id?.primaryKey === true &&
    schema.createdAt &&
    schema.updatedAt &&
    checks.every(
      (c) =>
        schema[c.name] &&
        new RegExp(c.pattern, 'i').test(schema[c.name].type) &&
        schema[c.name].allowNull === c.nullable,
    )
  );
}

function exportMigration(definition) {
  const expression = (c) =>
    ({
      texto: `S.STRING(${c.longitud || 150})`,
      entero: 'S.INTEGER',
      decimal: 'S.DECIMAL(14, 2)',
      booleano: 'S.BOOLEAN',
      fecha: 'S.DATE',
    })[c.tipo];
  const fields = definition.columnas.map(
    (c) =>
      `      ${JSON.stringify(c.nombre)}: { type: ${expression(c)}, allowNull: ${!c.obligatorio} }`,
  );
  const checks = JSON.stringify(checksFor(definition));
  // Fecha posterior a la migración del registro, incluso en instalaciones que aún están en noviembre 2.
  const timestamp = new Date(Math.max(Date.now(), Date.UTC(2026, 10, 3, 0, 3)))
    .toISOString()
    .replace(/\D/g, '')
    .slice(0, 14);
  const contenido = `'use strict';\nconst definition = ${JSON.stringify(definition, null, 2)};\nmodule.exports = {\n  async up(q, S) {\n    const tables = await q.showAllTables();\n    if (!tables.includes(definition.nombre)) await q.createTable(definition.nombre, {\n      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },\n${fields.join(',\n')},\n      createdAt: { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') },\n      updatedAt: { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }\n    });\n    const schema = await q.describeTable(definition.nombre);\n    const checks = ${checks};\n    if (!((${schemaMatches.toString()})(schema, checks))) throw new Error('La tabla existente tiene otra estructura');\n    const [rows] = await q.sequelize.query('SELECT nombre FROM tablas_personalizadas WHERE nombre=:nombre', { replacements: { nombre: definition.nombre } });\n    if (!rows.length) await q.bulkInsert('tablas_personalizadas', [{ nombre: definition.nombre, definicion: JSON.stringify(definition), estado: 'creada', creadorId: null, createdAt: new Date(), updatedAt: new Date() }]);\n  },\n  async down() { throw new Error('Revertir mediante una migración explícita con respaldo; esta tabla puede contener datos'); }\n};\n`;
  return { archivo: `${timestamp}-create-${definition.nombre}.js`, contenido };
}
module.exports = { attributesFor, checksFor, schemaMatches, exportMigration };
