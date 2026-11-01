from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from domain.enums import EstadoProducto

SKU_PATRON = r"^[A-Z0-9][A-Z0-9-]{2,19}$"


class ProductoOrdenarPor(str, Enum):
    """Campos permitidos en `ordenar_por` (validación de valores permitidos)."""

    ID = "id"
    NOMBRE = "nombre"
    PRECIO = "precio"
    STOCK = "stock"


class ProductoCrear(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={"examples": [{
            "nombre": "Leche entera 1L", "descripcion": "Caja de 1 litro",
            "precio": 1190, "stock": 120, "sku": "LECH-001",
            "estado": "DISPONIBLE", "categoria_id": 1,
        }]},
    )

    nombre: str = Field(min_length=2, max_length=100)                            
    descripcion: str | None = Field(default=None, max_length=300)
    precio: int = Field(gt=0, le=10_000_000, description="Precio en pesos chilenos (CLP), entero") 
    stock: int = Field(ge=0, le=100_000, description="Unidades disponibles")          
    sku: str = Field(pattern=SKU_PATRON, description="Código único. Ej.: LECH-001")    
    estado: EstadoProducto = EstadoProducto.DISPONIBLE                                
    categoria_id: int = Field(gt=0, description="ID de una categoría existente")


class ProductoActualizar(ProductoCrear):
    """PUT = reemplazo completo: se envían todos los campos."""


class ProductoRespuesta(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={"examples": [{
            "id": 1, "nombre": "Leche entera 1L", "descripcion": "Caja de 1 litro",
            "precio": 1190, "stock": 120, "sku": "LECH-001",
            "estado": "DISPONIBLE", "categoria_id": 1,
        }]},
    )

    id: int
    nombre: str
    descripcion: str | None
    precio: int
    stock: int
    sku: str
    estado: EstadoProducto
    categoria_id: int
