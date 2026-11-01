from domain.consultas import CAMPOS_ORDEN_PRODUCTO, ConsultaProductos, ResultadoPaginado
from domain.entities import Producto
from domain.enums import EstadoProducto
from domain.exceptions import ConflictoDeEstado, RecursoNoEncontrado
from domain.repositories import CategoriaRepository, PedidoRepository, ProductoRepository


class ProductoService:
    def __init__(self, productos: ProductoRepository, categorias: CategoriaRepository, pedidos: PedidoRepository):
        self._productos = productos
        self._categorias = categorias
        self._pedidos = pedidos

    def crear(
        self,
        nombre: str,
        precio: int,
        stock: int,
        sku: str,
        categoria_id: int,
        descripcion: str | None = None,
        estado: EstadoProducto = EstadoProducto.DISPONIBLE,
    ) -> Producto:
        self._exigir_categoria_existente(categoria_id)
        self._exigir_sku_libre(sku)
        producto = Producto(
            nombre=nombre, precio=precio, stock=stock, sku=sku,
            categoria_id=categoria_id, descripcion=descripcion, estado=estado,
        )
        return self._productos.crear(producto)

    def listar(
        self,
        categoria: str | None = None,
        estado: EstadoProducto | None = None,
        buscar: str | None = None,
        ordenar_por: str = "id",
        descendente: bool = False,
        pagina: int = 1,
        limite: int = 10,
    ) -> ResultadoPaginado[Producto]:
        """Filtra por categoría (NOMBRE), estado y texto; ordena y pagina."""
        if ordenar_por not in CAMPOS_ORDEN_PRODUCTO:  
            ordenar_por = "id"

        categoria_id = None
        if categoria is not None:
            encontrada = self._categorias.obtener_por_nombre(categoria)
            if encontrada is None:
                return ResultadoPaginado(items=[], total=0)
            categoria_id = encontrada.id

        consulta = ConsultaProductos(
            categoria_id=categoria_id, estado=estado, buscar=buscar,
            ordenar_por=ordenar_por, descendente=descendente, pagina=pagina, limite=limite,
        )
        return self._productos.listar(consulta)

    def obtener(self, producto_id: int) -> Producto:
        producto = self._productos.obtener_por_id(producto_id)
        if producto is None:
            raise RecursoNoEncontrado(
                "No existe un producto con el ID solicitado",
                detalles=[{"campo": "producto_id", "valor": producto_id}],
            )
        return producto

    def actualizar(
        self,
        producto_id: int,
        nombre: str,
        precio: int,
        stock: int,
        sku: str,
        categoria_id: int,
        descripcion: str | None,
        estado: EstadoProducto,
    ) -> Producto:
        producto = self.obtener(producto_id)
        self._exigir_categoria_existente(categoria_id)
        self._exigir_sku_libre(sku, ignorar_id=producto_id)
        producto.nombre = nombre
        producto.precio = precio
        producto.stock = stock
        producto.sku = sku
        producto.categoria_id = categoria_id
        producto.descripcion = descripcion
        producto.estado = estado
        return self._productos.actualizar(producto)

    def eliminar(self, producto_id: int) -> None:
        self.obtener(producto_id)  
        if self._pedidos.existe_con_producto(producto_id):
            raise ConflictoDeEstado(
                "No se puede eliminar el producto porque aparece en pedidos; "
                "cámbielo a DESCONTINUADO en su lugar",
                codigo="PRODUCT_IN_USE",
                detalles=[{"producto_id": producto_id}],
            )
        self._productos.eliminar(producto_id)

    def _exigir_categoria_existente(self, categoria_id: int) -> None:
        """Validación «existencia relacionada»."""
        if self._categorias.obtener_por_id(categoria_id) is None:
            raise RecursoNoEncontrado(
                "No existe una categoría con el ID indicado",
                detalles=[{"campo": "categoria_id", "valor": categoria_id}],
            )

    def _exigir_sku_libre(self, sku: str, ignorar_id: int | None = None) -> None:
        existente = self._productos.obtener_por_sku(sku)
        if existente is not None and existente.id != ignorar_id:
            raise ConflictoDeEstado(
                "Ya existe un producto con ese SKU",
                codigo="SKU_ALREADY_EXISTS",
                detalles=[{"campo": "sku", "valor": sku}],
            )
