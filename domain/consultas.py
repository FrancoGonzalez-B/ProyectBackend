from dataclasses import dataclass
from typing import Generic, TypeVar

from domain.enums import EstadoProducto

T = TypeVar("T")

CAMPOS_ORDEN_PRODUCTO = ("id", "nombre", "precio", "stock")


@dataclass(frozen=True)
class ConsultaProductos:

    categoria_id: int | None = None
    estado: EstadoProducto | None = None
    buscar: str | None = None
    ordenar_por: str = "id"
    descendente: bool = False
    pagina: int = 1
    limite: int = 10


@dataclass
class ResultadoPaginado(Generic[T]):

    items: list[T]
    total: int
