from enum import Enum


class EstadoProducto(str, Enum):
    DISPONIBLE = "DISPONIBLE"
    AGOTADO = "AGOTADO"
    DESCONTINUADO = "DESCONTINUADO"


class EstadoPedido(str, Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADO = "CONFIRMADO"
    ENVIADO = "ENVIADO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"
