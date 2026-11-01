from fastapi import APIRouter, Depends, Path, status

from application.services.cliente_service import ClienteService
from presentation.dependencies import get_cliente_service
from presentation.schemas.dtos.cliente import ClienteCrear, ClienteRespuesta
from presentation.schemas.dtos.comun import errores

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post(
    "", response_model=ClienteRespuesta, status_code=status.HTTP_201_CREATED,
    summary="Registrar un cliente",
    description="Registra un cliente. El correo debe tener formato válido y no estar repetido (409).",
    responses=errores(409),
)
def crear_cliente(datos: ClienteCrear, servicio: ClienteService = Depends(get_cliente_service)):
    return servicio.crear(**datos.model_dump())


@router.get(
    "", response_model=list[ClienteRespuesta],
    summary="Listar clientes",
    description="Devuelve todos los clientes registrados.",
    responses=errores(),
)
def listar_clientes(servicio: ClienteService = Depends(get_cliente_service)):
    return servicio.listar()


@router.get(
    "/{cliente_id}", response_model=ClienteRespuesta,
    summary="Obtener un cliente por ID",
    description="Devuelve un cliente. Responde 404 si no existe.",
    responses=errores(404),
)
def obtener_cliente(
    cliente_id: int = Path(ge=1, description="ID del cliente"),
    servicio: ClienteService = Depends(get_cliente_service),
):
    return servicio.obtener(cliente_id)
