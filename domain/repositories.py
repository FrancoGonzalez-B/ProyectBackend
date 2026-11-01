from abc import ABC, abstractmethod

from domain.consultas import ConsultaProductos, ResultadoPaginado
from domain.entities import Categoria, Cliente, Pedido, Producto
from domain.enums import EstadoPedido


class CategoriaRepository(ABC):
    @abstractmethod
    def obtener_por_id(self, categoria_id: int) -> Categoria | None: ...

    @abstractmethod
    def obtener_por_nombre(self, nombre: str) -> Categoria | None:
        """Búsqueda sin distinguir mayúsculas/minúsculas."""

    @abstractmethod
    def listar(self) -> list[Categoria]: ...

    @abstractmethod
    def crear(self, categoria: Categoria) -> Categoria: ...

    @abstractmethod
    def actualizar(self, categoria: Categoria) -> Categoria: ...

    @abstractmethod
    def eliminar(self, categoria_id: int) -> None: ...


class ProductoRepository(ABC):
    @abstractmethod
    def obtener_por_id(self, producto_id: int) -> Producto | None: ...

    @abstractmethod
    def obtener_por_sku(self, sku: str) -> Producto | None: ...

    @abstractmethod
    def listar(self, consulta: ConsultaProductos) -> ResultadoPaginado[Producto]:
        """En este orden: 1) filtrar, 2) ordenar, 3) paginar.
        `total` se calcula DESPUÉS de filtrar y ANTES de paginar."""

    @abstractmethod
    def contar_por_categoria(self, categoria_id: int) -> int: ...

    @abstractmethod
    def crear(self, producto: Producto) -> Producto: ...

    @abstractmethod
    def actualizar(self, producto: Producto) -> Producto: ...

    @abstractmethod
    def eliminar(self, producto_id: int) -> None: ...


class ClienteRepository(ABC):
    @abstractmethod
    def obtener_por_id(self, cliente_id: int) -> Cliente | None: ...

    @abstractmethod
    def obtener_por_email(self, email: str) -> Cliente | None:
        """Sin distinguir mayúsculas/minúsculas."""

    @abstractmethod
    def listar(self) -> list[Cliente]: ...

    @abstractmethod
    def crear(self, cliente: Cliente) -> Cliente: ...


class PedidoRepository(ABC):
    @abstractmethod
    def obtener_por_id(self, pedido_id: int) -> Pedido | None:
        """Debe traer también los detalles."""

    @abstractmethod
    def listar(self, cliente_id: int | None = None, estado: EstadoPedido | None = None) -> list[Pedido]: ...

    @abstractmethod
    def crear(self, pedido: Pedido) -> Pedido:
        """Guarda el pedido junto con sus detalles y devuelve ids asignados."""

    @abstractmethod
    def actualizar(self, pedido: Pedido) -> Pedido: ...

    @abstractmethod
    def existe_con_producto(self, producto_id: int) -> bool:
        """¿Algún detalle de pedido usa este producto? (para no borrarlo)"""
