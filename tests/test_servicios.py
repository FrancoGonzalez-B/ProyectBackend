import pytest
from application.services.pedido_service import LineaPedido
from domain.enums import EstadoPedido, EstadoProducto
from domain.exceptions import ConflictoDeEstado, RecursoNoEncontrado, ReglaDeNegocioViolada


@pytest.fixture
def tienda(servicios):
    """Una categoría, dos productos y un cliente listos para usar."""
    cat = servicios.categorias.crear("Lácteos")
    leche = servicios.productos.crear("Leche entera 1L", 1190, 10, "LECH-001", cat.id)
    queso = servicios.productos.crear("Queso gauda 250g", 2990, 5, "QUES-001", cat.id)
    cli = servicios.clientes.crear("María Soto", "maria@correo.cl", "+56912345678", "Av. Alemania 0123")
    return servicios, cat, leche, queso, cli

def test_categoria_nombre_duplicado_da_409(servicios):
    servicios.categorias.crear("Lácteos")
    with pytest.raises(ConflictoDeEstado) as e:
        servicios.categorias.crear("lácteos")  
    assert e.value.codigo == "CATEGORY_ALREADY_EXISTS"


def test_no_se_borra_categoria_con_productos(tienda):
    s, cat, *_ = tienda
    with pytest.raises(ConflictoDeEstado) as e:
        s.categorias.eliminar(cat.id)
    assert e.value.codigo == "CATEGORY_HAS_PRODUCTS"


def test_categoria_inexistente_da_404(servicios):
    with pytest.raises(RecursoNoEncontrado):
        servicios.categorias.obtener(99)


def test_producto_con_categoria_inexistente_da_404(servicios):
    with pytest.raises(RecursoNoEncontrado) as e:
        servicios.productos.crear("Leche", 1000, 1, "LECH-009", categoria_id=99)
    assert e.value.detalles[0]["campo"] == "categoria_id"


def test_sku_duplicado_da_409(tienda):
    s, cat, *_ = tienda
    with pytest.raises(ConflictoDeEstado) as e:
        s.productos.crear("Otra leche", 900, 1, "lech-001", cat.id)
    assert e.value.codigo == "SKU_ALREADY_EXISTS"


def test_actualizar_producto_con_su_propio_sku_es_valido(tienda):
    s, cat, leche, *_ = tienda
    s.productos.actualizar(leche.id, "Leche entera 1L", 1290, 10, "LECH-001", cat.id, None, EstadoProducto.DISPONIBLE)
    assert s.productos.obtener(leche.id).precio == 1290

@pytest.fixture
def catalogo(servicios):
    lacteos = servicios.categorias.crear("Lácteos")
    aseo = servicios.categorias.crear("Aseo")
    for i in range(1, 8):  
        servicios.productos.crear(f"Lacteo {i}", i * 100, i, f"LAC-{i:03d}", lacteos.id)
    servicios.productos.crear("Jabón", 500, 3, "ASE-001", aseo.id)
    return servicios


def test_filtra_antes_de_paginar_y_total_cuenta_solo_filtrados(catalogo):
    r = catalogo.productos.listar(categoria="lácteos", pagina=1, limite=3)
    assert r.total == 7     
    assert len(r.items) == 3


def test_ordena_por_precio_descendente(catalogo):
    r = catalogo.productos.listar(categoria="Lácteos", ordenar_por="precio", descendente=True, limite=3)
    assert [p.precio for p in r.items] == [700, 600, 500]


def test_ultima_pagina_trae_el_resto(catalogo):
    r = catalogo.productos.listar(categoria="Lácteos", pagina=3, limite=3)
    assert len(r.items) == 1 and r.total == 7


def test_pagina_fuera_de_rango_devuelve_lista_vacia(catalogo):
    r = catalogo.productos.listar(pagina=50, limite=10)
    assert r.items == [] and r.total == 8


def test_categoria_inexistente_en_filtro_devuelve_vacio_no_error(catalogo):
    r = catalogo.productos.listar(categoria="Juguetes")
    assert r.total == 0 and r.items == []


def test_buscar_por_texto(catalogo):
    assert catalogo.productos.listar(buscar="jab").total == 1


# ---------- Pedidos ----------
def test_pedido_descuenta_stock_y_calcula_total(tienda):
    s, _, leche, queso, cli = tienda
    pedido = s.pedidos.crear(cli.id, [LineaPedido(leche.id, 3), LineaPedido(queso.id, 1)])
    assert pedido.total == 3 * 1190 + 2990
    assert pedido.estado == EstadoPedido.PENDIENTE
    assert pedido.direccion_envio == cli.direccion         
    assert s.productos.obtener(leche.id).stock == 7
    assert s.productos.obtener(queso.id).stock == 4


