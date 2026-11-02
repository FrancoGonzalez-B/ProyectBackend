const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const {
  hashPassword,
  verifyPassword,
} = require('../infrastructure/security/credentials');
const {
  signToken,
  verifyToken,
  validarConfiguracionAuth,
} = require('../infrastructure/security/tokens');
const {
  crearAutenticacion,
  soloAdmin,
  exigirPropietario,
} = require('../presentation/middlewares/auth');
const { crearRouterAuth } = require('../presentation/routes/auth');
const SECRET = 'unit-test-secret-with-more-than-thirty-two-bytes';

test('password hashing uses random salt and verifies without storing plaintext', async () => {
  const first = await hashPassword('Password-12345');
  const second = await hashPassword('Password-12345');
  assert.notEqual(first, second);
  assert.equal(first.includes('Password-12345'), false);
  assert.equal(await verifyPassword('Password-12345', first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
  assert.equal(await verifyPassword('anything', null), false);
});

test('tokens reject tampering, expiration and weak secrets', () => {
  const token = signToken(8, { secret: SECRET, now: 1000000, ttl: 60 });
  assert.equal(verifyToken(token, { secret: SECRET, now: 1010000 }).sub, 8);
  assert.equal(verifyToken(token, { secret: SECRET, now: 1060000 }), null);
  assert.equal(
    verifyToken(token + 'a', { secret: SECRET, now: 1010000 }),
    null,
  );
  assert.equal(
    verifyToken(token, {
      secret: 'another-long-secret-over-thirty-two-bytes',
      now: 1010000,
    }),
    null,
  );
  assert.throws(() => validarConfiguracionAuth('weak'));
});

test('auth checks current account, roles and ownership', async () => {
  const users = {
    findByPk: async (id) => (id === 4 ? { id, role: 'customer' } : null),
  };
  const middleware = crearAutenticacion({ usuarios: users, secret: SECRET });
  const res = {
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
  const req = {
    headers: { authorization: 'Bearer ' + signToken(4, { secret: SECRET }) },
    params: { id: '4' },
  };
  let calls = 0;
  await middleware(req, res, () => calls++);
  assert.equal(calls, 1);
  exigirPropietario('id')(req, res, () => calls++);
  assert.equal(calls, 2);
  req.params.id = '5';
  exigirPropietario('id')(req, res, () => calls++);
  assert.equal(res.statusCode, 403);
  soloAdmin(req, res, () => calls++);
  assert.equal(res.statusCode, 403);
  await middleware({ headers: {} }, res, () => calls++);
  assert.equal(res.statusCode, 401);
  await middleware(
    {
      headers: { authorization: 'Bearer ' + signToken(10, { secret: SECRET }) },
    },
    res,
    () => calls++,
  );
  assert.equal(res.statusCode, 401);
});

test('registration cannot escalate role and login never returns hashes', async () => {
  const stored = [];
  const users = {
    create: async (data) => {
      const user = { id: 1, ...data };
      stored.push(user);
      return user;
    },
    findOne: async ({ where }) =>
      stored.find((user) => user.email === where.email),
  };
  const app = express();
  app.use(express.json());
  app.use('/auth', crearRouterAuth({ usuarios: users, secret: SECRET }));
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}/auth`;
    const post = (route, data) =>
      fetch(base + route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
    const registration = await post('/registro', {
      nombre: 'Cliente Prueba',
      email: 'client@example.test',
      telefono: '+56912345678',
      direccion: 'Calle de prueba 123',
      password: 'Password-12345',
      role: 'admin',
    });
    assert.equal(registration.status, 201);
    const json = await registration.json();
    assert.equal(json.usuario.role, 'customer');
    assert.equal(json.usuario.passwordHash, undefined);
    assert.equal(stored[0].role, 'customer');
    assert.notEqual(stored[0].passwordHash, 'Password-12345');
    const login = await post('/login', {
      email: 'client@example.test',
      password: 'Password-12345',
    });
    assert.equal(login.status, 200);
    assert.ok((await login.json()).token);
    const absent = await post('/login', {
      email: 'absent@example.test',
      password: 'Password-12345',
    });
    const bad = await post('/login', {
      email: 'client@example.test',
      password: 'bad',
    });
    assert.equal(absent.status, 401);
    assert.deepEqual(await absent.json(), await bad.json());
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
