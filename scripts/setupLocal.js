const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const file = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(file)) {
  console.log('.env ya existe; se conserva su configuración');
} else {
  fs.writeFileSync(
    file,
    [
      'PORT=3000',
      'DB_NAME=tiendatest_local',
      'DB_USER=root',
      'DB_PASSWORD=',
      'DB_HOST=127.0.0.1',
      'DB_PORT=3306',
      'AUTH_SECRET=' + randomBytes(48).toString('hex'),
      'ADMIN_EMAIL=admin@example.test',
      'ADMIN_PASSWORD=' + randomBytes(18).toString('base64url'),
    ].join('\n') + '\n',
    { flag: 'wx' },
  );
  console.log(
    '.env local creado. Las credenciales de prueba están en ese archivo; no se suben a Git.',
  );
}
