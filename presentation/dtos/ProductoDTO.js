function validarProductoCrear(data) {
  const errores = [];
  if (!data.nombre || data.nombre.length < 2 || data.nombre.length > 100) {
    errores.push({ campo: 'nombre', mensaje: 'Nombre debe tener entre 2 y 100 caracteres' });
  }
  if (!data.precio || data.precio <= 0 || data.precio > 10000000) {
    errores.push({ campo: 'precio', mensaje: 'Precio debe ser mayor a 0 y máximo 10.000.000' });
  }
  if (data.stock == null || data.stock < 0 || data.stock > 100000) {
    errores.push({ campo: 'stock', mensaje: 'Stock debe estar entre 0 y 100.000' });
  }
  const skuRegex = /^[A-Z0-9][A-Z0-9-]{2,19}$/;
  if (!data.sku || !skuRegex.test(data.sku)) {
    errores.push({ campo: 'sku', mensaje: 'SKU inválido. Ejemplo: LECH-001' });
  }
  const estadosValidos = ['DISPONIBLE', 'AGOTADO', 'DESCONTINUADO'];
  if (!estadosValidos.includes(data.estado)) {
    errores.push({ campo: 'estado', mensaje: 'Estado no permitido' });
  }
  if (!data.categoriaId || data.categoriaId <= 0) {
    errores.push({ campo: 'categoriaId', mensaje: 'Debe indicar una categoría existente' });
  }
  return errores;
}

module.exports = { validarProductoCrear };
