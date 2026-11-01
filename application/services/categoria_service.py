from domain.entities import Categoria
from domain.exceptions import ConflictoDeEstado, RecursoNoEncontrado
from domain.repositories import CategoriaRepository, ProductoRepository


class CategoriaService:
    def __init__(self, categorias: CategoriaRepository, productos: ProductoRepository):
        self._categorias = categorias
        self._productos = productos

    def crear(self, nombre: str, descripcion: str | None = None, activa: bool = True) -> Categoria:
        self._exigir_nombre_libre(nombre)
        return self._categorias.crear(Categoria(nombre=nombre, descripcion=descripcion, activa=activa))

    def listar(self) -> list[Categoria]:
        return self._categorias.listar()

    def obtener(self, categoria_id: int) -> Categoria:
        categoria = self._categorias.obtener_por_id(categoria_id)
        if categoria is None:
            raise RecursoNoEncontrado(
                "No existe una categoría con el ID solicitado",
                detalles=[{"campo": "categoria_id", "valor": categoria_id}],
            )
        return categoria

    def actualizar(self, categoria_id: int, nombre: str, descripcion: str | None, activa: bool) -> Categoria:
        categoria = self.obtener(categoria_id)
        self._exigir_nombre_libre(nombre, ignorar_id=categoria_id)
        categoria.nombre = nombre
        categoria.descripcion = descripcion
        categoria.activa = activa
        return self._categorias.actualizar(categoria)

    def eliminar(self, categoria_id: int) -> None:
        self.obtener(categoria_id)  # 404 si no existe
        # REGLA DE NEGOCIO: no se borra una categoría que aún tiene productos
        cantidad = self._productos.contar_por_categoria(categoria_id)
        if cantidad > 0:
            raise ConflictoDeEstado(
                "No se puede eliminar la categoría porque tiene productos asociados",
                codigo="CATEGORY_HAS_PRODUCTS",
                detalles=[{"categoria_id": categoria_id, "productos_asociados": cantidad}],
            )
        self._categorias.eliminar(categoria_id)

    def _exigir_nombre_libre(self, nombre: str, ignorar_id: int | None = None) -> None:
        existente = self._categorias.obtener_por_nombre(nombre)
        if existente is not None and existente.id != ignorar_id:
            raise ConflictoDeEstado(
                "Ya existe una categoría con ese nombre",
                codigo="CATEGORY_ALREADY_EXISTS",
                detalles=[{"campo": "nombre", "valor": nombre}],
            )
