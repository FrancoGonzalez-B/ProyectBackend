# Backend de tienda de ropa

API REST para la gestión de una tienda de ropa en línea, desarrollada con **Node.js, Express, Sequelize y MySQL/MariaDB**. El sistema permite administrar categorías, productos, variantes por talla y color, clientes, usuarios, autenticación y pedidos, incluyendo control transaccional de inventario.

El proyecto está organizado mediante una arquitectura por capas, con separación entre presentación, aplicación, dominio e infraestructura.

> **Alcance:** este proyecto implementa la lógica backend de una tienda. No incluye una pasarela de pago real ni una interfaz frontend.

---

## 1. Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Node.js 22.12 o superior | Entorno de ejecución |
| Express 5 | Servidor y API REST |
| Sequelize 6 | ORM y persistencia |
| MySQL / MariaDB | Base de datos relacional |
| mysql2 | Conexión con MySQL |
| dotenv | Variables de entorno |
| Swagger UI Express | Documentación interactiva de la API |
| Node.js Test Runner | Pruebas automatizadas |
| Nodemon | Reinicio automático en desarrollo |
| Sequelize CLI | Migraciones y seeders |

---

## 2. Funcionalidades principales

- **Gestión de categorías:** crear, consultar, listar, actualizar y eliminar categorías.
- **Gestión de productos:** operaciones CRUD, búsqueda, filtros, ordenamiento y paginación.
- **Gestión de variantes:** administrar tallas, colores, SKU, precios y existencias.
- **Gestión de clientes:** registrar, consultar, actualizar y eliminar clientes.
- **Autenticación:** registro de usuarios, inicio de sesión y generación de tokens.
- **Autorización:** control de acceso según el rol del usuario.
- **Gestión de pedidos:** creación, consulta, cambio de estado y cancelación.
- **Control de inventario:** descuento y reposición de stock mediante transacciones.
- **Administración de tablas:** creación controlada de tablas personalizadas desde la API.
- **Validaciones:** comprobación de datos, identificadores, cantidades, precios y reglas de negocio.
- **Documentación:** contrato OpenAPI y Swagger UI.
- **Pruebas:** pruebas automatizadas y comprobaciones de integración con MySQL.

---

## 3. Arquitectura del proyecto

El backend utiliza una arquitectura por capas para separar las responsabilidades y facilitar el mantenimiento del código.

```text
ProyectBackend/
│
├── application/
│   └── services/
│       ├── CategoriaService.js
│       ├── ClienteService.js
│       ├── PedidoService.js
│       ├── ProductoService.js
│       ├── TablaService.js
│       └── VarianteService.js
│
├── config/
│   ├── database.js
│   └── mysqlSession.js
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── config.js
│
├── docs/
│   ├── evidencias-pruebas.md
│   ├── modelo-y-arquitectura.md
│   ├── openapi.json
│   ├── presentacion-y-defensa.md
│   ├── pruebas.postman_collection.json
│   └── verificacion.md
│
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── exceptions/
│   ├── repositories/
│   ├── customTableDefinition.js
│   └── money.js
│
├── infrastructure/
│   ├── models/
│   ├── repositories/
│   ├── security/
│   ├── customTableSchema.js
│   └── database.js
│
├── integration/
│   └── run.cjs
│
├── mappers/
│
├── models/
│
├── presentation/
│   ├── controllers/
│   ├── dtos/
│   ├── middlewares/
│   ├── routes/
│   └── errorHandlers.js
│
├── scripts/
│   ├── createAdmin.js
│   ├── createDatabase.js
│   ├── setupLocal.js
│   └── verifyDatabase.js
│
├── tests/
│
├── .env.example
├── .gitignore
├── app.js
├── package.json
└── README.md
```

### Responsabilidades de cada capa

**Domain (dominio)**

Contiene las entidades principales, enumeraciones de estados, excepciones, reglas propias del negocio y contratos de repositorios. Esta capa define conceptos como productos, pedidos, clientes y detalles de pedido.

**Application (aplicación)**

Contiene los servicios que coordinan los casos de uso. Por ejemplo, crear un pedido, actualizar un producto, cancelar una compra o administrar una categoría.

**Infrastructure (infraestructura)**

