const assert = require('node:assert/strict');
const test = require('node:test');
const app = require('../app');

test('health endpoint responds without opening a database connection', async () => {
  const server = app.listen(0);
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/salud`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { estado: 'ok' });

    const invalidId = await fetch(`http://127.0.0.1:${address.port}/productos/abc`);
    assert.equal(invalidId.status, 400);
    assert.equal((await invalidId.json()).error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
