# Backend de tienda de ropa

API REST con Node.js, Express, Sequelize y MySQL/MariaDB. Implementa catálogo, variantes por talla/color, clientes, autenticación y pedidos con inventario transaccional. La conexión con una pasarela de pagos real no está implementada.

## Instalación local

Se requiere Node.js 22.12 o posterior, npm y MySQL/MariaDB activo. Desde la carpeta del proyecto:

```powershell
npm ci
Copy-Item .env.example .env
```

Completar `.env` con la conexión local y un secreto aleatorio:

```dotenv
PORT=3000
DB_NAME=backendTienda
DB_USER=usuario_de_la_aplicacion
DB_PASSWORD=contrasena_local
DB_HOST=127.0.0.1
DB_PORT=3306
AUTH_SECRET=reemplazar_por_un_secreto_aleatorio_de_al_menos_32_caracteres
```

Generar un secreto local de al menos 32 caracteres:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

No subir `.env`, contraseñas ni tokens a Git. Reemplazar el secreto de ejemplo. En XAMPP local se puede usar `DB_USER=root` y contraseña vacía si ésa es la configuración real del servidor. Para publicar, usar un usuario de base de datos con permisos limitados.

Crear la base y ejecutar su preparación versionada:

```powershell
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:verify
```

Las migraciones de compatibilidad actualizan el esquema anterior conservando los registros. No editar migraciones ya ejecutadas ni usar `sequelize.sync({ force: true })` o `alter` como reemplazo. Realizar un respaldo antes de actualizar una instalación con datos propios.

Crear una cuenta administrativa desde la terminal local:

```powershell
$env:ADMIN_EMAIL="admin@example.test"
$env:ADMIN_PASSWORD="ElegirUnaClaveLargaYUnica"
npm run auth:create-admin
Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:ADMIN_PASSWORD
```

El comando almacena un hash scrypt, exige contraseña de 10 a 256 caracteres y rechaza sobrescribir una cuenta existente. Opcionalmente recibe `ADMIN_NAME`, `ADMIN_PHONE` y `ADMIN_ADDRESS`.

```powershell
npm start
```

El puerto predeterminado es 3000; `PORT` permite cambiarlo. Para desarrollo usar `npm run dev`.

## Documentación y rutas

- `GET /salud`: estado del servidor.
- `GET /openapi.json`: contrato OpenAPI 3.
- `GET /api-docs/`: Swagger UI interactivo para consultar y probar endpoints.
- `POST /auth/registro` y `POST /auth/login`: registro y sesión.
- `/categorias`: crear, listar, consultar, actualizar y eliminar categorías.
- `/productos`: CRUD, filtro por categoría/estado, búsqueda, orden y paginación.
- `/productos/:id/variantes`: inventario por talla/color.
- `/clientes`: CRUD administrativo de clientes.
- `/pedidos`: crear, consultar, filtrar, avanzar estado y cancelar pedidos.

La especificación completa está en [docs/openapi.json](docs/openapi.json), con DTO, parámetros, ejemplos, respuestas y permisos. En el cliente de API ajustar el servidor base si se cambia `PORT`.

Los diagramas de clases, datos y recorrido entre capas están en [docs/modelo-y-arquitectura.md](docs/modelo-y-arquitectura.md). La colección Postman importable está en [docs/pruebas.postman_collection.json](docs/pruebas.postman_collection.json), y el guion para organizar la defensa está en [docs/presentacion-y-defensa.md](docs/presentacion-y-defensa.md). Los resultados de la última ejecución se registran en [docs/evidencias-pruebas.md](docs/evidencias-pruebas.md).

Abre `http://localhost:3000/api-docs/` para usar Swagger. Expande un endpoint y pulsa **Try it out**, completa los datos y pulsa **Execute**. Para operaciones protegidas, ejecuta primero `POST /auth/login`, copia el campo `token` de la respuesta y pégalo en **Authorize** sin anteponer `Bearer`. La interfaz agrega ese prefijo automáticamente. Las llamadas de Swagger usan el mismo host y puerto del navegador.

## Autenticación y permisos

### Crear tablas nuevas desde Swagger

Inicia sesión como administrador con `/auth/login`, copia el token en **Authorize** y abre **Administración de tablas → POST /admin/tablas → Try it out**. Por ejemplo:

```json
{
  "nombre": "promociones",
  "columnas": [
    { "nombre": "titulo", "tipo": "texto", "longitud": 150, "obligatorio": true },
    { "nombre": "descuento", "tipo": "decimal", "obligatorio": true },
    { "nombre": "activa", "tipo": "booleano" }
  ]
}
```

