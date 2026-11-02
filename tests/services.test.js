const assert = require('node:assert/strict');
const test = require('node:test');
const Pedido = require('../domain/entities/Pedido');
const { totalCents } = require('../domain/money');
test('dinero se calcula en centavos y admite pedidos superiores a cien millones', () => {
  assert.equal(totalCents([{ cantidad: 3, precioUnitario: 0.1 }]), 30);
  assert.equal(
    new Pedido({ detalles: [{ cantidad: 10, precioUnitario: 10000000 }] })
      .total,
    100000000,
  );
  assert.throws(() =>
    totalCents([
      { cantidad: Number.MAX_SAFE_INTEGER, precioUnitario: 10000000 },
    ]),
  );
});
test('transiciones de pedido y cancelación inválidas se rechazan', () => {
  const p = new Pedido();
  assert.throws(() => p.avanzarEstado('ENTREGADO'));
  p.avanzarEstado('CONFIRMADO');
  assert.throws(() => p.cancelar());
  p.avanzarEstado('ENVIADO');
  p.avanzarEstado('ENTREGADO');
  assert.equal(p.estado, 'ENTREGADO');
});
