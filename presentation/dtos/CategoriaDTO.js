function validarCategoriaCrear(data) {
  const errores = [];
  data = data && typeof data === 'object' ? data : {};
  if (typeof data.nombre !== 'string' || data.nombre.trim().length < 2 || data.nombre.trim().length > 60) {
    errores.push({ campo: 'nombre', mensaje: 'Nombre debe tener entre 2 y 60 caracteres' });
  }
  if (data.descripcion !== undefined &&
      (typeof data.descripcion !== 'string' || data.descripcion.length > 500)) {
    errores.push({ campo: 'descripcion', mensaje: 'Descripción máxima 500 caracteres' });
  }
  if (data.activa !== undefined && typeof data.activa !== 'boolean') {
    errores.push({ campo: 'activa', mensaje: 'El estado activo debe ser booleano' });
  }
  return errores;
}

module.exports = { validarCategoriaCrear };
