# Backend de tienda en línea

API REST de categorías, productos, clientes y pedidos construida con Node.js, Express, Sequelize y MySQL.

## Requisitos

- Node.js 18 o posterior y npm
- MySQL

## Configuración

```powershell
npm ci
Copy-Item .env.example .env
```

Completa las credenciales de MySQL en `.env` y crea la base de datos indicada en `DB_NAME` si todavía no existe. Luego ejecuta las migraciones, datos de prueba y servidor:

```powershell
npm run db:migrate
npm run db:seed
npm start
```

El servidor escucha en el puerto `3000` por defecto. Se puede cambiar con `PORT`.

## Rutas principales

- `GET /salud`: estado del servidor
- `/categorias`: gestión de categorías
- `/productos`: gestión y búsqueda de productos
- `/clientes`: gestión de clientes
- `/pedidos`: gestión de pedidos, estados y cancelación

## Pruebas

```powershell
npm test
```

Las pruebas de API, modelos, validaciones, servicios y compatibilidad entre migraciones y modelos se ejecutan sin conectarse a MySQL. Para iniciar la API y probar persistencia real, MySQL debe estar iniciado y configurado.

Para desarrollo, ejecuta `npm run dev`.