Al ejecutar devuelve 201 y crea físicamente `personalizada_promociones` en la base indicada por `DB_NAME`. Actualiza la lista de tablas en phpMyAdmin para verla. Añade automáticamente `id`, `createdAt` y `updatedAt`. Tipos disponibles: texto (longitud 1–500), entero, decimal (14,2), booleano y fecha. Máximo 20 columnas; nombres en minúsculas, con letras/números/guion bajo, empezando por letra. Los nombres existentes se rechazan.

`GET /admin/tablas` muestra las definiciones y el estado de creación. `GET /admin/tablas/personalizada_promociones/migracion` devuelve `archivo` y `contenido`: guarda ese contenido en `database/migrations/` con el nombre indicado y súbelo a Git para reproducir la estructura en otra base. La migración exportada también puede aplicarse en la base donde la tabla ya existe si coincide su estructura. La creación de una tabla no agrega automáticamente un CRUD para sus registros.

Esta herramienta requiere permisos administrativos y una cuenta MySQL con permiso CREATE; no permite enviar SQL libre, alterar ni eliminar las tablas de la tienda. Se registra el estado de cada intento porque el DDL de MySQL no participa de las mismas transacciones que las ventas.

`POST /auth/registro` recibe `nombre`, `email`, `telefono`, `direccion` y `password`; siempre crea un `customer`. `POST /auth/login` recibe `email` y `password`. Ambos devuelven:

```json
{
  "token": "TOKEN_TEMPORAL",
  "tipo": "Bearer",
  "expiraEn": 3600,
  "usuario": { "id": 1, "nombre": "Cliente Ejemplo", "email": "cliente@example.test", "role": "customer" }
}
```

Enviar el token en las solicitudes protegidas:

```http
Authorization: Bearer TOKEN_TEMPORAL
```

El catálogo se consulta públicamente. Modificar categorías, productos y variantes, y gestionar clientes, requiere rol `admin`. Un cliente autenticado sólo puede crear, leer y cancelar pedidos propios; un administrador puede consultar todos y avanzar sus estados. No se devuelve `passwordHash`. Registro/login tienen un límite de intentos por IP y pueden responder 429.

Un cliente creado por un administrador desde `/clientes` es un registro de datos; el registro de autenticación es el flujo para crear una cuenta con contraseña.

## Datos y reglas de negocio

```text
Categoría 1 -> N Producto 1 -> N Variante
Cliente   1 -> N Pedido   1 -> N Detalle
Variante  1 -> N Detalle
```

1. `product_variants.stock` es la fuente de verdad. `products.stock` refleja su suma. Crear un producto con stock genera una variante estándar; con varias tallas/colores, actualizar cada variante. Cambiar directamente el total de un producto con varias variantes devuelve 409.
2. Un detalle guarda `productoId`, `varianteId`, cantidad y precio unitario vigente al comprar. Si existe más de una variante, se debe enviar `varianteId`: el servidor no adivina talla/color. El servidor calcula precios y total desde la base.
3. Pedido, detalles y descuento de inventario se guardan en una sola transacción. Stock insuficiente o un error revierte toda la operación. Cancelar repone inventario una sola vez, incluso con solicitudes concurrentes; repetir la cancelación devuelve 409.
4. Estados permitidos: `PENDIENTE`, `CONFIRMADO`, `ENVIADO`, `ENTREGADO`, `CANCELADO`. Sólo se avanza `PENDIENTE -> CONFIRMADO -> ENVIADO -> ENTREGADO`. Cancelar requiere el endpoint específico y un pedido pendiente.
5. SKU y correo son únicos. No se eliminan clientes/productos/variantes referenciados por pedidos: las dependencias responden 409.
6. Los importes se calculan en centavos. El total usa `DECIMAL(14,2)` y se valida antes de guardar para evitar recortes por MySQL.
7. Los timestamps físicos son `createdAt` y `updatedAt`. Los atributos Sequelize se relacionan con columnas físicas mediante `field`, por ejemplo `clienteId` con `cliente_id` y `precioUnitario` con `precio_unitario`.

Ejemplo de pedido (reemplazar IDs por los obtenidos del registro y el catálogo):

```json
{
  "clienteId": 1,
  "direccionEnvio": "Calle Ejemplo 123",
  "detalles": [{ "productoId": 1, "varianteId": 1, "cantidad": 2 }]
}
```

`clienteId` debe coincidir con la identidad autenticada, salvo que opere un administrador. Si se omite la dirección se usa la del cliente; una dirección de sólo espacios se rechaza.

## Errores y consultas

