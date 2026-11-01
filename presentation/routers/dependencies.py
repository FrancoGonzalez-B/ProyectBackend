from fastapi import Depends
from sqlalchemy.orm import Session
from application.services.categoria_service import CategoriaService
from application.services.cliente_service import ClienteService
from application.services.pedido_service import PedidoService
from application.services.producto_service import ProductoService
from domain.repositories import (
    CategoriaRepository,
    ClienteRepository,
    PedidoRepository,
    ProductoRepository,
)
from infrastructure.repositories.in_memory import (
    CategoriaEnMemoria,
    ClienteEnMemoria,
    PedidoEnMemoria,
    ProductoEnMemoria,
    almacen,
)

def get_sesion() -> Session:
    yield None  

def get_categoria_repo(
    sesion: Session = Depends(get_sesion),
) -> CategoriaRepository:
    return CategoriaEnMemoria(almacen)

def get_producto_repo(
    sesion: Session = Depends(get_sesion),
) -> ProductoRepository:
    return ProductoEnMemoria(almacen)

def get_cliente_repo(
    sesion: Session = Depends(get_sesion),
) -> ClienteRepository:
    return ClienteEnMemoria(almacen)

def get_pedido_repo(
    sesion: Session = Depends(get_sesion),
) -> PedidoRepository:
    return PedidoEnMemoria(almacen)

def get_categoria_service(
    categorias: CategoriaRepository = Depends(get_categoria_repo),
    productos: ProductoRepository = Depends(get_producto_repo),
) -> CategoriaService:
    return CategoriaService(categorias, productos)

def get_producto_service(
    productos: ProductoRepository = Depends(get_producto_repo),
    categorias: CategoriaRepository = Depends(get_categoria_repo),
    pedidos: PedidoRepository = Depends(get_pedido_repo),
) -> ProductoService:
    return ProductoService(productos, categorias, pedidos)

def get_cliente_service(
    clientes: ClienteRepository = Depends(get_cliente_repo),
) -> ClienteService:
    return ClienteService(clientes)

def get_pedido_service(
    pedidos: PedidoRepository = Depends(get_pedido_repo),
    productos: ProductoRepository = Depends(get_producto_repo),
    clientes: ClienteRepository = Depends(get_cliente_repo),
) -> PedidoService:
    return PedidoService(pedidos, productos, clientes)