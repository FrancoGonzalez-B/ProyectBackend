const assert = require('node:assert/strict');
const test = require('node:test');
const Producto = require('../domain/entities/Producto');
const Cliente = require('../domain/entities/Cliente');
const Pedido = require('../domain/entities/Pedido');
const PedidoService = require('../application/services/PedidoService');
const {
  validarCategoriaCrear,
} = require('../presentation/dtos/CategoriaDTO');
const {
  validarProductoCrear,
} = require('../presentation/dtos/ProductoDTO');
const {
  validarCambioEstado,
  validarPedidoCrear,
} = require('../presentation/dtos/PedidoDTO');

test('order creation validates stock and passes an atomic inventory update to persistence', async () => {
  const product = new Producto({
    id: 4,
    nombre: 'Polera',
    precio: 12000,
    stock: 5,
    sku: 'POL-001',
    estado: 'DISPONIBLE',
  });
  let persisted;
  const service = new PedidoService({
    clienteRepository: {
      obtenerPorId: async () => new Cliente({ id: 7, direccion: 'Calle 123' }),
    },
    productoRepository: {
      obtenerPorId: async () => product,
    },
    pedidoRepository: {
      crear: async (pedido, cambiosStock) => {
        persisted = { pedido, cambiosStock };
        return pedido;
      },
    },
  });

  await service.crear({
    clienteId: 7,
    detalles: [{ productoId: 4, cantidad: 2 }],
  });

  assert.equal(product.stock, 3);
  assert.deepEqual(persisted.cambiosStock, [{ id: 4, stockAnterior: 5, stock: 3 }]);
  assert.equal(persisted.pedido.detalles[0].precioUnitario, 12000);
  assert.equal(persisted.pedido.direccionEnvio, 'Calle 123');
});

test('order creation rejects unavailable stock before writing an order', async () => {
  const product = new Producto({
    id: 4,
    nombre: 'Polera',
    precio: 12000,
    stock: 1,
    sku: 'POL-001',
    estado: 'DISPONIBLE',
  });
  let created = false;
  const service = new PedidoService({
    clienteRepository: {
      obtenerPorId: async () => new Cliente({ id: 7, direccion: 'Calle 123' }),
    },
    productoRepository: {
      obtenerPorId: async () => product,
    },
    pedidoRepository: {
      crear: async () => {
        created = true;
      },
    },
  });

  await assert.rejects(
    service.crear({ clienteId: 7, detalles: [{ productoId: 4, cantidad: 2 }] }),
    { codigo: 'REGLA_NEGOCIO_VIOLADA' },
  );
  assert.equal(created, false);
  assert.equal(product.stock, 1);
});

test('order cancellation restores inventory through the same persistence operation', async () => {
  const product = new Producto({
    id: 4,
    nombre: 'Polera',
    precio: 12000,
    stock: 0,
    sku: 'POL-001',
    estado: 'AGOTADO',
  });
  const pedido = new Pedido({
    id: 2,
    clienteId: 7,
    estado: 'PENDIENTE',
    detalles: [{ productoId: 4, cantidad: 2, precioUnitario: 12000 }],
  });
  let persisted;
  const service = new PedidoService({
    clienteRepository: {},
    productoRepository: {
      obtenerPorId: async () => product,
    },
    pedidoRepository: {
      obtenerPorId: async () => pedido,
      actualizarConStock: async (...args) => {
        persisted = args;
      },
    },
  });

  await service.cancelar(2);

  assert.equal(product.stock, 2);
  assert.deepEqual(persisted[1], { estado: 'CANCELADO' });
  assert.deepEqual(persisted[2], [{ id: 4, stockAnterior: 0, stock: 2 }]);
});

test('DTOs reject malformed bodies without throwing', () => {
  assert.ok(validarCategoriaCrear(null).length > 0);
  assert.ok(validarPedidoCrear({ detalles: [null] }).length > 0);
  assert.ok(validarCambioEstado(null).length > 0);
  assert.ok(validarCambioEstado({ estado: 'CANCELADO' }).length > 0);
  assert.ok(validarProductoCrear({
    nombre: 'Polera',
    precio: 12000.123,
    stock: 1,
    sku: 'POL-001',
    estado: 'DISPONIBLE',
    categoriaId: 1,
  }).some((error) => error.campo === 'precio'));
});

test('order totals are rounded to the database currency precision', () => {
  const pedido = new Pedido({
    detalles: [{ cantidad: 3, precioUnitario: 0.1 }],
  });
  assert.equal(pedido.total, 0.3);
});
