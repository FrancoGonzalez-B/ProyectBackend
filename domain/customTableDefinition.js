const ReglaDeNegocioViolada = require('./exceptions/ReglaDeNegocioViolada');
const PREFIX = 'personalizada_';
const IDENTIFIER = /^[a-z][a-z0-9_]{0,39}$/;
const TYPES = new Set(['texto', 'entero', 'decimal', 'booleano', 'fecha']);
const RESERVED = new Set([
  'id',
  'createdat',
  'updatedat',
  'constructor',
  'prototype',
  '__proto__',
]);
const isObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
function normalizarDefinicion(input) {
  const errors = [];
  const invalid = (campo, mensaje) => errors.push({ campo, mensaje });
  const unknownKeys = (obj, allowed, field) => {
    for (const key of Object.keys(obj))
      if (!allowed.includes(key))
        invalid(field ? `${field}.${key}` : key, 'Campo no permitido');
  };
  if (!isObject(input))
    throw new ReglaDeNegocioViolada('La definición de la tabla no es válida', [
      { campo: 'body', mensaje: 'Debe enviarse un objeto JSON' },
    ]);
  unknownKeys(input, ['nombre', 'columnas'], '');
  const suffix =
    typeof input.nombre === 'string' && input.nombre.startsWith(PREFIX)
      ? input.nombre.slice(PREFIX.length)
      : input.nombre;
  if (typeof suffix !== 'string' || !IDENTIFIER.test(suffix))
    invalid(
      'nombre',
      'Usa entre 1 y 40 letras minúsculas, números o guiones bajos; comienza con una letra',
    );
  const columns = [],
    seen = new Set();
  if (
    !Array.isArray(input.columnas) ||
    input.columnas.length < 1 ||
    input.columnas.length > 20
  )
    invalid(
      'columnas',
      'La tabla debe tener entre 1 y 20 columnas personalizadas',
    );
  else
    input.columnas.forEach((column, index) => {
      const field = `columnas[${index}]`;
      if (!isObject(column)) {
        invalid(field, 'Cada columna debe ser un objeto JSON');
        return;
      }
      unknownKeys(column, ['nombre', 'tipo', 'longitud', 'obligatorio'], field);
      const { nombre, tipo } = column;
      if (
        typeof nombre !== 'string' ||
        !IDENTIFIER.test(nombre) ||
        RESERVED.has(nombre.toLowerCase())
      )
        invalid(`${field}.nombre`, 'Nombre inválido o reservado');
      else if (seen.has(nombre))
        invalid(`${field}.nombre`, 'No se pueden repetir nombres de columnas');
      else seen.add(nombre);
      if (!TYPES.has(tipo))
        invalid(
          `${field}.tipo`,
          'Tipos permitidos: texto, entero, decimal, booleano y fecha',
        );
      const obligatorio =
        column.obligatorio === undefined ? false : column.obligatorio;
      if (typeof obligatorio !== 'boolean')
        invalid(`${field}.obligatorio`, 'Debe ser un valor booleano');
      const normalized = { nombre, tipo, obligatorio };
      if (tipo === 'texto') {
        const longitud = column.longitud === undefined ? 150 : column.longitud;
        if (!Number.isSafeInteger(longitud) || longitud < 1 || longitud > 500)
          invalid(
            `${field}.longitud`,
            'La longitud del texto debe ser un entero entre 1 y 500',
          );
        normalized.longitud = longitud;
      } else if (column.longitud !== undefined)
        invalid(
          `${field}.longitud`,
          'La longitud solo se permite en columnas de texto',
        );
      columns.push(normalized);
    });
  if (errors.length)
    throw new ReglaDeNegocioViolada(
      'La definición de la tabla no es válida',
      errors,
    );
  return { nombre: PREFIX + suffix, columnas: columns };
}
module.exports = { normalizarDefinicion };
