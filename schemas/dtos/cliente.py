from pydantic import BaseModel, ConfigDict, Field

EMAIL_PATRON = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"  
TELEFONO_PATRON = r"^\+?[0-9]{8,15}$"         


class ClienteCrear(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={"examples": [{
            "nombre": "María Soto", "email": "maria.soto@correo.cl",
            "telefono": "+56912345678", "direccion": "Av. Alemania 0123, Temuco",
        }]},
    )

    nombre: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=EMAIL_PATRON, max_length=120, description="Correo único por cliente")  # formato
    telefono: str = Field(pattern=TELEFONO_PATRON)                                                    # formato
    direccion: str = Field(min_length=5, max_length=200)


class ClienteRespuesta(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={"examples": [{
            "id": 1, "nombre": "María Soto", "email": "maria.soto@correo.cl",
            "telefono": "+56912345678", "direccion": "Av. Alemania 0123, Temuco",
        }]},
    )

    id: int
    nombre: str
    email: str
    telefono: str
    direccion: str
