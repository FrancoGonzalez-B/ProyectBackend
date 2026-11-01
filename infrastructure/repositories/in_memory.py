"""REPOSITORIOS EN MEMORIA — SOLO TEMPORAL.

Sirven para que C pueda desarrollar y probar servicios y endpoints mientras B
termina los repositorios reales con SQLAlchemy. Cumplen exactamente las mismas
interfaces de domain/repositories.py, así que cuando B termine solo hay que
cambiar 4 funciones en presentation/dependencies.py.

Los datos se pierden al reiniciar: NO cumplen el requisito de persistencia.
Se copian objetos al guardar y al leer (deepcopy) para imitar a una BD: si el
servicio modifica una entidad pero no llama a `actualizar`, el cambio no se guarda.
"""
from copy import deepcopy

from domain.consultas import CAMPOS_ORDEN_PRODUCTO, ConsultaProductos, ResultadoPaginado
from domain.entities import Categoria, Cliente, Pedido, Producto
from domain.enums import EstadoPedido
from domain.repositories import (
    CategoriaRepository,
    ClienteRepository,
    PedidoRepository,
    ProductoRepository,
)


class AlmacenEnMemoria:
    """Las «tablas» y los contadores de ID (equivalente al autoincrement)."""

    def __init__(self) -> None:
        self.reiniciar()

    def reiniciar(self) -> None:
        self.categorias: dict[int, Categoria] = {}
        self.productos: dict[int, Producto] = {}
        self.clientes: dict[int, Cliente] = {}
        self.pedidos: dict[int, Pedido] = {}
        self._contadores = {"categorias": 0, "productos": 0, "clientes": 0, "pedidos": 0, "detalles": 0}

    def siguiente_id(self, tabla: str) -> int:
        self._contadores[tabla] += 1
        return self._contadores[tabla]


almacen = AlmacenEnMemoria()  # una sola instancia compartida por toda la aplicación


class CategoriaEnMemoria(CategoriaRepository):
    def __init__(self, almacen: AlmacenEnMemoria):
        self._a = almacen

    def obtener_por_id(self, categoria_id):
        return deepcopy(self._a.categorias.get(categoria_id))

    def obtener_por_nombre(self, nombre):
        for c in self._a.categorias.values():
            if c.nombre.lower() == nombre.lower():
                return deepcopy(c)
        return None

    def listar(self):
        return [deepcopy(c) for c in self._a.categorias.values()]

    def crear(self, categoria):
        categoria = deepcopy(categoria)
        categoria.id = self._a.siguiente_id("categorias")
        self._a.categorias[categoria.id] = categoria
        return deepcopy(categoria)

    def actualizar(self, categoria):
        self._a.categorias[categoria.id] = deepcopy(categoria)
        return deepcopy(categoria)

    def eliminar(self, categoria_id):
        self._a.categorias.pop(categoria_id, None)


class ProductoEnMemoria(ProductoRepository):
    def __init__(self, almacen: AlmacenEnMemoria):
        self._a = almacen

    def obtener_por_id(self, producto_id):
        return deepcopy(self._a.productos.get(producto_id))

    def obtener_por_sku(self, sku):
        for p in self._a.productos.values():
            if p.sku.lower() == sku.lower():
                return deepcopy(p)
        return None

    def listar(self, consulta: ConsultaProductos) -> ResultadoPaginado[Producto]:
        if consulta.ordenar_por not in CAMPOS_ORDEN_PRODUCTO:
            raise ValueError(f"Campo de orden no permitido: {consulta.ordenar_por}")

        items = list(self._a.productos.values())

        # 1) FILTRAR
        if consulta.categoria_id is not None:
            items = [p for p in items if p.categoria_id == consulta.categoria_id]
        if consulta.estado is not None:
            items = [p for p in items if p.estado == consulta.estado]
        if consulta.buscar:
            texto = consulta.buscar.lower()
            items = [p for p in items if texto in p.nombre.lower()]

        total = len(items)  # total de los que cumplen el filtro (antes de paginar)

        # 2) ORDENAR (primero por id para que los empates queden siempre en el mismo orden)
        items.sort(key=lambda p: p.id)
        if consulta.ordenar_por != "id":
            def clave(p):
                valor = getattr(p, consulta.ordenar_por)
                return valor.lower() if isinstance(valor, str) else valor
            items.sort(key=clave, reverse=consulta.descendente)
        elif consulta.descendente:
            items.reverse()

        # 3) PAGINAR
        inicio = (consulta.pagina - 1) * consulta.limite
        pagina = items[inicio:inicio + consulta.limite]
        return ResultadoPaginado(items=[deepcopy(p) for p in pagina], total=total)

    def contar_por_categoria(self, categoria_id):
        return sum(1 for p in self._a.productos.values() if p.categoria_id == categoria_id)

    def crear(self, producto):
        producto = deepcopy(producto)
        producto.id = self._a.siguiente_id("productos")
        self._a.productos[producto.id] = producto
        return deepcopy(producto)

    def actualizar(self, producto):
        self._a.productos[producto.id] = deepcopy(producto)
        return deepcopy(producto)

    def eliminar(self, producto_id):
        self._a.productos.pop(producto_id, None)


class ClienteEnMemoria(ClienteRepository):
    def __init__(self, almacen: AlmacenEnMemoria):
        self._a = almacen

    def obtener_por_id(self, cliente_id):
        return deepcopy(self._a.clientes.get(cliente_id))

    def obtener_por_email(self, email):
        for c in self._a.clientes.values():
            if c.email.lower() == email.lower():
                return deepcopy(c)
        return None

    def listar(self):
        return [deepcopy(c) for c in self._a.clientes.values()]

    def crear(self, cliente):
        cliente = deepcopy(cliente)
        cliente.id = self._a.siguiente_id("clientes")
        self._a.clientes[cliente.id] = cliente
        return deepcopy(cliente)


class PedidoEnMemoria(PedidoRepository):
    def __init__(self, almacen: AlmacenEnMemoria):
        self._a = almacen

    def obtener_por_id(self, pedido_id):
        return deepcopy(self._a.pedidos.get(pedido_id))

    def listar(self, cliente_id=None, estado: EstadoPedido | None = None):
        pedidos = sorted(self._a.pedidos.values(), key=lambda p: p.id)
        if cliente_id is not None:
            pedidos = [p for p in pedidos if p.cliente_id == cliente_id]
        if estado is not None:
            pedidos = [p for p in pedidos if p.estado == estado]
        return [deepcopy(p) for p in pedidos]

    def crear(self, pedido):
        pedido = deepcopy(pedido)
        pedido.id = self._a.siguiente_id("pedidos")
        for detalle in pedido.detalles:
            detalle.id = self._a.siguiente_id("detalles")
            detalle.pedido_id = pedido.id
        self._a.pedidos[pedido.id] = pedido
        return deepcopy(pedido)

    def actualizar(self, pedido):
        self._a.pedidos[pedido.id] = deepcopy(pedido)
        return deepcopy(pedido)

    def existe_con_producto(self, producto_id):
        return any(d.producto_id == producto_id for p in self._a.pedidos.values() for d in p.detalles)
