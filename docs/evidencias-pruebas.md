# Evidencia de ejecución

Fecha de ejecución: 2 de noviembre de 2026. Ejecución local en Windows con Node.js 24.19.0, MySQL/MariaDB de XAMPP y una base de pruebas `tiendatest_*`; no se usó la base existente `backendTienda`.

## Resultados

| Comprobación | Resultado obtenido |
| --- | --- |
| `npm ci` | Instalación correcta; 0 vulnerabilidades reportadas. |
| `npm test` | 24 pruebas aprobadas, 0 fallidas. |
| `npm run test:integration` | 21 de 21 comprobaciones aprobadas sobre una base de integración nueva. |
| `npm run db:verify` | Sin problemas de stock, SKU, totales, estados, referencias de variantes ni pedidos históricos sin asignar. |
| Seeder de demostración | Repetible sin duplicar registros ni descontar stock dos veces; reversión y nueva carga verificadas en la integración. |
| `GET /salud` | HTTP 200. |
| `GET /openapi.json` | HTTP 200; contrato OpenAPI 3.0.3. |
| `GET /api-docs/` | HTTP 200; Swagger UI carga sus recursos. |

## Casos HTTP comprobados

| Caso | Resultado esperado | Resultado obtenido |
| --- | --- | --- |
| Consultar categorías | 200 con colección | Aprobado. |
| Listar productos ordenados y paginados | 200 con `items` y metadatos | Aprobado. |
| Filtrar, buscar, ordenar y paginar productos | 200; resultados pertenecen a la categoría consultada | Aprobado. |
| Intentar saltar `PENDIENTE` → `ENVIADO` | 409 de conflicto de estado | Aprobado. |
| Crear producto con DTO inválido | 422 y error JSON uniforme | Aprobado. |
| Consultar producto inexistente | 404 y error JSON uniforme | Aprobado. |
| Persistencia después de reiniciar API | La categoría creada antes del reinicio se puede volver a leer; limpieza con 204 | Aprobado: crear 201, leer tras reinicio 200, eliminar 204. |

La integración registra sus 21 resultados en `reports/integration.json`, archivo local ignorado por Git para evitar publicar datos de ejecución. Se puede reproducir con `npm test`, `npm run test:integration` y `npm run db:verify`; la integración crea una base nueva con prefijo `tiendatest_` y la conserva al finalizar.

## Datos de demostración en la base local aislada

`tiendatest_local` contiene el administrador local y los siguientes ejemplos tras ejecutar migraciones y seeders:

| Entidad | Registros de muestra |
| --- | ---: |
| Categorías | 2 |
| Productos | 2 |
| Variantes | 3 |
| Clientes | 2 |
| Pedidos | 2 |
| Detalles de pedido | 2 |

Los clientes de ejemplo no tienen contraseña y no son cuentas de inicio de sesión. El administrador se creó localmente; sus credenciales permanecen en `.env`, excluido de Git.

## Material asociado

- Casos importables: [pruebas.postman_collection.json](pruebas.postman_collection.json).
- Modelo y recorrido por capas: [modelo-y-arquitectura.md](modelo-y-arquitectura.md).
- Presentación visual de diez diapositivas: [presentacion.html](presentacion.html).
- Guion y alcance P1–P7: [presentacion-y-defensa.md](presentacion-y-defensa.md).

## Requisitos grupales pendientes de verificación

La comprobación del repositorio remoto encontró un pull request abierto, el [PR #1](https://github.com/FrancoGonzalez-B/ProyectBackend/pull/1), de `prueba-proyecto` hacia `main`. El historial de esta rama contiene cinco etiquetas de autor con 2, 4, 1, 8 y 8 commits, respectivamente. No se puede asumir que esas etiquetas correspondan una a una a las personas del grupo. Si fueran autores distintos, tres no alcanzarían los cinco commits exigidos; además, cada integrante debe haber trabajado en una rama distinta de `main` y creado al menos un pull request.

El grupo informó cuatro integrantes y estas responsabilidades:

| Integrante | Responsabilidad |
| --- | --- |
| Benjamin Aedo | Coordinación y seguimiento; documentación e integración |
| Franco Gonzales | Dominio y datos |
| Lucas Martinez | API y lógica de negocio |
| Francisco Martinez | Calidad y pruebas |

Faltan los enlaces de rama y pull request de cada persona y confirmar qué etiquetas de autor corresponden a cada integrante (en particular, si `Franco` y `FrancoGonzalez-B` son la misma persona). La exposición sorteada, las preguntas y el ensayo de diez minutos sólo puede validarlos el grupo.