Gestiona la conexión con la base de datos, los modelos Sequelize, los repositorios SQL y los mecanismos de seguridad y persistencia.

**Presentation (presentación)**

Expone los endpoints HTTP mediante rutas y controladores. También contiene DTO, validaciones, middleware de autenticación y manejo de errores.

**Database (base de datos)**

Contiene las migraciones que permiten crear y actualizar la estructura de la base de datos, además de los seeders para cargar datos iniciales y de demostración.

---

## 4. Requisitos previos

Antes de instalar el proyecto, se necesita:

- Node.js versión **22.12 o superior**.
- npm.
- MySQL o MariaDB instalado y en ejecución.
- Un usuario de base de datos con permisos para crear y modificar las tablas necesarias.
- Git, si se desea clonar el repositorio.

Se puede utilizar XAMPP para ejecutar MySQL de manera local.

---

## 5. Instalación y configuración

### 5.1. Obtener el proyecto

Clonar el repositorio:

```bash
git clone https://github.com/FrancoGonzalez-B/ProyectBackend.git
```

Entrar en la carpeta:

```bash
cd ProyectBackend
```

Instalar las dependencias:

```bash
npm ci
```

### 5.2. Configurar las variables de entorno

Crear el archivo `.env` a partir del ejemplo:

En PowerShell:

```powershell
Copy-Item .env.example .env
```

En Linux o macOS:

```bash
cp .env.example .env
```

Editar el archivo `.env`:

```dotenv
PORT=3000

DB_NAME=backendTienda
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306

AUTH_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO

ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Descripción de las variables:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto donde se ejecuta el servidor |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario de MySQL |
| `DB_PASSWORD` | Contraseña del usuario de MySQL |
| `DB_HOST` | Dirección del servidor de base de datos |
| `DB_PORT` | Puerto de MySQL |
| `AUTH_SECRET` | Secreto utilizado para firmar los tokens |
| `ADMIN_EMAIL` | Correo para crear el administrador |
| `ADMIN_PASSWORD` | Contraseña para crear el administrador |

Generar un secreto aleatorio para `AUTH_SECRET`:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

El secreto debe ser privado y tener al menos 32 caracteres.

**Importante:** no compartir ni subir el archivo `.env` a GitHub. El archivo `.env.example` sirve como plantilla y no debe contener contraseñas reales ni secretos.

### 5.3. Alternativa: configuración local automática

El proyecto incluye un comando que crea un `.env` local si todavía no existe:

```bash
npm run setup:local
```

Este comando genera una configuración local con una base de datos de pruebas llamada `tiendatest_local` y valores aleatorios para el secreto y la contraseña administrativa.

Si ya existe un archivo `.env`, el comando conserva su configuración.

### 5.4. Crear la base de datos

Con MySQL en ejecución y las variables de entorno configuradas:

```bash
npm run db:create
```

Este comando prepara la base de datos indicada en `DB_NAME`.

### 5.5. Ejecutar las migraciones

```bash
npm run db:migrate
```

Las migraciones crean y actualizan las tablas y relaciones necesarias para el funcionamiento del sistema.

### 5.6. Cargar datos iniciales

```bash
npm run db:seed
```

Los seeders incorporan datos de catálogo y registros de demostración.

### 5.7. Verificar la base de datos

```bash
npm run db:verify
```

Este comando revisa la integridad de los datos y las relaciones del sistema, incluyendo inventario, SKU, totales y referencias de variantes.

---

## 6. Crear una cuenta administradora

Para generar una cuenta con permisos de administrador, se deben configurar `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno.

Ejemplo en PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@example.test"
$env:ADMIN_PASSWORD="ElegirUnaClaveLargaYUnica"

