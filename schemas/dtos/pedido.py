from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator
from domain.enums import EstadoPedido


class DetallePedidoCrear(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=1000, description="Unidades que se quieren comprar")


class PedidoCrear(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={"examples": [{
            "cliente_id": 1,
            "direccion_envio": "Av. Alemania 0123, Temuco",
            "detalles": [{"producto_id": 1, "cantidad": 2}, {"producto_id": 3, "cantidad": 1}],
        }]},
    )

    cliente_id: int = Field(gt=0)
    direccion_envio: str | None = Field(
        default=None, min_length=5, max_length=200,
        description="Opcional: si se omite se usa la dirección del cliente",
    )
    detalles: list[DetallePedidoCrear] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def _sin_productos_repetidos(self):
        ids = [d.producto_id for d in self.detalles]
        if len(ids) != len(set(ids)):
            raise ValueError("No se puede repetir un producto en el mismo pedido; sume sus cantidades")
        return self


class PedidoCambiarEstado(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{"estado": "CONFIRMADO"}]})

    estado: EstadoPedido


class DetallePedidoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    cantidad: int
    precio_unitario: int
    subtotal: int


class PedidoRespuesta(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={"examples": [{
            "id": 1, "cliente_id": 1, "fecha": "2026-10-30T12:00:00Z", "estado": "PENDIENTE",
            "direccion_envio": "Av. Alemania 0123, Temuco", "total": 3570,
            "detalles": [{"id": 1, "producto_id": 1, "cantidad": 3, "precio_unitario": 1190, "subtotal": 3570}],
        }]},
    )

    id: int
    cliente_id: int
    fecha: datetime
    estado: EstadoPedido
    direccion_envio: str
    total: int
    detalles: list[DetallePedidoRespuesta]