def test_pedido_sin_stock_da_400_y_no_descuenta_nada(tienda):
    s, _, leche, queso, cli = tienda
    with pytest.raises(ReglaDeNegocioViolada) as e:
        s.pedidos.crear(cli.id, [LineaPedido(leche.id, 2), LineaPedido(queso.id, 99)])
    assert e.value.codigo == "INSUFFICIENT_STOCK"
    assert s.productos.obtener(leche.id).stock == 10       
    assert s.pedidos.listar() == []


def test_pedido_de_todo_el_stock_marca_producto_agotado(tienda):
    s, _, _, queso, cli = tienda
    s.pedidos.crear(cli.id, [LineaPedido(queso.id, 5)])
    assert s.productos.obtener(queso.id).estado == EstadoProducto.AGOTADO


def test_pedido_con_producto_descontinuado_da_400(tienda):
    s, cat, leche, _, cli = tienda
    s.productos.actualizar(leche.id, leche.nombre, leche.precio, leche.stock, leche.sku, cat.id, None,
                           EstadoProducto.DESCONTINUADO)
    with pytest.raises(ReglaDeNegocioViolada) as e:
        s.pedidos.crear(cli.id, [LineaPedido(leche.id, 1)])
    assert e.value.codigo == "PRODUCT_NOT_AVAILABLE"


def test_pedido_con_cliente_o_producto_inexistente_da_404(tienda):
    s, _, leche, _, cli = tienda
    with pytest.raises(RecursoNoEncontrado):
        s.pedidos.crear(999, [LineaPedido(leche.id, 1)])
    with pytest.raises(RecursoNoEncontrado):
        s.pedidos.crear(cli.id, [LineaPedido(999, 1)])


def test_cancelar_pedido_pendiente_devuelve_stock(tienda):
    s, _, leche, _, cli = tienda
    pedido = s.pedidos.crear(cli.id, [LineaPedido(leche.id, 4)])
    cancelado = s.pedidos.cancelar(pedido.id)
    assert cancelado.estado == EstadoPedido.CANCELADO
    assert s.productos.obtener(leche.id).stock == 10


def test_cancelar_dos_veces_o_pedido_confirmado_da_400(tienda):
    s, _, leche, _, cli = tienda
    pedido = s.pedidos.crear(cli.id, [LineaPedido(leche.id, 1)])
    s.pedidos.cancelar(pedido.id)
    with pytest.raises(ReglaDeNegocioViolada) as e:
        s.pedidos.cancelar(pedido.id)
    assert e.value.codigo == "ORDER_NOT_CANCELLABLE"
    assert s.productos.obtener(leche.id).stock == 10       
    otro = s.pedidos.crear(cli.id, [LineaPedido(leche.id, 1)])
    s.pedidos.cambiar_estado(otro.id, EstadoPedido.CONFIRMADO)
    with pytest.raises(ReglaDeNegocioViolada):
        s.pedidos.cancelar(otro.id)


def test_estados_solo_avanzan_en_orden(tienda):
    s, _, leche, _, cli = tienda
    p = s.pedidos.crear(cli.id, [LineaPedido(leche.id, 1)])
    with pytest.raises(ReglaDeNegocioViolada) as e:
        s.pedidos.cambiar_estado(p.id, EstadoPedido.ENVIADO)   
    assert e.value.codigo == "INVALID_STATE_TRANSITION"
    for estado in (EstadoPedido.CONFIRMADO, EstadoPedido.ENVIADO, EstadoPedido.ENTREGADO):
        assert s.pedidos.cambiar_estado(p.id, estado).estado == estado


def test_precio_del_pedido_no_cambia_si_el_producto_sube(tienda):
    s, cat, leche, _, cli = tienda
    p = s.pedidos.crear(cli.id, [LineaPedido(leche.id, 1)])
    s.productos.actualizar(leche.id, leche.nombre, 9999, 9, leche.sku, cat.id, None, EstadoProducto.DISPONIBLE)
    assert s.pedidos.obtener(p.id).total == 1190


def test_producto_vendido_no_se_puede_eliminar(tienda):
    s, _, leche, _, cli = tienda
    s.pedidos.crear(cli.id, [LineaPedido(leche.id, 1)])
    with pytest.raises(ConflictoDeEstado) as e:
        s.productos.eliminar(leche.id)
    assert e.value.codigo == "PRODUCT_IN_USE"

def test_email_de_cliente_duplicado_da_409(tienda):
    s, *_ = tienda
    with pytest.raises(ConflictoDeEstado) as e:
        s.clientes.crear("Otra", "MARIA@correo.cl", "+56911111111", "Calle 123")
    assert e.value.codigo == "EMAIL_ALREADY_EXISTS"