npm run auth:create-admin

Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:ADMIN_PASSWORD
```

Opcionalmente se pueden definir:

```dotenv
ADMIN_NAME=Administrador Tienda
ADMIN_PHONE=+56900000000
ADMIN_ADDRESS=Administracion local
```

La contraseña se almacena mediante un hash scrypt, no como texto plano. El comando no modifica una cuenta existente ni sobrescribe sus credenciales.

---

## 7. Ejecutar el servidor

Para iniciar el backend:

```bash
npm start
```

Para trabajar en modo desarrollo:

```bash
npm run dev
```

Por defecto, el servidor se ejecuta en:

```text
http://localhost:3000
```

Si se modifica `PORT`, se debe utilizar el puerto configurado.

### Comprobar que el servidor funciona

Abrir:

```text
http://localhost:3000/salud
```

La API devuelve una respuesta JSON indicando que el servidor está disponible:

```json
{
  "estado": "ok"
}
```

---

## 8. Documentación de la API con Swagger

El proyecto incluye documentación interactiva mediante Swagger UI.

Abrir en el navegador:

```text
http://localhost:3000/api-docs/
```

Desde esta interfaz es posible:

1. Consultar los endpoints disponibles.
2. Revisar los parámetros y cuerpos de las solicitudes.
3. Conocer las respuestas HTTP.
4. Ejecutar solicitudes directamente contra el backend.
5. Probar operaciones protegidas mediante autenticación.

El contrato OpenAPI se encuentra disponible en:

```text
http://localhost:3000/openapi.json
```

También se encuentra almacenado en:

```text
docs/openapi.json
```

### Cómo utilizar Swagger con autenticación

1. Ejecutar `POST /auth/login`.
2. Ingresar el correo y la contraseña.
3. Copiar el campo `token` de la respuesta.
4. Presionar **Authorize** en Swagger.
5. Pegar el token sin escribir manualmente el prefijo `Bearer`.
6. Ejecutar los endpoints protegidos.

Swagger agrega automáticamente el prefijo correspondiente.

---

## 9. Endpoints principales

La especificación completa, con parámetros, DTO, ejemplos y respuestas, está en `docs/openapi.json`.

### 9.1. Salud y documentación

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/salud` | Comprueba el estado del servidor |
| GET | `/openapi.json` | Obtiene el contrato OpenAPI |
| GET | `/api-docs/` | Abre Swagger UI |

### 9.2. Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/registro` | Registra una cuenta de cliente |
| POST | `/auth/login` | Inicia sesión |

El registro crea usuarios con rol `customer`. Las cuentas administrativas se crean mediante el comando específico de administración.

### 9.3. Categorías

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/categorias` | Lista las categorías |
| GET | `/categorias/:id` | Obtiene una categoría |
| POST | `/categorias` | Crea una categoría |
| PUT | `/categorias/:id` | Actualiza una categoría |
| DELETE | `/categorias/:id` | Elimina una categoría |

Las operaciones de escritura requieren permisos de administrador.

### 9.4. Productos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/productos` | Lista y filtra productos |
| GET | `/productos/:id` | Obtiene un producto |
| POST | `/productos` | Crea un producto |
| PUT | `/productos/:id` | Actualiza un producto |
| DELETE | `/productos/:id` | Elimina un producto |

La consulta de productos permite utilizar filtros, búsqueda, ordenamiento y paginación.

Ejemplo:

```http
GET /productos?categoria=1&estado=DISPONIBLE&buscar=polera&ordenarPor=precio&descendente=true&pagina=1&limite=10
```

Los parámetros permiten:

- Filtrar por categoría.
- Filtrar por estado.
- Buscar por texto.
- Ordenar por un campo permitido.
- Definir el sentido del orden.
- Consultar resultados por página.

La respuesta incluye los elementos y metadatos de paginación, como total de registros, página actual, límite y total de páginas.

### 9.5. Variantes de productos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/productos/:id/variantes` | Lista las variantes de un producto |
| POST | `/productos/:id/variantes` | Crea una variante |
| PUT | `/productos/:id/variantes/:varianteId` | Actualiza una variante |
| DELETE | `/productos/:id/variantes/:varianteId` | Elimina una variante |

Cada variante puede tener su propio SKU, talla, color, precio y stock.

La consulta de variantes es pública; las operaciones de modificación requieren permisos de administrador.

