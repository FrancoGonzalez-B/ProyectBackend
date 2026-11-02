const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs'),
  path = require('node:path');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const root = path.resolve(__dirname, '..'),
  name = process.env.TEST_DB_NAME || 'tiendatest_' + Date.now();
if (!/^tiendatest_[a-zA-Z0-9_]+$/.test(name))
  throw Error('TEST_DB_NAME debe comenzar por tiendatest_');
Object.assign(process.env, {
  DB_NAME: name,
  AUTH_SECRET: randomBytes(48).toString('hex'),
  PORT: '0',
});
let db, server, url, admin, user, other, uid, oid;
let customMigration;
const report = { database: name, checks: [] },
  password = 'Prueba-segura-2026!';
const person = (tag) => ({
  nombre: 'Cliente ' + tag,
  email: tag + '@example.test',
  telefono: '+56912345678',
  direccion: 'Calle Prueba 123',
  password,
});
async function check(label, fn) {
  try {
    await fn();
    report.checks.push({ label, pass: true });
    console.log('OK ' + label);
  } catch (e) {
    report.checks.push({ label, pass: false, error: e.message });
    console.error('FAIL ' + label + ': ' + e.message);
    process.exitCode = 1;
  }
}
function cli(command, database = name) {
  return execFileSync(
    process.execPath,
    [path.join(root, 'node_modules/sequelize-cli/lib/sequelize'), command],
    {
      cwd: root,
      env: { ...process.env, DB_NAME: database },
      encoding: 'utf8',
      timeout: 60000,
      stdio: 'pipe',
    },
  );
}
async function http(method, route, body, token, expected) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(url + route, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (expected !== undefined)
    assert.equal(
      response.status,
      expected,
      method + ' ' + route + ' ' + JSON.stringify(data),
    );
  return { status: response.status, data };
}
async function product(sku, stock = 10, precio = 1000) {
  return (
    await http(
      'POST',
      '/productos',
      {
        nombre: 'Producto ' + sku,
        sku,
        stock,
        precio,
        estado: 'DISPONIBLE',
        categoriaId: 1,
      },
      admin,
      201,
    )
  ).data;
}
const order = (p, cantidad = 1, clienteId = uid) => ({
  clienteId,
  detalles: [{ productoId: p.id, varianteId: p.variantes[0].id, cantidad }],
});
async function legacyTest(connection) {
  const legacy = name + '_legacy';
  await connection.query('CREATE DATABASE ' + mysql.escapeId(legacy));
  const old = new Sequelize(
    legacy,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      dialect: 'mysql',
      logging: false,
    },
  );
  try {
    const q = old.getQueryInterface(),
      files = fs
        .readdirSync(path.join(root, 'database/migrations'))
        .filter((f) => f < '20261103000100' && f.endsWith('.js'))
        .sort();
    for (const f of files)
      await require(path.join(root, 'database/migrations', f)).up(
        q,
        require('sequelize'),
      );
    await q.changeColumn('users', 'passwordHash', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await q.changeColumn('products', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await q.changeColumn('pedidos', 'estado', {
      type: Sequelize.ENUM(
        'pendiente',
        'pagado',
        'enviado',
        'entregado',
        'cancelado',
      ),
      allowNull: false,
      defaultValue: 'pendiente',
    });
    await q.createTable('SequelizeMeta', {
      name: { type: Sequelize.STRING, primaryKey: true },
    });
    await q.bulkInsert(
      'SequelizeMeta',
      files.map((name) => ({ name })),
    );
    await old.query(
      "INSERT INTO users (firstName,lastName,email,passwordHash,role,createdAt,updatedAt) VALUES ('Viejo','Cliente','viejo@example.test','HASH','customer',NOW(),NOW())",
    );
    await old.query(
      "INSERT INTO pedidos (cliente_id,direccion_envio,estado,total,fecha,createdAt,updatedAt) VALUES (1,'Calle Vieja 123','pagado',0,NOW(),NOW(),NOW())",
    );
    await old.query(
      "INSERT INTO categories (name,slug,isActive,createdAt,updatedAt) VALUES ('Vieja','vieja',1,NOW(),NOW())",
    );
    await old.query(
      "INSERT INTO products (name,slug,description,price,stock,sku,categoryId,isActive,createdAt,updatedAt) VALUES ('Viejo','viejo','Texto',10000000,3,'LEG-001',1,1,NOW(),NOW())",
    );
    await old.query(
      'INSERT INTO detalles_pedido (pedido_id,producto_id,cantidad,precio_unitario,createdAt,updatedAt) VALUES (1,1,10,10000000,NOW(),NOW())',
    );
    cli('db:migrate', legacy);
    assert.equal((await q.describeTable('users')).passwordHash.allowNull, true);
    assert.equal(
      (await q.describeTable('products')).description.allowNull,
      true,
    );
    assert.match((await q.describeTable('pedidos')).total.type, /14,2/);
    assert.equal(
      (await old.query('SELECT estado FROM pedidos'))[0][0].estado,
      'CONFIRMADO',
    );
    assert.equal(
      (await old.query('SELECT COUNT(*) AS n FROM users'))[0][0].n,
      1,
    );
    assert.equal(
      Number((await old.query('SELECT total FROM pedidos'))[0][0].total),
      100000000,
    );
    assert.ok(
      (await old.query('SELECT variante_id FROM detalles_pedido'))[0][0]
        .variante_id,
    );
    if (!customMigration)
      throw new Error('Falta la migración de tabla personalizada a reproducir');
    await customMigration.up(q, require('sequelize'));
    assert.ok(
      (await q.showAllTables()).includes('personalizada_prueba_swagger'),
    );
    const [registered] = await old.query(
      "SELECT estado FROM tablas_personalizadas WHERE nombre='personalizada_prueba_swagger'",
    );
    assert.equal(registered[0].estado, 'creada');
  } finally {
    await old.close();
  }
}
async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    connectTimeout: 5000,
  });
  try {
    await connection.query(
      'CREATE DATABASE ' +
        mysql.escapeId(name) +
        ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
    await check('Migraciones y seed en base vacía', async () => {
      cli('db:migrate');
      cli('db:seed:all');
    });
    db = require('../infrastructure/models');
    server = await require('../app').start();
    url = 'http://127.0.0.1:' + server.address().port;
    await check('Registro, login, hash y rol protegido', async () => {
      const a = (
        await http('POST', '/auth/registro', person('admin'), null, 201)
      ).data;
      await db.Usuario.update(
        { role: 'admin' },
        { where: { id: a.usuario.id } },
      );
      admin = (
        await http(
          'POST',
          '/auth/login',
          { email: 'admin@example.test', password },
          null,
          200,
        )
      ).data.token;
      const b = (
        await http(
          'POST',
          '/auth/registro',
          { ...person('uno'), role: 'admin' },
          null,
          201,
        )
      ).data;
      uid = b.usuario.id;
      user = b.token;
      assert.equal(b.usuario.role, 'customer');
      const c = (await http('POST', '/auth/registro', person('dos'), null, 201))
        .data;
      oid = c.usuario.id;
      other = c.token;
      assert.ok(
        !(await db.Usuario.findByPk(uid)).passwordHash.includes(password),
      );
      await http(
        'POST',
        '/auth/login',
        { email: 'uno@example.test', password: 'incorrecta' },
        null,
        401,
      );
    });
    await check('Protección401/403', async () => {
      await http('GET', '/clientes', undefined, null, 401);
      await http('GET', '/clientes', undefined, user, 403);
    });
    await check('Salud y OpenAPI', async () => {
      await http('GET', '/salud', undefined, null, 200);
      const s = (await http('GET', '/openapi.json', undefined, null, 200)).data;
      assert.ok(Object.keys(s.paths).length >= 12);
      await http('GET', '/api-docs', undefined, null, 200);
    });
    await check('CRUD clientes y duplicados', async () => {
      const body = person('crud');
      delete body.password;
      const c = (await http('POST', '/clientes', body, admin, 201)).data;
      await http('POST', '/clientes', body, admin, 409);
      await http('GET', '/clientes/' + c.id, undefined, admin, 200);
      await http(
        'PUT',
        '/clientes/' + c.id,
        { ...body, nombre: 'Cliente Editado' },
        admin,
        200,
      );
      await http('DELETE', '/clientes/' + c.id, undefined, admin, 204);
      await http('GET', '/clientes/' + c.id, undefined, admin, 404);
    });
    await check('CRUD categorías y productos', async () => {
      const c = (
        await http('POST', '/categorias', { nombre: 'Temporal' }, admin, 201)
      ).data;
      await http(
        'PUT',
        '/categorias/' + c.id,
        { nombre: 'Editada' },
        admin,
        200,
      );
      await http('DELETE', '/categorias/' + c.id, undefined, admin, 204);
      const p = await product('TEMP');
      await http(
        'PUT',
        '/productos/' + p.id,
        {
          nombre: 'Editado',
          sku: p.sku,
          stock: 8,
          precio: 2000,
          estado: 'DISPONIBLE',
          categoriaId: 1,
        },
        admin,
        200,
      );
      await http('DELETE', '/productos/' + p.id, undefined, admin, 204);
    });
    await check('Filtro orden búsqueda paginación e IDs', async () => {
      const r = (
        await http(
          'GET',
          '/productos?buscar=polera&categoria=1&ordenarPor=precio&descendente=true&pagina=1&limite=1',
          undefined,
          null,
          200,
        )
      ).data;
      assert.equal(r.items.length, 1);
      assert.equal(r.total, 1);
      await http('GET', '/productos?pagina=1e100', undefined, null, 400);
      await http('GET', '/productos/abc', undefined, null, 400);
    });
    await check('JSON400, cuerpo413,404JSON y email largo422', async () => {
      await http('POST', '/clientes', '{', admin, 400);
      await http(
        'POST',
        '/clientes',
        { extra: 'x'.repeat(110000) },
        admin,
        413,
      );
      assert.ok(
        (await http('GET', '/no-existe', undefined, null, 404)).data.error.code,
      );
      await http(
        'POST',
        '/clientes',
        {
          ...person('largo'),
          email: 'a'.repeat(60) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(30),
        },
        admin,
        422,
      );
    });
    let p, placed;
    await check('Pedido y stock por variante', async () => {
      p = await product('PED-BASE');
      placed = (await http('POST', '/pedidos', order(p, 2), user, 201)).data;
      assert.equal(placed.total, 2000);
      assert.equal(placed.detalles[0].varianteId, p.variantes[0].id);
      const r = (await http('GET', '/productos/' + p.id, undefined, null, 200))
        .data;
      assert.equal(r.stock, 8);
      assert.equal(r.variantes[0].stock, 8);
    });
    await check('Privacidad de pedidos', async () => {
      await http('GET', '/pedidos/' + placed.id, undefined, other, 403);
      await http(
        'POST',
        '/pedidos/' + placed.id + '/cancelar',
        undefined,
        other,
        403,
      );
      await http('POST', '/pedidos', order(p, 1, oid), user, 403);
      assert.equal(
        (await http('GET', '/pedidos', undefined, other, 200)).data.length,
        0,
      );
    });
    await check('Cancelación concurrente repone una vez', async () => {
      const r = await Promise.all([
        http('POST', '/pedidos/' + placed.id + '/cancelar', undefined, user),
        http('POST', '/pedidos/' + placed.id + '/cancelar', undefined, user),
      ]);
      assert.deepEqual(r.map((x) => x.status).sort(), [200, 409]);
      assert.equal((await db.Producto.findByPk(p.id)).stock, 10);
    });
    await check('Última unidad sin sobreventa', async () => {
      const last = await product('ULTIMA', 1);
      const r = await Promise.all([
        http('POST', '/pedidos', order(last), user),
        http('POST', '/pedidos', order(last), user),
      ]);
      assert.deepEqual(r.map((x) => x.status).sort(), [201, 400]);
      assert.equal((await db.Producto.findByPk(last.id)).stock, 0);
    });
    await check('Rollback y dirección inválida', async () => {
      const before = await db.Pedido.count();
      await http(
        'POST',
        '/pedidos',
        {
          clienteId: uid,
          detalles: [
            { productoId: p.id, varianteId: p.variantes[0].id, cantidad: 1 },
            { productoId: 999999, cantidad: 1 },
          ],
        },
        user,
        404,
      );
      assert.equal(await db.Pedido.count(), before);
      assert.equal((await db.Producto.findByPk(p.id)).stock, 10);
      await http(
        'POST',
        '/pedidos',
        { ...order(p), direccionEnvio: '   ' },
        user,
        422,
      );
    });
    await check('Total100000000 sin recorte', async () => {
      const expensive = await product('CARO', 100, 10000000);
      const o = (
        await http('POST', '/pedidos', order(expensive, 10), user, 201)
      ).data;
      assert.equal(o.total, 100000000);
      assert.equal(Number((await db.Pedido.findByPk(o.id)).total), 100000000);
    });
    await check('Estados y referencias protegidos', async () => {
      const o = (await http('POST', '/pedidos', order(p), user, 201)).data;
      await http(
        'PATCH',
        '/pedidos/' + o.id + '/estado',
        { estado: 'CONFIRMADO' },
        user,
        403,
      );
      for (const estado of ['CONFIRMADO', 'ENVIADO', 'ENTREGADO'])
        await http(
          'PATCH',
          '/pedidos/' + o.id + '/estado',
          { estado },
          admin,
          200,
        );
      await http(
        'POST',
        '/pedidos/' + o.id + '/cancelar',
        undefined,
        user,
        409,
      );
      await http('DELETE', '/productos/' + p.id, undefined, admin, 409);
      await http('DELETE', '/clientes/' + uid, undefined, admin, 409);
    });
    await check('Varias tallas del mismo producto', async () => {
      const polera = (await http('GET', '/productos/1', undefined, null, 200))
        .data;
      await http(
        'POST',
        '/pedidos',
        { clienteId: uid, detalles: [{ productoId: 1, cantidad: 1 }] },
        user,
        400,
      );
      const o = (
        await http(
          'POST',
          '/pedidos',
          {
            clienteId: uid,
            detalles: polera.variantes.map((v) => ({
              productoId: 1,
              varianteId: v.id,
              cantidad: 1,
            })),
          },
          user,
          201,
        )
      ).data;
      assert.equal(o.detalles.length, 2);
      await http(
        'POST',
        '/pedidos/' + o.id + '/cancelar',
        undefined,
        user,
        200,
      );
    });
    await check('CRUD variantes sincroniza total', async () => {
      const body = { sku: 'VAR-EXTRA', talla: 'L', color: 'Rojo', stock: 4 };
      const v = (
        await http(
          'POST',
          '/productos/' + p.id + '/variantes',
          body,
          admin,
          201,
        )
      ).data;
      await http(
        'PUT',
        '/productos/' + p.id + '/variantes/' + v.id,
        { ...body, stock: 5 },
        admin,
        200,
      );
      await http(
        'DELETE',
        '/productos/' + p.id + '/variantes/' + v.id,
        undefined,
        admin,
        204,
      );
      const r = (await http('GET', '/productos/' + p.id, undefined, null, 200))
        .data;
      assert.equal(
        r.stock,
        r.variantes.reduce((n, v) => n + v.stock, 0),
      );
    });
    await check('Seeder repetible y undo atómico', async () => {
      const seed = require('../database/seeders/20261028000100-initial-catalog'),
        q = db.sequelize.getQueryInterface();
      const before = await db.Variante.count();
      cli('db:seed:all');
      await seed.up(q);
      assert.equal(await db.Variante.count(), before);
      await assert.rejects(seed.down(q));
      assert.equal(await db.Variante.count(), before);
      assert.ok(await db.Producto.findByPk(p.id));
    });
    await check(
      'Crear tabla desde Swagger exige administrador y valida SQL',
      async () => {
        const definition = {
          nombre: 'prueba_swagger',
          columnas: [
            {
              nombre: 'titulo',
              tipo: 'texto',
              longitud: 100,
              obligatorio: true,
            },
            { nombre: 'unidades', tipo: 'entero' },
            { nombre: 'importe', tipo: 'decimal' },
            { nombre: 'activa', tipo: 'booleano' },
            { nombre: 'fecha_inicio', tipo: 'fecha' },
          ],
        };
        await http('POST', '/admin/tablas', definition, null, 401);
        await http('POST', '/admin/tablas', definition, user, 403);
        const tablesBefore = await db.sequelize
          .getQueryInterface()
          .showAllTables();
        await http(
          'POST',
          '/admin/tablas',
          { ...definition, nombre: 'x; DROP TABLE users' },
          admin,
          400,
        );
        const created = (
          await http('POST', '/admin/tablas', definition, admin, 201)
        ).data;
        assert.equal(created.nombre, 'personalizada_prueba_swagger');
        assert.equal(created.estado, 'creada');
        const q = db.sequelize.getQueryInterface();
        const schema = await q.describeTable(created.nombre);
        assert.equal(schema.titulo.allowNull, false);
        assert.match(schema.importe.type, /DECIMAL\(14,2\)/i);
        assert.equal(Object.keys(schema).length, 8);
        assert.equal((await q.showAllTables()).length, tablesBefore.length + 1);
        await http('POST', '/admin/tablas', definition, admin, 409);
        const listed = (
          await http('GET', '/admin/tablas', undefined, admin, 200)
        ).data;
        assert.equal(
          listed.filter((row) => row.nombre === created.nombre).length,
          1,
        );
        const exported = (
          await http(
            'GET',
            '/admin/tablas/' + created.nombre + '/migracion',
            undefined,
            admin,
            200,
          )
        ).data;
        const context = { module: { exports: {} }, Date };
        vm.runInNewContext(exported.contenido, context);
        customMigration = context.module.exports;
        await customMigration.up(q, require('sequelize'));
        await db.sequelize.query(
          'INSERT INTO personalizada_prueba_swagger (titulo, unidades, importe, activa, fecha_inicio) VALUES (:titulo, 3, 12.50, 1, NOW())',
          { replacements: { titulo: 'Registro de prueba' } },
        );
        const [rows] = await db.sequelize.query(
          'SELECT titulo,importe FROM personalizada_prueba_swagger',
        );
        assert.equal(rows[0].titulo, 'Registro de prueba');
        assert.equal(Number(rows[0].importe), 12.5);
        assert.ok((await q.showAllTables()).includes('users'));
      },
    );
    await check('Verificador de integridad', async () =>
      execFileSync(
        process.execPath,
        [path.join(root, 'scripts/verifyDatabase.js')],
        { cwd: root, env: process.env, stdio: 'pipe' },
      ),
    );
    await check('Migración desde esquema anterior conserva datos', async () =>
      legacyTest(connection),
    );
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.sequelize.close();
    await connection.end();
    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'reports/integration.json'),
      JSON.stringify(report, null, 2),
    );
    console.log(
      report.checks.filter((c) => c.pass).length +
        '/' +
        report.checks.length +
        ' comprobaciones correctas; base conservada: ' +
        name,
    );
  }
}
main().catch((e) => {
  console.error(e.stdout ? String(e.stdout) + String(e.stderr) : e.stack);
  process.exitCode = 1;
});
