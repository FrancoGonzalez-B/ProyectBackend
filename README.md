## API REST – Sistema de Compras y Feedback UX

Repositorio correspondiente al proyecto de evaluacion acumulativa (35%) de la asignatura de Desarrollo de Backend (ICINF1108) de la universidad catolica de Temuco

# 1. Descripcion del proyecto

Este proyecto consiste en el desarrollo de una API REST, lo hicimos utilizando JavaScript, Node.js y Express, orientada a la gestion de una tienda de ropa y sus procesos de administarcion de productos y ususarios.

El sistema busca prorporcionar uan estructura Backend organizada, escalable y mantenible, permitiendo gestionar la inforamcion de los productos, sus categorias, variantes y existencias mediante una base de datos relacional.

La arquitectura esta diseñada pára facilitar la futura incorporacion de funcioanlidades relacioandas con compras, ordenes y retroalimentacion sobre la experiencia del usuario


# 2. Tecnologias utilizadas


- JavaScript, como lenguaje de programacion
- Node.js, como el Entorno de ejecucion
- Express.js, Framework para desarrollar la API REST
- MySQL , sistema de gestion de modelos y relaciones
- XAMPP,  ENtorno local para ejecuatr MySQL
- Git/GitHub, Control de versiones y trabajo colaborativo
- Postman, Purbea de endpoints de la API


# 3. INtegrantes del equipo y repsonsabilidades


- Benjamin Aedo, Coordiancion, documenatcion e integracion.
- Franco Gonzales, DOminio y datos: modelado, validaciones y migraciones.
- Lucas Martinez, API y logica de negocio: endpoints, servicios y repositorios.
- Francisco Martinez, Calidad y pruebas: verificaciones, casos de error y Postman.


# 4. Problematica y alce del proyecto

Nuestro proyecto busca abordar las dificultades presentads en los procesos de compras y la falta de mecanismos estructurados para administrasr y mejorar la experiencia del usuario.

Para ellos, nos planteamos desarrollar una API REST la cual permita administrar la informacion principal de una tienda de ropa.

## - 4.1 Objetivos Principales

adminsitrar usuarios de la plataforma, Gestioanar ategoria de productos, Regsitrar y administrar productos, Gsrtionar variantes de productos como tallas y colores, Controlar los precios y la existencias, Proporcionar una estructura que permita incorporar posteriormente ordenes de compra y funcionalidades feefback UX.


## - 4.2 Alcance actual

La implemnetacion de la capa dominio y datos contempla los modelos ORM, las relaciones entre las entidades, las migarciones y datos iniciales de prueba.


# 5. MOdelo de dominio y estructura de datos

Para organizar la informacion del sitema de implementacion de entidades principales utilizando sequelize ORM.

- 5.1 ENtidades implementadas

- User (Usuario)
Representa a los usuarios registrados en la plataforma.

- Category (Categoría)
Permite organizar los productos según su clasificación.

- Product (Producto)
Almacena la información principal de los productos disponibles en la tienda.

- ProductVariant (Variante de producto)
Permite representar las diferentes variantes de un producto, considerando características como talla, color, precio y stock.

## 5.2 Relaciones entre entidades

La estrcutura de realciones implementada es:

Category
   |
   | 1:N
   |
Product
   |
   | 1:N
   |
ProductVariant

User

- Una categoria puede contener multiples productos.
- Un prodcuto puede tener multiples variantes.
- Cada variante perteneve a un producto
- User constituye a una entidad independiente dentro del modelo actual.


# 6.Arquitectura y organixaccion del Backend

El proyecto utiliza Node.js y Express, organizandosus componentes para separar las responsabildiades de acceso a datos, modelos y la logica dela API.

## 6.1 Componentes principales

- Configuración de base de datos,	Establecer la conexión con MySQL.
- Models,	Definir las entidades y sus atributos.
- Mappers,	Transformar los datos antes de entregarlos a otras capas.
- Migrations,	Crear y modificar la estructura de las tablas.
- Seeders,	Insertar datos iniciales de prueba.
- Controllers,	Gestionar las solicitudes HTTP.
- Routes,	Configuración de base de datos.

# 7.  Base de datos y ORM
Se utiliza MySQL como sistemas de gestion de base de datos y Sequelize como ORM.

Sequelize permite trabjar con las tablas mediante modelos definidos en JavaScript, gestioanr relaciones y ejecutar operaciones sobre la base de datos sin tener que escribir manualmente todas las consultas SQL.

## 7.1 ModeloS ORM
Se implementaron los siguientes modelos:

- User.
- Category.
- Product.
- ProductVariant

## 7.2 Migraciones

Se implementaron migraciones versionadas para crear las siguientes tablas:

- users
- categorias
- products
- product_variants

Tambien se utiliza SequelizeMeta, ta_var

## 7.3 Seeders

Se ejecuto un seeder con los isguientes datos iniciales:

Entidad	             Registros insertados
Categorías	                  2
Productos	                  2
Variantes de productos	      3

Estos datos permiten comprobar la estructura y las relaciones de la base de datos.


## 7.4 Mappers

Se implementaron mappers para las entidades de productos, variantes, categorias y usuarios.

Su finalidad es transformar los datos obtenidos des los modelos ORM a una entructura adecuada para su utilizacion en la aplicacion.

En particular, el mapper de usuarios evita exponer el atributo password dHash en las respuestas.

# 8 Configuracion e instalacion 