### 9.6. Clientes

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/clientes` | Lista clientes |
| GET | `/clientes/:id` | Obtiene un cliente |
| POST | `/clientes` | Crea un cliente |
| PUT | `/clientes/:id` | Actualiza un cliente |
| DELETE | `/clientes/:id` | Elimina un cliente |

La gestión de clientes requiere autenticación y permisos de administrador.

### 9.7. Pedidos

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/pedidos` | Crea un pedido |
| GET | `/pedidos` | Lista pedidos permitidos para el usuario |
| GET | `/pedidos/:id` | Consulta un pedido |
| PATCH | `/pedidos/:id/estado` | Cambia el estado de un pedido |
| POST | `/pedidos/:id/cancelar` | Cancela un pedido |

Los permisos dependen del usuario autenticado. Un cliente puede gestionar sus propios pedidos dentro de las operaciones permitidas; un administrador puede consultar pedidos y avanzar sus estados.

### 9.8. Administración de tablas personalizadas

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/admin/tablas` | Lista las definiciones de tablas |
| POST | `/admin/tablas` | Crea una tabla personalizada |
| GET | `/admin/tablas/:nombre/migracion` | Exporta una migración |

Estas operaciones requieren rol de administrador.

La herramienta permite crear tablas físicas con columnas validadas, pero **no genera automáticamente endpoints CRUD para los registros de esas tablas**.

---

## 10. Autenticación y control de acceso

El sistema utiliza tokens Bearer para proteger las operaciones que requieren autenticación.

### Roles

| Rol | Permisos principales |
|---|---|
| `customer` | Consultar el catálogo y gestionar sus propios pedidos |
| `admin` | Administrar categorías, productos, variantes, clientes, pedidos y tablas personalizadas |

### Flujo de autenticación

El usuario se registra o inicia sesión. Si las credenciales son válidas, el backend entrega un token temporal.

Ejemplo de respuesta:

```json
{
  "token": "TOKEN_TEMPORAL",
  "tipo": "Bearer",
  "expiraEn": 3600,
  "usuario": {
    "id": 1,
    "nombre": "Cliente Ejemplo",
    "email": "cliente@example.test",
    "role": "customer"
  }
}
```

El token se envía en las solicitudes protegidas mediante el encabezado:

```http
Authorization: Bearer TOKEN_TEMPORAL
```

Las contraseñas se almacenan mediante hash scrypt. El sistema no devuelve el campo `passwordHash` en las respuestas de autenticación.

---

## 11. Modelo de datos y relaciones

El modelo de datos principal considera las siguientes relaciones:

```text
Categoría 1 ───── N Producto
Producto  1 ───── N Variante

