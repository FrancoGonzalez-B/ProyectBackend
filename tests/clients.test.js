const assert = require('node:assert/strict');
const test = require('node:test');
const ClienteService = require('../application/services/ClienteService');

const input = {
  nombre: '  Ana   Perez  ',
  email: ' ANA@EXAMPLE.TEST ',
  telefono: ' +56912345678 ',
  direccion: ' Calle uno 123 ',
};

test('clients are normalized before unique lookup and persistence', async () => {
  let lookedUp;
  let saved;
  const service = new ClienteService({
    clienteRepository: {
      obtenerPorEmail: async (email) => {
        lookedUp = email;
        return null;
      },
      crear: async (client) => {
        saved = client;
        return { id: 4, ...client };
      },
    },
  });
  const result = await service.crear(input);
  assert.equal(lookedUp, 'ana@example.test');
  assert.deepEqual(saved, {
    nombre: 'Ana Perez',
    email: 'ana@example.test',
    telefono: '+56912345678',
    direccion: 'Calle uno 123',
  });
  assert.equal(result.id, 4);
});

test('client update permits own email and rejects another client email', async () => {
  let collision = false;
  const service = new ClienteService({
    clienteRepository: {
      obtenerPorId: async () => ({ id: 4 }),
      obtenerPorEmail: async () => ({ id: collision ? 9 : 4 }),
      actualizar: async (id, client) => ({ id, ...client }),
    },
  });
  assert.equal((await service.actualizar(4, input)).nombre, 'Ana Perez');
  collision = true;
  await assert.rejects(service.actualizar(4, input), {
    codigo: 'CONFLICTO_ESTADO',
  });
});

test('client deletion verifies existence and persists the delete', async () => {
  let deleted;
  const service = new ClienteService({
    clienteRepository: {
      obtenerPorId: async (id) => (id === 4 ? { id } : null),
      eliminar: async (id) => {
        deleted = id;
        return 1;
      },
    },
  });
  await service.eliminar(4);
  assert.equal(deleted, 4);
  await assert.rejects(service.eliminar(5), {
    codigo: 'RECURSO_NO_ENCONTRADO',
  });
});
