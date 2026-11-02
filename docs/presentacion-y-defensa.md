# Guion para la presentación y defensa

Este guion cubre la secuencia exigida por la pauta en diez minutos. Preparar una presentación visual de hasta 15 diapositivas usando estos títulos; el guion no reemplaza el archivo de diapositivas.

La presentación navegable está en [presentacion.html](presentacion.html); se puede abrir en un navegador y recorrer con los botones o las flechas del teclado.

## Respuestas P1–P7

- **P1 — Situación:** el catálogo, las tallas disponibles y los pedidos pueden quedar en registros separados, haciendo difícil comprobar el stock real antes de vender.
- **P2 — Actores:** administradores de la tienda y clientes.
- **P3 — Consecuencias:** se puede ofrecer una variante sin stock y resulta difícil seguir el estado de una compra.
- **P4 — Información:** usuarios, categorías, productos, SKU, precios, tallas, colores, stock, direcciones y pedidos con sus detalles.
- **P5 — Acciones:** registrar e iniciar sesión; administrar categorías; administrar productos; consultar el catálogo con búsqueda, filtros, orden y páginas; administrar variantes y stock; administrar clientes; crear y consultar pedidos; avanzar o cancelar pedidos pendientes.
- **P6 — Exclusiones:** no incluye frontend, cobro con pasarela real ni integración real con operadores logísticos.
- **P7 — Aceptación:** salud responde 200; OpenAPI describe al menos 12 operaciones; un recurso permite CRUD; las entradas inválidas y los recursos inexistentes responden con error JSON; el filtro/orden/paginación entrega metadatos; crear pedidos descuenta stock transaccionalmente; una modificación sigue disponible después de reiniciar la API.

## Secuencia sugerida

| Diapositiva | Tiempo | Contenido y evidencia |
| --- | ---: | --- |
| 1. Problema y usuarios | 1:00 | Quienes administran una tienda necesitan mantener catálogo, tallas y stock coordinados; clientes necesitan consultar productos y hacer seguimiento de pedidos. |
| 2. Alcance y aceptación | 0:45 | La API registra catálogo, inventario, clientes y pedidos; excluye frontend, pasarela de pago y logística real. Aceptación: CRUD, reglas de inventario, consulta filtrada, autenticación y datos persistentes. |
| 3. Modelo de dominio | 1:00 | Presentar categorías, productos, variantes, clientes, pedidos y detalles; explicar las relaciones 1:N del diagrama de datos. |
| 4. Reglas de negocio | 1:00 | Stock por variante; total calculado por el servidor; transición de estados; cancelación que repone una sola vez; pedido dentro de una transacción. |
| 5. Contrato REST y OpenAPI | 0:45 | Mostrar Swagger y recorrer rutas de catálogo, autenticación y pedidos; distinguir DTO de entrada de la respuesta. |
| 6. Arquitectura y recorrido | 1:15 | Seguir `POST /pedidos`: ruta/DTO → controlador → servicio → repositorio Sequelize → MySQL, con respuesta por la misma cadena. |
| 7. Migraciones y datos | 0:45 | Mostrar `.env.example`, migraciones y seeders. La base local usa un nombre de pruebas aislado. |
| 8. Demostración HTTP | 1:30 | Mostrar salud, consulta filtrada/ordenada/paginada, creación CRUD y una respuesta de error. |
| 9. Pruebas y persistencia | 1:00 | Ejecutar `npm test`, `npm run test:integration` y `npm run db:verify`; repetir una lectura después de reiniciar la API. |
| 10. Decisiones y mejoras | 1:00 | Justificar inventario por variante y transacciones. Limitación: no hay pago real; mejoras: integración de pago y despacho. |

El tiempo total sugerido es diez minutos. Las diapositivas deben conservar texto legible, contraste suficiente y no comunicar resultados únicamente mediante color.

## Requisitos para completar con el grupo

El grupo informado tiene cuatro integrantes; coordinación y documentación/integración se combinan. Completar las ramas y los pull requests reales de cada integrante antes de presentar.

| Integrante | Responsabilidad principal | Rama / pull request |
| --- | --- | --- |
| Benjamin Aedo | Coordinación y seguimiento; documentación e integración | Completar |
| Franco Gonzales | Dominio y datos | Completar |
| Lucas Martinez | API y lógica de negocio | Completar |
| Francisco Martinez | Calidad y pruebas | Completar |

Cada integrante debe poder explicar el recorrido entre capas, el modelo, la persistencia, las migraciones y las pruebas; la persona sorteada presenta la exposición completa.