Cliente   1 ───── N Pedido
Pedido    1 ───── N DetallePedido
Producto  1 ───── N DetallePedido
Variante  1 ───── N DetallePedido
```

### Entidades principales

**Usuario / Cliente**

Almacena los datos de las cuentas de usuario, correo, información de contacto, rol y credenciales protegidas.

**Categoría**

Agrupa los productos de la tienda.

**Producto**

Representa un artículo del catálogo, con nombre, descripción, precio, SKU, estado y categoría.

**Variante**

Representa una versión específica de un producto, definida por atributos como talla y color. Mantiene el inventario correspondiente a esa combinación.

**Pedido**

Representa una compra realizada por un cliente, con dirección de envío, fecha, estado y total.

**Detalle de pedido**

Registra los productos y variantes incluidos en una compra, sus cantidades y el precio unitario aplicado.

Los diagramas de clases, relaciones y arquitectura se encuentran en:

```text
docs/modelo-y-arquitectura.md
```

---

## 12. Reglas de negocio e inventario

El backend aplica reglas para mantener la consistencia de los datos y evitar operaciones inválidas.

1. **Inventario por variante:** `product_variants.stock` es la fuente de verdad del inventario. El stock de `products` refleja la suma de sus variantes.
2. **Variantes identificables:** cada variante posee SKU y atributos propios. El sistema no debe asumir una talla o color cuando existen varias opciones.
3. **Validación de stock:** no se puede crear un pedido si la cantidad solicitada supera las existencias disponibles.
4. **Descuento transaccional:** el pedido, sus detalles y el descuento de inventario se procesan dentro de una transacción.
5. **Cancelación segura:** cancelar un pedido pendiente repone el inventario una sola vez. Las operaciones concurrentes se protegen para evitar devoluciones duplicadas.
6. **Cálculo del total:** el servidor obtiene los precios desde la base de datos y calcula el total; no confía en importes enviados por el cliente.
7. **Importes monetarios:** los cálculos se realizan en centavos y se almacenan con precisión decimal.
8. **Estados controlados:** se permiten las transiciones `PENDIENTE → CONFIRMADO → ENVIADO → ENTREGADO`. La cancelación se realiza mediante su endpoint específico y requiere que el pedido esté pendiente.
9. **Integridad referencial:** no se eliminan accidentalmente productos, variantes o clientes que estén referenciados por pedidos.
10. **Identificadores únicos:** se controlan restricciones de unicidad para SKU y correo electrónico.

### Ejemplo de creación de un pedido

```json
{
  "clienteId": 1,
  "direccionEnvio": "Calle Ejemplo 123",
  "detalles": [
    {
      "productoId": 1,
      "varianteId": 1,
      "cantidad": 2
    }
  ]
}
```

Los identificadores deben corresponder a registros existentes. El cliente autenticado debe ser propietario del pedido, salvo que la operación la realice un administrador.

El precio y el total son calculados por el servidor.

---

## 13. Tablas personalizadas desde Swagger

El sistema incorpora una herramienta administrativa para crear tablas personalizadas sin permitir que el usuario envíe SQL arbitrario.

Ejemplo de solicitud:

```json
{
  "nombre": "promociones",
  "columnas": [
    {
      "nombre": "titulo",
      "tipo": "texto",
      "longitud": 150,
      "obligatorio": true
    },
    {
      "nombre": "descuento",
      "tipo": "decimal",
      "obligatorio": true
    },
    {
      "nombre": "activa",
      "tipo": "booleano"
    }
  ]
}
```

La tabla física creada utiliza el prefijo `personalizada_` y agrega automáticamente:

- `id`
- `createdAt`
- `updatedAt`

Los tipos admitidos son texto, entero, decimal, booleano y fecha, con límites de columnas y validación de nombres.

Para reproducir la estructura en otra base, el endpoint de exportación entrega el contenido de una migración JavaScript que se debe guardar en `database/migrations/` y versionar en Git.

Esta funcionalidad requiere permisos de administrador y privilegios MySQL para crear tablas.

---

## 14. Manejo de errores y validaciones

Las respuestas de error utilizan un formato JSON uniforme.

Ejemplo:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no cumplen las validaciones",
    "details": [
      {
        "campo": "email",
        "mensaje": "Email inválido"
      }
    ]
  }
}
```

### Códigos HTTP utilizados

| Código | Significado |
|---|---|
| 200 | Solicitud procesada correctamente |
| 201 | Recurso creado |
| 204 | Operación completada sin contenido |
| 400 | Solicitud o identificador inválido |
| 401 | Falta autenticación o las credenciales son inválidas |
| 403 | El usuario no tiene permisos |
| 404 | Recurso o ruta no encontrada |
| 409 | Conflicto con el estado o los datos existentes |
| 413 | Cuerpo de solicitud demasiado grande |
| 415 | Tipo de contenido no admitido |
| 422 | Error de validación de datos |
| 429 | Demasiados intentos |
| 500 | Error interno inesperado |

Las validaciones se realizan antes de ejecutar las operaciones de negocio y persistencia. Los errores internos no deben exponer contraseñas, credenciales ni consultas SQL.

---

## 15. Pruebas automatizadas

El proyecto incorpora pruebas unitarias, de servicios, validaciones, modelos, autenticación, migraciones y operaciones HTTP.

### Ejecutar pruebas unitarias y de contrato

```bash
npm test
```

### Ejecutar pruebas de integración

Las pruebas de integración requieren MySQL activo y utilizan una base de datos aislada con prefijo `tiendatest_`.

En PowerShell:

```powershell
$env:TEST_DB_NAME="tiendatest_integracion"
npm run test:integration
Remove-Item Env:TEST_DB_NAME
```

Si no se especifica `TEST_DB_NAME`, el ejecutor genera un nombre de pruebas único.

El proceso rechaza nombres que no cumplan el prefijo de seguridad y no reutiliza una base existente.

### Verificar la base de datos

```bash
npm run db:verify
```

### Revisar dependencias

