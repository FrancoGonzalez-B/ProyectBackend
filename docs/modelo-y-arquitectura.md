# Modelo de dominio y arquitectura

## Diagrama de clases del dominio

```mermaid
classDiagram
    class Cliente {
        +id
        +nombre
        +email
        +telefono
        +direccion
    }
    class Categoria {
        +id
        +nombre
        +descripcion
        +activa
    }
    class Producto {
        +id
        +nombre
        +sku
        +precio
        +stock
        +estado
    }
    class Variante {
        +id
        +sku
        +talla
        +color
        +precio
        +stock
    }
    class Pedido {
        +id
        +clienteId
        +direccionEnvio
        +estado
        +fecha
        +total
        +avanzarEstado()
        +cancelar()
    }
    class DetallePedido {
        +id
        +pedidoId
        +productoId
        +varianteId
        +cantidad
        +precioUnitario
        +subtotal
    }
    Categoria "1" --> "0..*" Producto : clasifica
    Producto "1" --> "1..*" Variante : ofrece
    Cliente "1" --> "0..*" Pedido : realiza
    Pedido "1" --> "1..*" DetallePedido : contiene
    Variante "1" --> "0..*" DetallePedido : identifica
    Producto "1" --> "0..*" DetallePedido : referencia
```

`Cliente` corresponde al usuario con rol `customer`; las cuentas administrativas son usuarios con rol `admin`. `Producto.stock` es un total derivado de las variantes; la existencia por talla/color se conserva en `Variante.stock`.

## Diagrama de datos persistentes

```mermaid
erDiagram
    categories ||--o{ products : clasifica
    products ||--|{ product_variants : ofrece
    users ||--o{ pedidos : realiza
    pedidos ||--|{ detalles_pedido : contiene
    products ||--o{ detalles_pedido : referencia
    product_variants ||--o{ detalles_pedido : identifica

    categories {
        int id PK
        string name
        string slug UK
        string description
        boolean isActive
    }
    products {
        int id PK
        string name
        string slug UK
        decimal price
        int stock
        string sku UK
        int categoryId FK
    }
    product_variants {
        int id PK
        string sku UK
        string size
        string color
        decimal price
        int stock
        int productId FK
    }
    users {
        int id PK
        string firstName
        string lastName
        string email UK
        string role
        string telefono
        string direccion
    }
    pedidos {
        int id PK
        int cliente_id FK
        string direccion_envio
        string estado
        datetime fecha
        decimal total
    }
    detalles_pedido {
        int id PK
        int pedido_id FK
        int producto_id FK
        int variante_id FK
        int cantidad
        decimal precio_unitario
    }
```

Las claves foráneas, restricciones e índices se crean mediante las migraciones versionadas de `database/migrations/`. Los nombres físicos de columnas coinciden con `field` en los modelos Sequelize.

## Diagrama de capas y recorrido de una solicitud

```mermaid
flowchart LR
    ClienteHTTP[Cliente HTTP o Swagger] --> Rutas[presentation: rutas y middlewares]
    Rutas --> DTO[presentation: DTO y validaciones]
    DTO --> Controlador[presentation: controlador]
    Controlador --> Servicio[application: servicio de caso de uso]
    Servicio --> RepoContrato[domain: contrato de repositorio]
    RepoContrato --> RepoSQL[infrastructure: repositorio Sequelize]
    RepoSQL --> Modelo[infrastructure: modelo ORM]
    Modelo --> MySQL[(MySQL / MariaDB)]
    MySQL --> Modelo --> RepoSQL --> Servicio --> Controlador
```

Ejemplo verificable: `POST /pedidos` valida el DTO en `presentation`, autoriza al propietario o al administrador en el controlador, delega el caso de uso y ejecuta en el repositorio SQL una transacción con el pedido, sus detalles y el descuento de inventario. El repositorio devuelve el pedido y el controlador responde `201`.
