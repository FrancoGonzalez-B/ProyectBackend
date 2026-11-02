const assert = require('node:assert/strict');
const test = require('node:test');
const { validarClienteCrear } = require('../presentation/dtos/ClienteDTO');
const { validarPedidoCrear } = require('../presentation/dtos/PedidoDTO');
const { validarProductoCrear } = require('../presentation/dtos/ProductoDTO');
const ProductoService = require('../application/services/ProductoService');
const errorHandler = require('../presentation/errorHandlers');

test('long email and blank shipping address are rejected before persistence', () => {
  const client = {
    nombre: 'Ana Perez',
    email: 'a'.repeat(60) + '@' + 'b'.repeat(40) + '.example.test',
    telefono: '+56912345678',
    direccion: 'Calle uno 123',
  };
  client.email += 'x'.repeat(20);
  assert.ok(validarClienteCrear(client).some((e) => e.campo === 'email'));
  assert.ok(
    validarPedidoCrear({
      clienteId: 1,
      direccionEnvio: '   ',
      detalles: [{ productoId: 1, cantidad: 1 }],
    }).some((e) => e.campo === 'direccionEnvio'),
  );
});

test('different variants of the same product can be ordered, duplicate variant cannot', () => {
  const details = [
    { productoId: 1, varianteId: 2, cantidad: 1 },
    { productoId: 1, varianteId: 3, cantidad: 1 },
  ];
  assert.deepEqual(validarPedidoCrear({ clienteId: 1, detalles: details }), []);
  assert.ok(
    validarPedidoCrear({
      clienteId: 1,
      detalles: [details[0], details[0]],
    }).some((e) => e.campo === 'detalles'),
  );
  assert.ok(
    validarPedidoCrear({
      clienteId: 1,
      detalles: [{ productoId: 1, varianteId: -1, cantidad: 1 }],
    }).some((e) => e.campo === 'detalles[].varianteId'),
  );
});

test('product text validation uses UTF-8 capacity rather than JavaScript character count', () => {
  const errors = validarProductoCrear({
    nombre: 'Polera',
    sku: 'POL-001',
    stock: 1,
    precio: 100,
    estado: 'DISPONIBLE',
    categoriaId: 1,
    descripcion: 'é'.repeat(33000),
  });
  assert.ok(errors.some((e) => e.campo === 'descripcion'));
});

test('extreme pagination and offsets are rejected before calling SQL', async () => {
  let calls = 0;
  const service = new ProductoService({
    productoRepository: {
      listar: async () => {
        calls++;
        return [];
      },
    },
  });
  await assert.rejects(service.listar({ pagina: '1e100' }), {
    codigo: 'REGLA_NEGOCIO_VIOLADA',
  });
  await assert.rejects(service.listar({ pagina: '1000000', limite: '100' }), {
    codigo: 'REGLA_NEGOCIO_VIOLADA',
  });
  assert.equal(calls, 0);
  await service.listar({ pagina: '1', limite: '10' });
  assert.equal(calls, 1);
});

test('parser and SQL input errors keep their client status and JSON contract', () => {
  for (const [error, expected] of [
    [{ type: 'entity.parse.failed' }, 400],
    [{ type: 'entity.too.large' }, 413],
    [
      {
        name: 'SequelizeDatabaseError',
        original: { code: 'ER_DATA_TOO_LONG' },
      },
      422,
    ],
    [{ name: 'SequelizeForeignKeyConstraintError' }, 409],
    [
      {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Se requiere autenticación',
      },
      401,
    ],
  ]) {
    let status;
    let body;
    const response = {
      status(value) {
        status = value;
        return this;
      },
      json(value) {
        body = value;
        return this;
      },
    };
    errorHandler(error, {}, response, () => assert.fail('Unexpected next'));
    assert.equal(status, expected);
    assert.equal(typeof body.error.code, 'string');
    assert.equal(typeof body.error.message, 'string');
    assert.ok(Array.isArray(body.error.details));
  }
});
