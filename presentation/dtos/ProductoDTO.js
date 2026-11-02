function validarProductoCrear(data) {
  const errores = [];
  data = data && typeof data === 'object' ? data : {};
  if (
    typeof data.nombre !== 'string' ||
    data.nombre.trim().length < 2 ||
    data.nombre.trim().length > 150
  ) {
    errores.push({
      campo: 'nombre',
      mensaje: 'Nombre debe tener entre 2 y 150 caracteres',
    });
  }
  if (
    !Number.isFinite(data.precio) ||
    data.precio <= 0 ||
    data.precio > 10000000 ||
    Number(data.precio.toFixed(2)) !== data.precio
  ) {
    errores.push({
      campo: 'precio',
      mensaje:
        'Precio debe ser mayor a 0, tener máximo 2 decimales y no superar 10.000.000',
    });
  }
  if (
    !Number.isSafeInteger(data.stock) ||
    data.stock < 0 ||
    data.stock > 100000
  ) {
    errores.push({
      campo: 'stock',
      mensaje: 'Stock debe estar entre 0 y 100.000',
    });
  }
  const skuRegex = /^[A-Z0-9][A-Z0-9-]{2,19}$/;
  if (typeof data.sku !== 'string' || !skuRegex.test(data.sku)) {
    errores.push({ campo: 'sku', mensaje: 'SKU inválido. Ejemplo: LECH-001' });
  }
  const estadosValidos = ['DISPONIBLE', 'AGOTADO', 'DESCONTINUADO'];
  if (
    !estadosValidos.includes(data.estado) ||
    (data.estado === 'AGOTADO' && data.stock !== 0) ||
    (data.estado === 'DISPONIBLE' && data.stock === 0)
  ) {
    errores.push({ campo: 'estado', mensaje: 'Estado no permitido' });
  }
  if (!Number.isSafeInteger(data.categoriaId) || data.categoriaId <= 0) {
    errores.push({
      campo: 'categoriaId',
      mensaje: 'Debe indicar una categoría existente',
    });
  }
  if (
    data.descripcion !== undefined &&
    (typeof data.descripcion !== 'string' ||
      Buffer.byteLength(data.descripcion, 'utf8') > 65535)
  ) {
    errores.push({
      campo: 'descripcion',
      mensaje: 'La descripción supera el máximo permitido',
    });
  }
  return errores;
}

module.exports = { validarProductoCrear };
