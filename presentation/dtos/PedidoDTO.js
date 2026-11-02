function validarPedidoCrear(data) {
  const errores = [];
  if (!data.clienteId || data.clienteId <= 0) {
    errores.push({ campo: 'clienteId', mensaje: 'Cliente requerido' });
  }
  if (!Array.isArray(data.detalles) || data.detalles.length < 1 || data.detalles.length > 50) {
    errores.push({ campo: 'detalles', mensaje: 'Debe haber entre 1 y 50 detalles' });
  } else {
    const ids = data.detalles.map(d => d.productoId);
    if (new Set(ids).size !== ids.length) {
      errores.push({ campo: 'detalles', mensaje: 'No se puede repetir un producto en el mismo pedido' });
    }
    for (const d of data.detalles) {
      if (!d.productoId || d.productoId <= 0) {
        errores.push({ campo: 'detalles[].productoId', mensaje: 'Producto requerido' });
      }
      if (!d.cantidad || d.cantidad <= 0 || d.cantidad > 1000) {
        errores.push({ campo: 'detalles[].cantidad', mensaje: 'Cantidad inválida' });
      }
    }
  }
  return errores;
}

module.exports = { validarPedidoCrear };
