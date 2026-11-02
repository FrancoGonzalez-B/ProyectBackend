# Backend de tienda en línea

API REST desarrollada con Node.js, Express, Sequelize y MySQL. Incluye gestión de categorías, productos, clientes y pedidos, además de migraciones y datos iniciales.

## Requisitos

- Node.js y npm
- MySQL

## Instalación y ejecución

```powershell
npm install
Copy-Item .env.example .env
```

Configura las credenciales de MySQL en `.env`. Luego ejecuta:

```powershell
npm run db:migrate
npm run db:seed
npm start
```

El servidor usa el puerto `3000` por defecto; se puede cambiar con `PORT`.

## Endpoints

- `/salud`: estado del servidor
- `/categorias`: gestión de categorías
- `/productos`: gestión y búsqueda de productos
- `/clientes`: gestión de clientes
- `/pedidos`: gestión de pedidos

Para desarrollo, ejecuta `npm run dev`.
