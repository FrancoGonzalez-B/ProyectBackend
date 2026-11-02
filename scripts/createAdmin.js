require('dotenv').config({ quiet: true });
const { hashPassword } = require('../infrastructure/security/credentials');
const { validarClienteCrear } = require('../presentation/dtos/ClienteDTO');

async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const data = {
    nombre: process.env.ADMIN_NAME || 'Administrador Tienda',
    email,
    telefono: process.env.ADMIN_PHONE || '+56900000000',
    direccion: process.env.ADMIN_ADDRESS || 'Administración local',
  };
  if (
    validarClienteCrear(data).length ||
    typeof password !== 'string' ||
    password.length < 10 ||
    password.length > 256
  )
    throw new Error(
      'Configura ADMIN_EMAIL válido y ADMIN_PASSWORD de entre 10 y 256 caracteres',
    );
  const db = require('../infrastructure/models');
  try {
    await db.sequelize.authenticate();
    if (await db.Usuario.findOne({ where: { email } }))
      throw new Error(
        'La cuenta ya existe; no se modificó su rol ni contraseña',
      );
    const parts = data.nombre.trim().split(/\s+/);
    await db.Usuario.create({
      firstName: parts.shift(),
      lastName: parts.join(' '),
      email,
      telefono: data.telefono,
      direccion: data.direccion,
      passwordHash: await hashPassword(password),
      role: 'admin',
    });
    console.log(
      'Cuenta administradora creada. Usa /auth/login para iniciar sesión.',
    );
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module)
  createAdmin().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { createAdmin };
