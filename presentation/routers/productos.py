from fastapi import APIRouter, Depends, Path, Query, Response, status

from application.services.producto_service import ProductoService
from domain.enums import EstadoProducto
from presentation.dependencies import get_producto_service
from presentation.schemas.dtos.comun import Direccion, Pagina, errores
from presentation.schemas.dtos.producto import (
    ProductoActualizar,
    ProductoCrear,
    ProductoOrdenarPor,
    ProductoRespuesta,
)

router = APIRouter(prefix="/productos", tags=["Productos"])

IdProducto = Path(ge=1, description="ID del producto")


@router.post(
    "", response_model=ProductoRespuesta, status_code=status.HTTP_201_CREATED,
    summary="Crear un producto",
    description="Registra un producto. La categoría debe existir (404) y el SKU debe ser único (409).",
    responses=errores(404, 409),
)
def crear_producto(datos: ProductoCrear, servicio: ProductoService = Depends(get_producto_service)):
    return servicio.crear(**datos.model_dump())


@router.get(
    "", response_model=Pagina[ProductoRespuesta],
    summary="Listar productos (filtro, orden y paginación)",
    description=(
        "Un mismo endpoint que **filtra**, luego **ordena** y finalmente **pagina**.\n\n"
        "Ejemplo: `/productos?categoria=Lácteos&ordenar_por=precio&direccion=asc&pagina=1&limite=10`\n\n"
        "`total` y `total_paginas` se calculan sobre los productos que cumplen el filtro."
    ),
    responses=errores(),
)
def listar_productos(
    categoria: str | None = Query(default=None, description="Nombre de la categoría (sin distinguir mayúsculas)"),
    estado: EstadoProducto | None = Query(default=None, description="Estado del producto"),
    buscar: str | None = Query(default=None, min_length=1, max_length=100, description="Texto contenido en el nombre"),
    ordenar_por: ProductoOrdenarPor = Query(default=ProductoOrdenarPor.ID, description="Campo de ordenamiento"),
    direccion: Direccion = Query(default=Direccion.ASC, description="asc o desc"),
    pagina: int = Query(default=1, ge=1, description="Número de página (desde 1)"),
    limite: int = Query(default=10, ge=1, le=100, description="Elementos por página (1 a 100)"),
    servicio: ProductoService = Depends(get_producto_service),
):
    resultado = servicio.listar(
        categoria=categoria, estado=estado, buscar=buscar,
        ordenar_por=ordenar_por.value, descendente=(direccion == Direccion.DESC),
        pagina=pagina, limite=limite,
    )
    return Pagina[ProductoRespuesta].construir(
        items=[ProductoRespuesta.model_validate(p) for p in resultado.items],
        total=resultado.total, pagina=pagina, limite=limite,
    )


@router.get(
    "/{producto_id}", response_model=ProductoRespuesta,
    summary="Obtener un producto por ID",
    description="Devuelve un producto. Responde 404 si no existe.",
    responses=errores(404),
)
def obtener_producto(producto_id: int = IdProducto, servicio: ProductoService = Depends(get_producto_service)):
    return servicio.obtener(producto_id)


@router.put(
    "/{producto_id}", response_model=ProductoRespuesta,
    summary="Actualizar un producto",
    description="Reemplaza todos los datos del producto. Debe enviarse el cuerpo completo.",
    responses=errores(404, 409),
)
def actualizar_producto(
    datos: ProductoActualizar,
    producto_id: int = IdProducto,
    servicio: ProductoService = Depends(get_producto_service),
):
    return servicio.actualizar(producto_id, **datos.model_dump())


@router.delete(
    "/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response,
    summary="Eliminar un producto",
    description="Elimina el producto. Responde 409 si ya aparece en pedidos (use DESCONTINUADO).",
    responses=errores(404, 409),
)
def eliminar_producto(producto_id: int = IdProducto, servicio: ProductoService = Depends(get_producto_service)):
    servicio.eliminar(producto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
