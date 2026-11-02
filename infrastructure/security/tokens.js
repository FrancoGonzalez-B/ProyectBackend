const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');
const DEFAULT_TTL = 3600;

function validarConfiguracionAuth(secret = process.env.AUTH_SECRET) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32)
    throw new Error(
      'Configura AUTH_SECRET con un secreto aleatorio de al menos 32 bytes',
    );
  return secret;
}

function signToken(
  userId,
  {
    secret = process.env.AUTH_SECRET,
    now = Date.now(),
    ttl = DEFAULT_TTL,
  } = {},
) {
  validarConfiguracionAuth(secret);
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(ttl) ||
    ttl < 1 ||
    ttl > 86400
  )
    throw new Error('Parámetros de token inválidos');
  const iat = Math.floor(now / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      typ: 'access',
      iat,
      exp: iat + ttl,
      jti: randomBytes(16).toString('hex'),
    }),
  ).toString('base64url');
  return (
    payload + '.' + createHmac('sha256', secret).update(payload).digest('hex')
  );
}

function verifyToken(
  token,
  { secret = process.env.AUTH_SECRET, now = Date.now() } = {},
) {
  validarConfiguracionAuth(secret);
  if (typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.');
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[a-f0-9]{64}$/.test(parts[1])
  )
    return null;
  if (
    !timingSafeEqual(
      createHmac('sha256', secret).update(parts[0]).digest(),
      Buffer.from(parts[1], 'hex'),
    )
  )
    return null;
  try {
    const data = JSON.parse(
      Buffer.from(parts[0], 'base64url').toString('utf8'),
    );
    const seconds = Math.floor(now / 1000);
    if (
      data.typ !== 'access' ||
      !Number.isSafeInteger(data.sub) ||
      data.sub <= 0 ||
      !Number.isSafeInteger(data.iat) ||
      !Number.isSafeInteger(data.exp) ||
      data.exp <= seconds ||
      data.iat > seconds + 30 ||
      data.exp <= data.iat ||
      data.exp - data.iat > 86400
    )
      return null;
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  DEFAULT_TTL,
  validarConfiguracionAuth,
  signToken,
  verifyToken,
};
