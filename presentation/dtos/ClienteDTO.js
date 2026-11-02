function validarClienteCrear(data) {
  const errores = [];
  if (!data.nombre || data.nombre.length < 2 || data.nombre.length > 100) {
    errores.push({ campo: 'nombre', mensaje: 'Nombre debe tener entre 2 y 100 caracteres' });
  }
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errores.push({ campo: 'email', mensaje: 'Email inválido' });
  }
  const telefonoRegex = /^\+?[0-9]{8,15}$/;
  if (!data.telefono || !telefonoRegex.test(data.telefono)) {
    errores.push({ campo: 'telefono', mensaje: 'Teléfono inválido (8 a 15 dígitos)' });
  }
  if (!data.direccion || data.direccion.length < 5 || data.direccion.length > 200) {
    errores.push({ campo: 'direccion', mensaje: 'Dirección debe tener entre 5 y 200 caracteres' });
  }
  return errores;
}

module.exports = { validarClienteCrear };
