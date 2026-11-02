function validarPedidoCrear(data) {
  const errores = [];
  data = data && typeof data === 'object' ? data : {};
  if (!Number.isSafeInteger(data.clienteId) || data.clienteId <= 0) {
    errores.push({ campo: 'clienteId', mensaje: 'Cliente requerido' });
  }
  if (!Array.isArray(data.detalles) || data.detalles.length < 1 || data.detalles.length > 50) {
    errores.push({ campo: 'detalles', mensaje: 'Debe haber entre 1 y 50 detalles' });
  } else {
    const ids = data.detalles.map(d => d && d.productoId);
    if (new Set(ids).size !== ids.length) {
      errores.push({ campo: 'detalles', mensaje: 'No se puede repetir un producto en el mismo pedido' });
    }
    for (const d of data.detalles) {
      if (!d) {
        errores.push({ campo: 'detalles[].productoId', mensaje: 'Producto requerido' });
        continue;
      }
      if (!Number.isSafeInteger(d.productoId) || d.productoId <= 0) {
        errores.push({ campo: 'detalles[].productoId', mensaje: 'Producto requerido' });
      }
      if (!Number.isInteger(d.cantidad) || d.cantidad <= 0 || d.cantidad > 1000) {
        errores.push({ campo: 'detalles[].cantidad', mensaje: 'Cantidad inválida' });
      }
    }
  }
  if (data.direccionEnvio !== undefined &&
      (typeof data.direccionEnvio !== 'string' || data.direccionEnvio.trim().length > 500)) {
    errores.push({ campo: 'direccionEnvio', mensaje: 'La dirección no puede superar 500 caracteres' });
  }
  return errores;
}

function validarCambioEstado(data) {
  const estadosValidos = ['CONFIRMADO', 'ENVIADO', 'ENTREGADO'];
  if (!data || !estadosValidos.includes(data.estado)) {
    return [{ campo: 'estado', mensaje: 'El nuevo estado del pedido no es válido' }];
  }
  return [];
}

module.exports = { validarPedidoCrear, validarCambioEstado };
