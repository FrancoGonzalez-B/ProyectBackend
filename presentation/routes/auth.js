const express = require('express');
const {
  hashPassword,
  verifyPassword,
} = require('../../infrastructure/security/credentials');
const {
  signToken,
  DEFAULT_TTL,
} = require('../../infrastructure/security/tokens');
const { validarClienteCrear } = require('../dtos/ClienteDTO');

const normalizar = (data) => ({
  ...data,
  nombre: typeof data?.nombre === 'string' ? data.nombre.trim() : data?.nombre,
  email:
    typeof data?.email === 'string'
      ? data.email.trim().toLowerCase()
      : data?.email,
  telefono:
    typeof data?.telefono === 'string' ? data.telefono.trim() : data?.telefono,
  direccion:
    typeof data?.direccion === 'string'
      ? data.direccion.trim()
      : data?.direccion,
});
const safeUser = (user) => ({
  id: user.id,
  nombre: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: user.role,
});

function crearRouterAuth({ usuarios, secret } = {}) {
  const router = express.Router();
  const attempts = new Map();
  const model = () =>
    usuarios || require('../../infrastructure/models').Usuario;
  const responseToken = (user) => ({
    token: signToken(user.id, {
      secret: secret === undefined ? process.env.AUTH_SECRET : secret,
    }),
    tipo: 'Bearer',
    expiraEn: DEFAULT_TTL,
    usuario: safeUser(user),
  });
  const limit = (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of attempts)
      if (entry.until <= now) attempts.delete(key);
    const key = req.ip || 'local';
    const entry = attempts.get(key) || {
      count: 0,
      until: now + 15 * 60 * 1000,
    };
    if (entry.count >= 30) {
      res.set(
        'Retry-After',
        String(Math.max(1, Math.ceil((entry.until - now) / 1000))),
      );
      return res
        .status(429)
        .json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiados intentos; intenta más tarde',
            details: [],
          },
        });
    }
    if (attempts.size >= 10000 && !attempts.has(key))
      attempts.delete(attempts.keys().next().value);
    entry.count++;
    attempts.set(key, entry);
    return next();
  };

  router.post('/registro', limit, async (req, res, next) => {
    try {
      const data = normalizar(req.body);
      const errores = validarClienteCrear(data);
      if (
        typeof data.password !== 'string' ||
        data.password.length < 10 ||
        data.password.length > 256
      )
        errores.push({
          campo: 'password',
          mensaje: 'La contraseña debe tener entre 10 y 256 caracteres',
        });
      if (errores.length)
        return res
          .status(422)
          .json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Datos de registro inválidos',
              details: errores,
            },
          });
      const parts = data.nombre.split(/\s+/);
      const usuario = await model().create({
        firstName: parts.shift(),
        lastName: parts.join(' '),
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        passwordHash: await hashPassword(data.password),
        role: 'customer',
      });
      return res.status(201).json(responseToken(usuario));
    } catch (error) {
      return next(error);
    }
  });

  router.post('/login', limit, async (req, res, next) => {
    try {
      const email =
        typeof req.body?.email === 'string'
          ? req.body.email.trim().toLowerCase()
          : '';
      const password = req.body?.password;
      if (
        !email ||
        email.length > 120 ||
        typeof password !== 'string' ||
        password.length > 256
      )
        return res
          .status(401)
          .json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Credenciales inválidas',
              details: [],
            },
          });
      const usuario = await model().findOne({ where: { email } });
      const valid = await verifyPassword(password, usuario?.passwordHash);
      if (!valid || !usuario)
        return res
          .status(401)
          .json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Credenciales inválidas',
              details: [],
            },
          });
      return res.json(responseToken(usuario));
    } catch (error) {
      return next(error);
    }
  });
  return router;
}

module.exports = { crearRouterAuth };
