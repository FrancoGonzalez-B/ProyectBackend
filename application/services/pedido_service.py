from dataclasses import dataclass
from domain.entities import DetallePedido, Pedido
from domain.enums import EstadoPedido, EstadoProducto
from domain.exceptions import RecursoNoEncontrado, ReglaDeNegocioViolada
from domain.repositories import ClienteRepository, PedidoRepository, ProductoRepository


@dataclass(frozen=True)
class LineaPedido:

    producto_id: int
    cantidad: int


class PedidoService:
    def __init__(self, pedidos: PedidoRepository, productos: ProductoRepository, clientes: ClienteRepository):
        self._pedidos = pedidos
        self._productos = productos
        self._clientes = clientes

    def crear(self, cliente_id: int, lineas: list[LineaPedido], direccion_envio: str | None = None) -> Pedido:

        cliente = self._clientes.obtener_por_id(cliente_id)
        if cliente is None:
            raise RecursoNoEncontrado(
                "No existe un cliente con el ID indicado",
                detalles=[{"campo": "cliente_id", "valor": cliente_id}],
            )

        productos = {}
        inexistentes, no_disponibles, sin_stock = [], [], []
        for indice, linea in enumerate(lineas):
            producto = self._productos.obtener_por_id(linea.producto_id)
            if producto is None:
                inexistentes.append({"campo": f"detalles[{indice}].producto_id", "valor": linea.producto_id})
                continue
            productos[linea.producto_id] = producto
            if producto.estado == EstadoProducto.DESCONTINUADO:
                no_disponibles.append({"producto_id": producto.id, "nombre": producto.nombre})
            elif not producto.tiene_stock_para(linea.cantidad):
                sin_stock.append({
                    "producto_id": producto.id,
                    "nombre": producto.nombre,
                    "stock_disponible": producto.stock,
                    "cantidad_solicitada": linea.cantidad,
                })

        if inexistentes:
            raise RecursoNoEncontrado("Uno o más productos del pedido no existen", detalles=inexistentes)
        if no_disponibles:
            raise ReglaDeNegocioViolada(
                "Hay productos descontinuados en el pedido",
                codigo="PRODUCT_NOT_AVAILABLE", detalles=no_disponibles,
            )
        if sin_stock:
            raise ReglaDeNegocioViolada(
                "No hay stock suficiente para uno o más productos",
                codigo="INSUFFICIENT_STOCK", detalles=sin_stock,
            )

        detalles = []
        for linea in lineas:
            producto = productos[linea.producto_id]
            producto.descontar_stock(linea.cantidad)
            self._productos.actualizar(producto)
            detalles.append(DetallePedido(
                producto_id=producto.id, cantidad=linea.cantidad, precio_unitario=producto.precio,
            ))

        pedido = Pedido(
            cliente_id=cliente.id,
            direccion_envio=direccion_envio or cliente.direccion,
            detalles=detalles,
        )
        return self._pedidos.crear(pedido)

    def listar(self, cliente_id: int | None = None, estado: EstadoPedido | None = None) -> list[Pedido]:
        return self._pedidos.listar(cliente_id=cliente_id, estado=estado)

    def obtener(self, pedido_id: int) -> Pedido:
        pedido = self._pedidos.obtener_por_id(pedido_id)
        if pedido is None:
            raise RecursoNoEncontrado(
                "No existe un pedido con el ID solicitado",
                detalles=[{"campo": "pedido_id", "valor": pedido_id}],
            )
        return pedido

    def cambiar_estado(self, pedido_id: int, nuevo_estado: EstadoPedido) -> Pedido:
        pedido = self.obtener(pedido_id)
        pedido.avanzar_a(nuevo_estado)  
        return self._pedidos.actualizar(pedido)

    def cancelar(self, pedido_id: int) -> Pedido:
        """Cancela un pedido PENDIENTE y devuelve el stock de cada línea."""
        pedido = self.obtener(pedido_id)
        pedido.cancelar() 
        for detalle in pedido.detalles:
            producto = self._productos.obtener_por_id(detalle.producto_id)
            producto.reponer_stock(detalle.cantidad)
            self._productos.actualizar(producto)
        return self._pedidos.actualizar(pedido)
