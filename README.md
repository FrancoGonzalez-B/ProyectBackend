# Backend Supermercado en Línea - Área C

API REST de supermercado en línea con arquitectura por capas en Node.js, Express, Sequelize y MySQL.

## Instalación
```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales de MySQL
npm start
```

## Estructura por capas
- domain/: entidades, reglas de negocio, excepciones, contratos
- application/services/: casos de uso
- presentation/: controllers, routes, DTOs, middlewares, errorHandlers
- infrastructure/: conexión BD, modelos ORM, repositorios SQL

## Endpoints
- POST/GET/PUT/DELETE /categorias
- POST/GET/PUT/DELETE /productos (con filtro, orden, paginación)
- POST/GET /clientes, GET /clientes/:id
- POST/GET/PATCH/POST cancelar /pedidos
- GET /salud
