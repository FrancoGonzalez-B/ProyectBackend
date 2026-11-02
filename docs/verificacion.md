# Entrega de correcciones y evidencia para la defensa

Los cambios se hicieron en la copia `BackendTienda-prueba-proyecto`, rama `prueba-proyecto`. No se publicaron commits ni se modificó la base original `backendTienda`.

## Correspondencia con la rúbrica de código compartida

| Criterio | Implementación y evidencia |
| --- | --- |
| Ejecución y endpoints | `npm start`; contrato con 32 operaciones en `docs/openapi.json`, incluidas las herramientas administrativas de tablas. |
| Modelo de dominio | Usuarios, categorías, productos, variantes, pedidos y detalles; ID y atributos útiles; relaciones 1:N y claves foráneas. Definiciones canónicas en `infrastructure/models`; `models/` conserva alias compatibles. |
| REST, DTO y OpenAPI | Validación de cuerpos/IDs, códigos HTTP, especificación OpenAPI con parámetros, ejemplos, seguridad y respuestas. `GET /openapi.json`. |
| CRUD y persistencia | CRUD de categorías, productos, clientes y variantes mediante Sequelize/MySQL; pedidos con detalles persistidos. |
| Validaciones y reglas | Límites de textos, dinero, cantidades e IDs; unicidad SKU/email; categoría existente; stock suficiente; transiciones de estado; cancelación solo pendiente; restricciones de eliminación y permisos. |
| Respuestas y errores | JSON uniforme `{error:{code,message,details}}`; 400/401/403/404/409/413/415/422; 500 reservado a fallos internos. |
| Filtro, orden y paginación | `/productos?categoria=1&buscar=polera&ordenarPor=precio&descendente=true&pagina=1&limite=10`; devuelve total/página/límite/totalPaginas; rechaza offsets fuera de rango. |
| Arquitectura por capas | `presentation`: HTTP/DTO/permisos; `application`: casos de uso; `domain`: entidades, dinero, estados y errores; `infrastructure`: persistencia, transacciones y seguridad. Los repositorios realizan las operaciones atómicas sobre la BD. |
| Migraciones y seeders | Migración nueva de compatibilidad, historial de seeders, inserción idempotente, registro de propiedad de datos y deshacer transaccional que conserva datos ajenos. |
| Pruebas iniciales | `npm test`, `npm run test:integration` y `npm run db:verify`. Los asserts indican los resultados esperados y el informe registra cada comprobación. |

## Qué cambió respecto del informe de auditoría

1. Una migración nueva adapta nulabilidad, estados y precisión monetaria sin depender de volver a ejecutar las migraciones antiguas.
2. El stock vive en variantes; triggers con incrementos atómicos mantienen el total del producto.
3. Los detalles nuevos registran `variante_id`; una talla/color se valida contra su producto. Dos variantes diferentes pueden estar en el mismo pedido.
4. Crear, cancelar y cambiar estados de pedidos usa transacciones y bloqueos; no se duplica una devolución ni se sobrevende la última unidad.
5. Se calcula el dinero en centavos y se guarda el total en `DECIMAL(14,2)`; el modo SQL estricto evita recortes silenciosos.
6. Clientes ahora permite actualizar y eliminar. Los registros relacionados con pedidos no se eliminan accidentalmente.
7. Se agregó registro/login, hash scrypt, tokens de una hora y comprobación de rol y propietario de cada pedido.
8. Los DTO y errores cubren correo largo, dirección en blanco, paginación extrema, JSON inválido y cuerpos demasiado grandes.
9. Las rutas inexistentes devuelven JSON y el catálogo se documenta mediante OpenAPI.
10. Los seeders pueden repetirse y su reversión no borra datos de aplicación. Si una FK impide deshacer, la transacción se revierte completa.
11. Las dependencias transitivas vulnerables se actualizaron y se verificó `npm audit` sin alertas.

## Uso en esta copia local

El `.env` local se generó con un secreto aleatorio y la base separada `tiendatest_local`. La cuenta administrativa ya se creó; el correo y contraseña de prueba están en las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` de ese archivo. No publicar el archivo.

```powershell
npm start
```

Iniciar sesión con `POST /auth/login` y enviar el token como `Authorization: Bearer TOKEN`. Consultar `/salud`, `/openapi.json` y `/api-docs`.

Para reproducir las comprobaciones:

```powershell
npm test
npm run test:integration
npm run db:verify
npm audit
```

La integración crea bases nuevas `tiendatest_*`; `TEST_DB_NAME` permite elegir un nombre nuevo con ese prefijo. Rechaza nombres ajenos al prefijo y bases que ya existen. Nunca vacía ni reutiliza una base propia del usuario. Al terminar conserva los datos de prueba y escribe `reports/integration.json` (ignorado por Git).

## Consideraciones de actualización

Una venta histórica que no registró talla/color y tenía varias variantes no permite inferir cuál se compró. La migración conserva ese detalle con `variante_id=NULL`; la cancelación solicita reconciliación explícita antes de reponer inventario. `db:verify` informa esos casos como `historicalUnassigned`. No se asigna una talla arbitrariamente.

La conversión de estados y el inventario histórico no tienen un `down` destructivo: para revertir esa migración se escribe una nueva migración de transición. El resto del trabajo debe revisarse y respaldarse antes de aplicarlo en una base con ventas reales.

La pasarela de pago real y la presentación/defensa oral son entregables distintos; estas pruebas cubren el backend y los criterios de código compartidos.

## Creación de tablas desde Swagger

La sección **Administración de tablas** permite crear tablas físicas `personalizada_*`, con nombre y columnas validados, mediante una cuenta administrativa. La definición y el estado quedan registrados en `tablas_personalizadas`. El endpoint de exportación devuelve una migración JavaScript independiente para guardarla en Git y reproducirla en otra base. Las pruebas verifican permisos, rechazo de SQL arbitrario, creación física, inserción de datos, rechazo de duplicados y reproducción de la migración en otra base aislada. Esta herramienta crea estructura; no genera automáticamente endpoints CRUD para esa nueva tabla.
