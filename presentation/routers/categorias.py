from fastapi import APIRouter, Depends, Path, Response, status

from application.services.categoria_service import CategoriaService
from presentation.dependencies import get_categoria_service
from presentation.schemas.dtos.categoria import CategoriaActualizar, CategoriaCrear, CategoriaRespuesta
from presentation.schemas.dtos.comun import errores

router = APIRouter(prefix="/categorias", tags=["Categorías"])

IdCategoria = Path(ge=1, description="ID de la categoría")


@router.post(
    "", response_model=CategoriaRespuesta, status_code=status.HTTP_201_CREATED,
    summary="Crear una categoría",
    description="Registra una categoría nueva. El nombre debe ser único (sin distinguir mayúsculas).",
    responses=errores(409),
)
def crear_categoria(datos: CategoriaCrear, servicio: CategoriaService = Depends(get_categoria_service)):
    return servicio.crear(**datos.model_dump())


@router.get(
    "", response_model=list[CategoriaRespuesta],
    summary="Listar categorías",
    description="Devuelve todas las categorías registradas.",
    responses=errores(),
)
def listar_categorias(servicio: CategoriaService = Depends(get_categoria_service)):
    return servicio.listar()


@router.get(
    "/{categoria_id}", response_model=CategoriaRespuesta,
    summary="Obtener una categoría por ID",
    description="Devuelve una categoría. Responde 404 si no existe.",
    responses=errores(404),
)
def obtener_categoria(categoria_id: int = IdCategoria, servicio: CategoriaService = Depends(get_categoria_service)):
    return servicio.obtener(categoria_id)


@router.put(
    "/{categoria_id}", response_model=CategoriaRespuesta,
    summary="Actualizar una categoría",
    description="Reemplaza todos los datos de la categoría. Debe enviarse el cuerpo completo.",
    responses=errores(404, 409),
)
def actualizar_categoria(
    datos: CategoriaActualizar,
    categoria_id: int = IdCategoria,
    servicio: CategoriaService = Depends(get_categoria_service),
):
    return servicio.actualizar(categoria_id, **datos.model_dump())


@router.delete(
    "/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response,
    summary="Eliminar una categoría",
    description="Elimina la categoría. Responde 409 si todavía tiene productos asociados.",
    responses=errores(404, 409),
)
def eliminar_categoria(categoria_id: int = IdCategoria, servicio: CategoriaService = Depends(get_categoria_service)):
    servicio.eliminar(categoria_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
