
import pytest
from application.services.categoria_service import CategoriaService
from application.services.cliente_service import ClienteService
from application.services.pedido_service import PedidoService
from application.services.producto_service import ProductoService
from infrastructure.repositories.in_memory import (
    CategoriaEnMemoria, ClienteEnMemoria, PedidoEnMemoria, ProductoEnMemoria, almacen,
)


@pytest.fixture(autouse=True)
def almacen_limpio():
    almacen.reiniciar()
    yield
    almacen.reiniciar()


@pytest.fixture
def servicios():
    cat, prod = CategoriaEnMemoria(almacen), ProductoEnMemoria(almacen)
    cli, ped = ClienteEnMemoria(almacen), PedidoEnMemoria(almacen)

    class Servicios:
        categorias = CategoriaService(cat, prod)
        productos = ProductoService(prod, cat, ped)
        clientes = ClienteService(cli)
        pedidos = PedidoService(ped, prod, cli)

    return Servicios
