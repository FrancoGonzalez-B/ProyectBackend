const {
  randomBytes,
  scrypt: callback,
  timingSafeEqual,
} = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(callback);
const PARAMETERS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

async function hashPassword(password) {
  if (
    typeof password !== 'string' ||
    password.length < 10 ||
    password.length > 256
  )
    throw new Error('La contraseña debe tener entre 10 y 256 caracteres');
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, PARAMETERS);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const valid =
    typeof stored === 'string' &&
    /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored);
  const parts = valid
    ? stored.split('$')
    : ['scrypt', '00'.repeat(16), '00'.repeat(64)];
  const key = await scrypt(
    typeof password === 'string' ? password.slice(0, 256) : '',
    Buffer.from(parts[1], 'hex'),
    64,
    PARAMETERS,
  );
  return timingSafeEqual(key, Buffer.from(parts[2], 'hex')) && valid;
}

module.exports = { hashPassword, verifyPassword };
