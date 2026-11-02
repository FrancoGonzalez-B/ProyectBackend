const assert = require('node:assert/strict');
const test = require('node:test');
const app = require('../app');

test('Swagger UI serves its local assets and loads this server specification', async () => {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(`${base}/`, { redirect: 'manual' });
    assert.equal(home.status, 302);
    assert.equal(home.headers.get('location'), '/api-docs/');

    const response = await fetch(`${base}/api-docs/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /swagger-ui-bundle\.js/);
    assert.match(html, /id="swagger-ui"/);

    for (const asset of ['swagger-ui-bundle.js', 'swagger-ui.css', 'swagger-ui-init.js']) {
      const resource = await fetch(`${base}/api-docs/${asset}`);
      assert.equal(resource.status, 200, asset);
      const body = await resource.text();
      assert.ok(body.length > 0);
      if (asset === 'swagger-ui-init.js') assert.match(body, /\/openapi\.json/);
    }
    const specResponse = await fetch(`${base}/openapi.json`);
    assert.equal(specResponse.status, 200);
    const spec = await specResponse.json();
    assert.equal(spec.servers[0].url, '/');
    assert.ok(spec.paths['/auth/login']);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

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
