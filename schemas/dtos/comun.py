import math
from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Direccion(str, Enum):
    """Parámetro `direccion`: acepta solamente asc o desc."""

    ASC = "asc"
    DESC = "desc"


class Pagina(BaseModel, Generic[T]):
    """Respuesta estándar de toda colección paginada (estructura exigida por la guía)."""

    items: list[T]
    total: int = Field(description="Registros que cumplen el filtro (no solo los de esta página)")
    pagina: int
    limite: int
    total_paginas: int

    @classmethod
    def construir(cls, items: list, total: int, pagina: int, limite: int) -> "Pagina[T]":
        total_paginas = math.ceil(total / limite) if total > 0 else 0
        return cls(items=items, total=total, pagina=pagina, limite=limite, total_paginas=total_paginas)


class DetalleError(BaseModel):
    code: str = Field(examples=["RESOURCE_NOT_FOUND"])
    message: str = Field(examples=["No existe un producto con el ID solicitado"])
    details: list[dict] = Field(default_factory=list)


class ErrorRespuesta(BaseModel):
    """Estructura ÚNICA de todos los errores de la API."""

    error: DetalleError


_DESCRIPCION_ERRORES = {
    400: "Viola una regla de negocio",
    404: "El recurso solicitado no existe",
    409: "Conflicto con el estado actual (duplicado o recurso en uso)",
    422: "Los datos no cumplen el esquema o las validaciones",
}


def errores(*codigos: int) -> dict:
    """Documenta en OpenAPI los errores posibles de un endpoint (siempre incluye el 422)."""
    todos = sorted(set(codigos) | {422})
    return {c: {"model": ErrorRespuesta, "description": _DESCRIPCION_ERRORES[c]} for c in todos}
