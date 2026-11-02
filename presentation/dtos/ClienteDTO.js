function validarClienteCrear(data) {
  const errores = [];
  data = data && typeof data === 'object' ? data : {};
  if (
    typeof data.nombre !== 'string' ||
    data.nombre.trim().length < 2 ||
    data.nombre.trim().length > 100
  ) {
    errores.push({
      campo: 'nombre',
      mensaje: 'Nombre debe tener entre 2 y 100 caracteres',
    });
  } else {
    const partesNombre = data.nombre.trim().split(/\s+/);
    if (
      partesNombre[0].length > 60 ||
      partesNombre.slice(1).join(' ').length > 60
    ) {
      errores.push({
        campo: 'nombre',
        mensaje:
          'El nombre y apellido no pueden superar 60 caracteres cada uno',
      });
    }
  }
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (
    typeof data.email !== 'string' ||
    data.email.trim().length > 120 ||
    !emailRegex.test(data.email.trim())
  ) {
    errores.push({
      campo: 'email',
      mensaje: 'Email inválido o mayor a 120 caracteres',
    });
  }
  const telefonoRegex = /^\+?[0-9]{8,15}$/;
  if (
    typeof data.telefono !== 'string' ||
    !telefonoRegex.test(data.telefono.trim())
  ) {
    errores.push({
      campo: 'telefono',
      mensaje: 'Teléfono inválido (8 a 15 dígitos)',
    });
  }
  if (
    typeof data.direccion !== 'string' ||
    data.direccion.trim().length < 5 ||
    data.direccion.trim().length > 500
  ) {
    errores.push({
      campo: 'direccion',
      mensaje: 'Dirección debe tener entre 5 y 500 caracteres',
    });
  }
  return errores;
}

module.exports = { validarClienteCrear };
