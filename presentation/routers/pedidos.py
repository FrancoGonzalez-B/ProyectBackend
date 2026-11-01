from fastapi import APIRouter, Depends, Path, Query, status

from application.services.pedido_service import LineaPedido, PedidoService
from domain.enums import EstadoPedido
from presentation.dependencies import get_pedido_service
from presentation.schemas.dtos.comun import errores
from presentation.schemas.dtos.pedido import PedidoCambiarEstado, PedidoCrear, PedidoRespuesta

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

IdPedido = Path(ge=1, description="ID del pedido")


@router.post(
    "", response_model=PedidoRespuesta, status_code=status.HTTP_201_CREATED,
    summary="Crear un pedido",
    description=(
        "Crea un pedido con sus líneas, calcula el total con los precios actuales y **descuenta el stock**. "
        "Si falta stock en cualquier línea no se aplica ningún cambio (400). "
        "Responde 404 si el cliente o un producto no existen."
    ),
    responses=errores(400, 404),
)
def crear_pedido(datos: PedidoCrear, servicio: PedidoService = Depends(get_pedido_service)):
    lineas = [LineaPedido(producto_id=d.producto_id, cantidad=d.cantidad) for d in datos.detalles]
    return servicio.crear(datos.cliente_id, lineas, datos.direccion_envio)


@router.get(
    "", response_model=list[PedidoRespuesta],
    summary="Listar pedidos",
    description="Devuelve los pedidos; se puede filtrar por cliente y por estado.",
    responses=errores(),
)
def listar_pedidos(
    cliente_id: int | None = Query(default=None, ge=1, description="Solo los pedidos de este cliente"),
    estado: EstadoPedido | None = Query(default=None, description="Solo los pedidos en este estado"),
    servicio: PedidoService = Depends(get_pedido_service),
):
    return servicio.listar(cliente_id=cliente_id, estado=estado)


@router.get(
    "/{pedido_id}", response_model=PedidoRespuesta,
    summary="Obtener un pedido por ID",
    description="Devuelve un pedido con sus detalles. Responde 404 si no existe.",
    responses=errores(404),
)
def obtener_pedido(pedido_id: int = IdPedido, servicio: PedidoService = Depends(get_pedido_service)):
    return servicio.obtener(pedido_id)


@router.patch(
    "/{pedido_id}/estado", response_model=PedidoRespuesta,
    summary="Avanzar el estado de un pedido",
    description=(
        "El estado solo avanza en orden: PENDIENTE → CONFIRMADO → ENVIADO → ENTREGADO. "
        "Cualquier otro salto responde 400. Para cancelar use `POST /pedidos/{pedido_id}/cancelar`."
    ),
    responses=errores(400, 404),
)
def cambiar_estado_pedido(
    datos: PedidoCambiarEstado,
    pedido_id: int = IdPedido,
    servicio: PedidoService = Depends(get_pedido_service),
):
    return servicio.cambiar_estado(pedido_id, datos.estado)


@router.post(
    "/{pedido_id}/cancelar", response_model=PedidoRespuesta,
    summary="Cancelar un pedido",
    description="Cancela un pedido PENDIENTE y **devuelve el stock**. Si ya no está PENDIENTE responde 400.",
    responses=errores(400, 404),
)
def cancelar_pedido(pedido_id: int = IdPedido, servicio: PedidoService = Depends(get_pedido_service)):
    return servicio.cancelar(pedido_id)
