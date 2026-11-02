const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizarDefinicion } = require('../domain/customTableDefinition');
const body = (changes = {}) => ({
  nombre: 'prueba',
  columnas: [{ nombre: 'titulo', tipo: 'texto' }],
  ...changes,
});
const rejects = (value) =>
  assert.throws(
    () => normalizarDefinicion(value),
    (e) =>
      e.name === 'ErrorDeDominio' &&
      e.codigo === 'REGLA_NEGOCIO_VIOLADA' &&
      e.detalles.length > 0,
  );
test('normaliza prefijo y valores por defecto sin mutar la entrada', () => {
  const input = body(),
    normalized = normalizarDefinicion(input);
  assert.deepEqual(normalized, {
    nombre: 'personalizada_prueba',
    columnas: [
      { nombre: 'titulo', tipo: 'texto', obligatorio: false, longitud: 150 },
    ],
  });
  assert.equal(input.nombre, 'prueba');
  assert.equal(input.columnas[0].longitud, undefined);
  assert.deepEqual(normalizarDefinicion(normalized), normalized);
});
test('admite solo los cinco tipos controlados', () => {
  const columns = ['texto', 'entero', 'decimal', 'booleano', 'fecha'].map(
    (tipo, i) => ({ nombre: 'campo' + i, tipo, obligatorio: true }),
  );
  const value = normalizarDefinicion(body({ columnas: columns }));
  assert.equal(value.columnas.length, 5);
  assert.equal(value.columnas[0].longitud, 150);
  assert.equal(Object.hasOwn(value.columnas[1], 'longitud'), false);
  rejects(
    body({
      columnas: [{ nombre: 'campo', tipo: 'VARCHAR(10); DROP TABLE users;' }],
    }),
  );
});
test('rechaza identificadores SQL y nombres reservados o duplicados', () => {
  for (const nombre of [
    'users;DROP TABLE users',
    'db.tabla',
    'x`',
    '_privada',
    'Mayuscula',
    '',
    'x'.repeat(41),
  ])
    rejects(body({ nombre }));
  for (const nombre of [
    'id',
    'createdat',
    'createdAt',
    'updatedat',
    'constructor',
    'prototype',
    '__proto__',
    'dato;DROP',
  ])
    rejects(body({ columnas: [{ nombre, tipo: 'texto' }] }));
  rejects(
    body({
      columnas: [
        { nombre: 'dato', tipo: 'entero' },
        { nombre: 'dato', tipo: 'texto' },
      ],
    }),
  );
});
test('limita cantidad de columnas y longitud textual', () => {
  rejects(body({ columnas: [] }));
  rejects(
    body({
      columnas: Array.from({ length: 21 }, (_, i) => ({
        nombre: 'campo' + i,
        tipo: 'entero',
      })),
    }),
  );
  assert.equal(
    normalizarDefinicion(
      body({
        columnas: Array.from({ length: 20 }, (_, i) => ({
          nombre: 'campo' + i,
          tipo: 'entero',
        })),
      }),
    ).columnas.length,
    20,
  );
  for (const longitud of [
    0,
    501,
    1.5,
    Infinity,
    Number.MAX_SAFE_INTEGER,
    '150',
    null,
  ])
    rejects(body({ columnas: [{ nombre: 'campo', tipo: 'texto', longitud }] }));
  for (const longitud of [1, 500])
    assert.equal(
      normalizarDefinicion(
        body({ columnas: [{ nombre: 'campo', tipo: 'texto', longitud }] }),
      ).columnas[0].longitud,
      longitud,
    );
});
test('rechaza configuración fuera del contrato y obligatoriedad no booleana', () => {
  rejects(body({ sql: 'DROP TABLE users' }));
  rejects(
    body({ columnas: [{ nombre: 'campo', tipo: 'texto', default: 'NOW()' }] }),
  );
  rejects(
    body({ columnas: [{ nombre: 'campo', tipo: 'entero', longitud: 150 }] }),
  );
  for (const obligatorio of [0, 1, 'true', null, {}])
    rejects(
      body({ columnas: [{ nombre: 'campo', tipo: 'texto', obligatorio }] }),
    );
  rejects(
    JSON.parse(
      '{"nombre":"prueba","columnas":[{"nombre":"campo","tipo":"texto"}],"__proto__":{}}',
    ),
  );
});
test('entradas JSON incompletas o mal formadas generan errores de dominio', () => {
  for (const input of [
    null,
    [],
    undefined,
    'texto',
    {},
    body({ columnas: [null] }),
    body({ columnas: [[]] }),
  ])
    rejects(input);
});
