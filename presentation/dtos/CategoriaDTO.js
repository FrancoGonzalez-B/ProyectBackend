function validarCategoriaCrear(data) {
  const errores = [];
  if (!data.nombre || data.nombre.length < 2 || data.nombre.length > 60) {
    errores.push({ campo: 'nombre', mensaje: 'Nombre debe tener entre 2 y 60 caracteres' });
  }
  if (data.descripcion && data.descripcion.length > 200) {
    errores.push({ campo: 'descripcion', mensaje: 'Descripción máxima 200 caracteres' });
  }
  return errores;
}

module.exports = { validarCategoriaCrear };
