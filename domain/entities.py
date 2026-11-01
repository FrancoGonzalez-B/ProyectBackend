from dataclasses import dataclass, field
from datetime import datetime, timezone

from domain.enums import EstadoPedido, EstadoProducto
from domain.exceptions import ReglaDeNegocioViolada


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Categoria:
    nombre: str
    descripcion: str | None = None
    activa: bool = True
    fecha_creacion: datetime = field(default_factory=_ahora)
    id: int | None = None


@dataclass
class Cliente:
    nombre: str
    email: str
    telefono: str
    direccion: str
    id: int | None = None


@dataclass
class Producto:
    nombre: str
    precio: int
    stock: int
    sku: str
    categoria_id: int
    descripcion: str | None = None
    estado: EstadoProducto = EstadoProducto.DISPONIBLE
    id: int | None = None

    def tiene_stock_para(self, cantidad: int) -> bool:
        return cantidad <= self.stock

    def descontar_stock(self, cantidad: int) -> None:
        """Regla: nunca se puede vender más de lo que hay."""
        if not self.tiene_stock_para(cantidad):
            raise ReglaDeNegocioViolada(
                f"Stock insuficiente para «{self.nombre}»",
                codigo="INSUFFICIENT_STOCK",
                detalles=[{"producto_id": self.id, "stock_disponible": self.stock, "cantidad_solicitada": cantidad}],
            )
        self.stock -= cantidad
        if self.stock == 0 and self.estado == EstadoProducto.DISPONIBLE:
            self.estado = EstadoProducto.AGOTADO

    def reponer_stock(self, cantidad: int) -> None:
        self.stock += cantidad
        if self.estado == EstadoProducto.AGOTADO and self.stock > 0:
            self.estado = EstadoProducto.DISPONIBLE


@dataclass
class DetallePedido:
    producto_id: int
    cantidad: int
    precio_unitario: int  
    pedido_id: int | None = None
    id: int | None = None

    @property
    def subtotal(self) -> int:
        return self.cantidad * self.precio_unitario


_SIGUIENTE_ESTADO = {
    EstadoPedido.PENDIENTE: EstadoPedido.CONFIRMADO,
    EstadoPedido.CONFIRMADO: EstadoPedido.ENVIADO,
    EstadoPedido.ENVIADO: EstadoPedido.ENTREGADO,
}


@dataclass
class Pedido:
    cliente_id: int
    direccion_envio: str
    detalles: list[DetallePedido]
    estado: EstadoPedido = EstadoPedido.PENDIENTE
    fecha: datetime = field(default_factory=_ahora)
    id: int | None = None

    @property
    def total(self) -> int:
        return sum(d.subtotal for d in self.detalles)

    def avanzar_a(self, nuevo: EstadoPedido) -> None:
        """Regla: el estado solo avanza en orden PENDIENTE→CONFIRMADO→ENVIADO→ENTREGADO."""
        permitido = _SIGUIENTE_ESTADO.get(self.estado)
        if permitido != nuevo:
            raise ReglaDeNegocioViolada(
                f"No se puede pasar de {self.estado.value} a {nuevo.value}",
                codigo="INVALID_STATE_TRANSITION",
                detalles=[{
                    "estado_actual": self.estado.value,
                    "estado_solicitado": nuevo.value,
                    "siguiente_permitido": permitido.value if permitido else None,
                }],
            )
        self.estado = nuevo

    def cancelar(self) -> None:
        """Regla: solo se cancela un pedido PENDIENTE."""
        if self.estado != EstadoPedido.PENDIENTE:
            raise ReglaDeNegocioViolada(
                f"Solo se pueden cancelar pedidos PENDIENTES (este está {self.estado.value})",
                codigo="ORDER_NOT_CANCELLABLE",
                detalles=[{"estado_actual": self.estado.value}],
            )
        self.estado = EstadoPedido.CANCELADO
