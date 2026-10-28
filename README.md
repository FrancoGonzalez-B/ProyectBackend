API REST- Sistema de compras y Feedback UX

Este repositorio contiene nuestro proyecto para la evaluacion acumulativa (35%)del curso de Desarrolo De Backend (ICINF1108) de la UNiversidad Catolica De Temuco

# Proyecto

Desarrollamos una API REST utilixando Python, FastAPI y SQLAlchemy, la cual esta enfocada en la gestion de compras y, de manera muy especial, en la recoleccion de restroalimentacion (feedback) sobre la experiencia de usuario.

1. Integrantes del Equipo y Responsabilidades


Benjamin Aedo          Cordinacion + Documentacion e integracion
Franco Gonzales        DOminio y datos (Modelado, Validaciones, Migracines)
Lucas Martinez         API y logica de negocio (Endpoints, servicios, repositorios)
Francisco Gonzalez     Calidad y pruebas ( Verificacion, casos de error, Postman)


2. Nuestra Porblematica y Alcance

DEcidimos neofcar nuestro proyecto en resoolver la friccion qu ecxiste entre las compras digitales y la falta de feedback directo. A continuacion, detallamos las definiciones de nuestro alcance:

- 2.1 observamos que los comercios electronicos tradicionales tienen procesos de compra muy rigidos y carecen de un canal nativo y estructuarado en la misma transaccion para que los usuarios reporten fallos o sugieran mejoras de usabilidad.

- 2.2 NUestros actores principales son los Clientes los cuales sufren fricciones, hy los Administradores de la paltaforma que no saben como mejorarala.

- 2.3 Esto genera un abandono de transacciones a la mitad del proceso y el esatncamiento de la plataforma por falta de retroalimentacion directa.

- 2.4  Nuestro Backend getsiona el catalogo de productos, las cuentas de los clientes, las ordenes de compra y las reseñas de experiencia de uso asociadas a cada transaccion.

- 2.5 Diseñamos nuetsro sistema para que permita

Registrar un nuevo cliente
Crear un producto en el catalogo
LIstar y filtrar productos
CRear una orden de compra
LIstar las ordenes de un cliente
Registrar una reseña de usabilidad para una orden especifica
Elimianar un producto inactivo

- 2-6 En estre trabajo acotamos nuesto alcance tecnico por lo tanto no se procesaran targetas reales, no se incluira un chat de soporte en vivo y no se desarrollara un motor de recomendaciones de productos, pero dadoa a la estriuctura de los archivos estos se podrian implementar como mejoras futuras.

- 2.7 Sabremso que nustra solucion funciona cuando: la orden de comora persista en la BD; nose puede evaluar la app sin una orden pagada asociada; el fultardid e productos funcione correctamente; se rechacen compras con datos invalidos; y se exija comentario obliagtorio en rseñas de menosres a 3 estrellas.


3. Nuetsro modelo de dominio y Reglas de Negocio

Para poder modelar esta solucion, definimos 4 entidades principales con una relacion de 1:N (UN cliente tiene muchas Ordenes; Una orden tienen  1 reseña)

- 1 Cliente: id, nombre_completo, correo, telefono, fecha_registro.
- 2 Producto: id, nombre, descripcion, precio, stock_disponible.
- 3 Orden Compra: is, fecha_creacion, total_pagar, estado, Cliente_id.
- 4 Reseña Experiencia: id, calificacion_estrellas, comentario_mejora, facilidad_uso, orden_id.

## Reglas de Negcoio que Implementamos

Definimos las siguientes Restricciones del dominio para proteger la consistencia de los datos:

- No se puede crear una OrdenCOmpra si el prodcuto solicitado tiene stock_disponible igual a 0.

- No se puede registrar ua ResenaExperiencid si la OrdenCOmpra asociada no esta en estado "pagada".

- UNa misma orden no puede tenr mas de una reseña asociada.


4. Arquitectura por Capas y Flujo de Solicitud

Estructuramos nuestro codigo siguiendo los principios de CLean Architecture, Esto nos permitio separar responsabilidades y evitar concentrar la logica o las consultas a la base de datos dentro de los routers.

- app/main.py: Levanta la API de FastAPI.

- presentation/: Acá van los routers/ (los endpoints HTTP como GET, POST). Solo reciben y responden cosas.

- application/: Acá están los services/ (la lógica) y los schemas/ (los Pydantic DTOs que validan que los datos entren bien).

- domain/: Los modelos base y reglas sueltas.

- infrastructure/: Todo lo que toca la base de datos PostgreSQL. Acá están los models/ (SQLAlchemy), repositories/ (las consultas SQL), migrations/ y los seeders/.


¿Como es el recorrido de una peticion? ( Ejemplo: crear un cliente )

- Postman mande el JSON y entra por presnetacion/routers/clientes_router.py.
- Se valida con el esquema Pydantic en application/schemas/ .
- El router se lo pasa a application/services/cliente_service.py que revisa las reglas.
- El servicio le dice a infrastructure/repositories/cliente_repo.py que lo giarde.
- EL repositorio lo mete PostgreSQL y la respuesta hace el camino de vuelta al usuario.


5.  Documentacion de la API (Swagger)

Hicimos todos los endpoints pedidos (CRUD, filtros, etc). Para verlos y probarlos en Swagger, solo se tienen que levantar el proyecto y entrar a http://localhost:8000/docs