Los errores mantienen este formato JSON:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no cumplen las validaciones",
    "details": [{ "campo": "email", "mensaje": "Email inválido" }]
  }
}
```

Se utilizan 400 para entrada/JSON inválido o reglas de negocio, 401 para sesión ausente/inválida, 403 para falta de permisos, 404 para recursos/rutas inexistentes, 409 para conflictos, 413 para cuerpos demasiado grandes, 422 para DTO inválido, 429 para exceso de intentos y 500 sólo para fallos internos inesperados. No se expone SQL ni credenciales.

Ejemplo de filtro, orden y paginación:

```http
GET /productos?categoria=1&estado=DISPONIBLE&buscar=polera&ordenarPor=precio&descendente=true&pagina=1&limite=10
```

La respuesta incluye `items`, `total`, `pagina`, `limite` y `totalPaginas`. El límite debe estar entre 1 y 100 y la página debe producir un offset entero seguro dentro del rango permitido.

## Pruebas reproducibles

Pruebas unitarias y de contrato:

```powershell
npm test
```

Para persistencia y HTTP real, iniciar MySQL y usar exclusivamente una base de pruebas con prefijo `tiendatest_`:

```powershell
$env:TEST_DB_NAME="tiendatest_integracion"
npm run test:integration
Remove-Item Env:TEST_DB_NAME
```

El comando de integración rechaza `TEST_DB_NAME` sin ese prefijo para proteger `backendTienda`; si se omite, genera un nombre de pruebas único. Prueba migraciones, CRUD, permisos, inventario por variante, rollback, cancelación concurrente, importes y validaciones. Host/usuario/puerto se siguen tomando de `.env`; el destino es la base de pruebas, independientemente del `DB_NAME` de desarrollo.

```powershell
npm run db:verify
```

Este comando revisa integridad en la base configurada. Los seeders son repetibles y la reversión se limita a sus propios datos; si existen referencias debe detenerse sin un borrado parcial. `db:migrate:undo` y `db:seed:undo` revierten cambios: usarlos sobre bases de pruebas o con un respaldo.

### Colección Postman

Importa `docs/pruebas.postman_collection.json`. Configura `baseUrl` con el host y puerto donde se ejecuta la API. Para las solicitudes administrativas, copia localmente `ADMIN_EMAIL` y `ADMIN_PASSWORD` desde `.env` a las variables de la colección; no exportes ni publiques esos valores. Ejecuta las solicitudes en orden: la colección conserva el token y los IDs de los recursos de prueba. Incluye salud, login, CRUD, validación 422, recurso inexistente 404, transición de pedido inválida 409 y filtro/orden/paginación.

Para comprobar un reinicio de la API, ejecuta las solicitudes 10 y 11, detén e inicia el servidor, ejecuta la 12 para verificar la categoría persistida y termina con la 13 para eliminar el dato temporal. La base de datos debe permanecer activa durante el reinicio del servidor.

### Registros de demostración

`npm run db:seed` carga el catálogo, dos clientes de muestra, dos pedidos pendientes y sus dos detalles en variantes válidas. Las contraseñas de esos clientes son nulas; son datos para consulta y demostración, no cuentas de inicio de sesión. El inventario se descuenta por las líneas de pedido de forma transaccional. El seeder es repetible y su reversión sólo elimina las filas propias; conserva los registros si un cliente de muestra ya tiene pedidos ajenos.

## Organización por capas

- `domain/`: entidades, estados, excepciones y contratos de repositorio.
- `application/services/`: reglas de negocio y coordinación.
- `infrastructure/`: conexión, modelos Sequelize, persistencia y seguridad.
- `presentation/`: DTO, validación, controladores, rutas y errores HTTP.
- `database/migrations/` y `database/seeders/`: estructura versionada y catálogo inicial.
- `tests/`: pruebas unitarias y de contrato; `integration/`: pruebas MySQL/HTTP.

Actualizar OpenAPI y pruebas junto con cualquier cambio del contrato de endpoints.

## Equipo y responsabilidades

Completar con los nombres reales del grupo antes de la entrega. El grupo está compuesto por cuatro integrantes; coordinación y documentación/integración se combinan, como permite la pauta. Falta completar la rama y el pull request individual de cada persona con sus enlaces verificables.

| Integrante | Área principal | Rama / pull request |
| --- | --- | --- |
| Benjamin Aedo | Coordinación y seguimiento; documentación e integración | Pendiente |
| Franco Gonzales | Dominio y datos | Pendiente |
| Lucas Martinez | API y lógica de negocio | Pendiente |
| Francisco Martinez | Calidad y pruebas | Pendiente |