```bash
npm audit
```

La evidencia de la ejecución documentada el 2 de noviembre de 2026 se encuentra en:

```text
docs/evidencias-pruebas.md
```

En esa ejecución se registraron 24 pruebas automatizadas aprobadas y 21 comprobaciones de integración aprobadas, además de las verificaciones de salud y documentación. Los resultados corresponden a esa ejecución y pueden variar al repetir las pruebas con otro entorno.

---

## 16. Pruebas con Postman

El proyecto incluye una colección importable:

```text
docs/pruebas.postman_collection.json
```

Para utilizarla:

1. Abrir Postman.
2. Seleccionar **Import**.
3. Elegir el archivo `pruebas.postman_collection.json`.
4. Configurar `baseUrl` con la dirección del servidor.
5. Configurar localmente las credenciales administrativas si se requieren.
6. Ejecutar las solicitudes de la colección.

La colección permite comprobar operaciones del backend, autenticación, respuestas de validación, recursos inexistentes, conflictos y persistencia.

No se deben exportar ni compartir variables que contengan contraseñas o tokens reales.

---

## 17. Comandos disponibles

| Comando | Función |
|---|---|
| `npm ci` | Instala dependencias desde el lockfile |
| `npm start` | Inicia el servidor |
| `npm run dev` | Inicia el servidor con Nodemon |
| `npm test` | Ejecuta las pruebas automatizadas |
| `npm run test:integration` | Ejecuta pruebas de integración |
| `npm run setup:local` | Genera configuración local si no existe `.env` |
| `npm run db:create` | Crea o prepara la base configurada |
| `npm run db:migrate` | Ejecuta migraciones pendientes |
| `npm run db:migrate:undo` | Revierte la última migración |
| `npm run db:seed` | Ejecuta los seeders |
| `npm run db:seed:undo` | Revierte los seeders |
| `npm run db:verify` | Verifica la integridad de la base |
| `npm run auth:create-admin` | Crea una cuenta administradora |

**Precaución:** los comandos de reversión de migraciones y seeders deben utilizarse con cuidado, preferentemente en bases de prueba y con respaldo previo cuando existan datos importantes.

---

## 18. Documentación adicional

El repositorio incluye documentación complementaria:

| Archivo | Contenido |
|---|---|
| `docs/modelo-y-arquitectura.md` | Modelo de dominio, relaciones y arquitectura |
| `docs/openapi.json` | Especificación OpenAPI de la API |
| `docs/pruebas.postman_collection.json` | Colección de pruebas para Postman |
| `docs/evidencias-pruebas.md` | Resultados documentados de pruebas |
| `docs/verificacion.md` | Verificaciones y correcciones implementadas |
| `docs/presentacion-y-defensa.md` | Material de apoyo para la presentación |

---

## 19. Equipo de desarrollo

El proyecto fue desarrollado por un equipo de cuatro integrantes, con responsabilidades distribuidas por áreas.

| Integrante | Responsabilidad |
|---|---|
| Benjamín Aedo | Coordinación, seguimiento, documentación e integración |
| Franco Gonzales | Dominio, modelado de datos y migraciones |
| Lucas Martínez | API, servicios y lógica de negocio |
| Francisco Martínez | Calidad, validaciones y pruebas |

Las ramas y los pull requests individuales deben verificarse en el repositorio antes de la entrega final.

---

## 20. Consideraciones y limitaciones

- No se encuentra implementada una pasarela de pago real.
- La API corresponde al backend; no incluye una interfaz frontend.
- La creación de tablas personalizadas no genera automáticamente operaciones CRUD para ellas.
- Las cuentas de clientes cargadas mediante los seeders son datos de demostración y no necesariamente tienen credenciales para iniciar sesión.
- Antes de aplicar migraciones en una base con información real, se debe generar un respaldo.
- Los secretos y credenciales locales deben mantenerse fuera del repositorio.
- Las pruebas de integración deben ejecutarse únicamente sobre bases de datos aisladas de pruebas.

---

## 21. Licencia

Este proyecto utiliza la licencia ISC, según la configuración de `package.json`.

---

**Backend de tienda de ropa — API REST con Node.js, Express, Sequelize y MySQL.**