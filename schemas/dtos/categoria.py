from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoriaCrear(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,  
        json_schema_extra={"examples": [
            {"nombre": "Lácteos", "descripcion": "Leche, quesos y yogures", "activa": True}
        ]},
    )

    nombre: str = Field(min_length=2, max_length=60, description="Nombre único de la categoría")
    descripcion: str | None = Field(default=None, max_length=200)
    activa: bool = True


class CategoriaActualizar(CategoriaCrear):
    """PUT = reemplazo completo: se envían todos los campos."""


class CategoriaRespuesta(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,  
        json_schema_extra={"examples": [{
            "id": 1, "nombre": "Lácteos", "descripcion": "Leche, quesos y yogures",
            "activa": True, "fecha_creacion": "2026-10-30T12:00:00Z",
        }]},
    )

    id: int
    nombre: str
    descripcion: str | None
    activa: bool
    fecha_creacion: datetime
