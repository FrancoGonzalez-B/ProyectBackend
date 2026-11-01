import pytest
from pydantic import ValidationError
from presentation.schemas.dtos.cliente import ClienteCrear
from presentation.schemas.dtos.comun import Pagina
from presentation.schemas.dtos.pedido import PedidoCrear
from presentation.schemas.dtos.producto import ProductoCrear

PRODUCTO_OK = dict(nombre="Leche", precio=1000, stock=5, sku="LECH-001", categoria_id=1)
CLIENTE_OK = dict(nombre="Ana", email="ana@correo.cl", telefono="+56912345678", direccion="Calle 12345")


def tipos_de_error(modelo, datos):
    with pytest.raises(ValidationError) as e:
        modelo(**datos)
    return {err["type"] for err in e.value.errors()}


def test_producto_valido():
    assert ProductoCrear(**PRODUCTO_OK).estado.value == "DISPONIBLE"


@pytest.mark.parametrize("cambio, tipo", [
    ({"nombre": "A"}, "string_too_short"),            
    ({"nombre": "x" * 101}, "string_too_long"),      
    ({"precio": 0}, "greater_than"),                  
    ({"stock": -1}, "greater_than_equal"),            
    ({"sku": "lech 001"}, "string_pattern_mismatch"), 
    ({"estado": "ROTO"}, "enum"),                     
    ({"categoria_id": 0}, "greater_than"),
    ({"precio": "caro"}, "int_parsing"),
])
def test_producto_invalido(cambio, tipo):
    assert tipo in tipos_de_error(ProductoCrear, {**PRODUCTO_OK, **cambio})


def test_nombre_de_solo_espacios_se_rechaza():
    assert "string_too_short" in tipos_de_error(ProductoCrear, {**PRODUCTO_OK, "nombre": "   "})


@pytest.mark.parametrize("campo, valor", [
    ("email", "no-es-correo"), ("email", "a@b"), ("telefono", "abc"), ("telefono", "123"),
])
def test_cliente_formato_invalido(campo, valor):
    assert "string_pattern_mismatch" in tipos_de_error(ClienteCrear, {**CLIENTE_OK, campo: valor})


def test_pedido_sin_detalles_o_con_repetidos_se_rechaza():
    assert "too_short" in tipos_de_error(PedidoCrear, {"cliente_id": 1, "detalles": []})
    assert "value_error" in tipos_de_error(PedidoCrear, {
        "cliente_id": 1, "detalles": [{"producto_id": 1, "cantidad": 1}, {"producto_id": 1, "cantidad": 2}],
    })


def test_pedido_cantidad_debe_ser_positiva():
    assert "greater_than" in tipos_de_error(PedidoCrear, {
        "cliente_id": 1, "detalles": [{"producto_id": 1, "cantidad": 0}],
    })


@pytest.mark.parametrize("total, limite, esperado", [(85, 20, 5), (0, 10, 0), (20, 20, 1), (21, 20, 2)])
def test_total_de_paginas(total, limite, esperado):
    assert Pagina[int].construir([], total, 1, limite).total_paginas == esperado
