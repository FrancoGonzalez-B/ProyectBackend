import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")

from fastapi.testclient import TestClient  

from app.main import app  


@pytest.fixture
def api():
    return TestClient(app, raise_server_exceptions=False)


def assert_error(resp, estado, code):
    assert resp.status_code == estado, resp.text
    cuerpo = resp.json()
    assert set(cuerpo) == {"error"}
    assert set(cuerpo["error"]) == {"code", "message", "details"}
    assert cuerpo["error"]["code"] == code
    assert isinstance(cuerpo["error"]["details"], list)


def crear_categoria(api, nombre="Lácteos"):
    r = api.post("/categorias", json={"nombre": nombre})
    assert r.status_code == 201, r.text
    return r.json()


def crear_producto(api, categoria_id, sku="LECH-001", precio=1190, stock=10, nombre="Leche entera 1L"):
    r = api.post("/productos", json={"nombre": nombre, "precio": precio, "stock": stock,
                                    "sku": sku, "categoria_id": categoria_id})
    assert r.status_code == 201, r.text
    return r.json()


def crear_cliente(api):
    r = api.post("/clientes", json={"nombre": "María Soto", "email": "maria@correo.cl",
                                    "telefono": "+56912345678", "direccion": "Av. Alemania 0123"})
    assert r.status_code == 201, r.text
    return r.json()


def test_salud(api):
    assert api.get("/salud").json() == {"estado": "ok"}


def test_crud_categoria_completo(api):
    cat = crear_categoria(api)
    assert api.get(f"/categorias/{cat['id']}").status_code == 200
    r = api.put(f"/categorias/{cat['id']}", json={"nombre": "Lácteos y huevos", "activa": False})
    assert r.status_code == 200 and r.json()["nombre"] == "Lácteos y huevos"
    assert len(api.get("/categorias").json()) == 1
    assert api.delete(f"/categorias/{cat['id']}").status_code == 204
    assert_error(api.get(f"/categorias/{cat['id']}"), 404, "RESOURCE_NOT_FOUND")


def test_422_validacion_con_json_uniforme(api):
    r = api.post("/productos", json={"nombre": "A", "precio": 0, "stock": -1, "sku": "mal sku",
                                    "estado": "ROTO", "categoria_id": 1})
    assert_error(r, 422, "VALIDATION_ERROR")
    campos = {d["campo"] for d in r.json()["error"]["details"]}
    assert {"nombre", "precio", "stock", "sku", "estado"} <= campos


def test_422_json_mal_formado_y_parametro_de_ruta_invalido(api):
    r = api.post("/categorias", content="{no es json", headers={"content-type": "application/json"})
    assert_error(r, 422, "VALIDATION_ERROR")
    assert_error(api.get("/productos/abc"), 422, "VALIDATION_ERROR")


def test_404_ruta_inexistente_y_405_metodo(api):
    assert_error(api.get("/no-existe"), 404, "ROUTE_NOT_FOUND")
    assert_error(api.delete("/salud"), 405, "METHOD_NOT_ALLOWED")


def test_404_producto_con_categoria_inexistente(api):
    r = api.post("/productos", json={"nombre": "Leche", "precio": 1000, "stock": 1,
                                    "sku": "LECH-001", "categoria_id": 99})
    assert_error(r, 404, "RESOURCE_NOT_FOUND")


def test_409_duplicados_y_categoria_con_productos(api):
    cat = crear_categoria(api)
    assert_error(api.post("/categorias", json={"nombre": "lácteos"}), 409, "CATEGORY_ALREADY_EXISTS")
    crear_producto(api, cat["id"])
    r = api.post("/productos", json={"nombre": "Otra", "precio": 10, "stock": 1,
                                    "sku": "LECH-001", "categoria_id": cat["id"]})
    assert_error(r, 409, "SKU_ALREADY_EXISTS")
    assert_error(api.delete(f"/categorias/{cat['id']}"), 409, "CATEGORY_HAS_PRODUCTS")


def test_filtro_orden_y_paginacion_con_metadatos(api):
    lacteos, aseo = crear_categoria(api, "Lácteos"), crear_categoria(api, "Aseo")
    for i in range(1, 8):
        crear_producto(api, lacteos["id"], sku=f"LAC-{i:03d}", precio=i * 100, nombre=f"Lacteo {i}")
    crear_producto(api, aseo["id"], sku="ASE-001", nombre="Jabón")

    r = api.get("/productos", params={"categoria": "Lácteos", "ordenar_por": "precio",
                                    "direccion": "desc", "pagina": 2, "limite": 3})
    assert r.status_code == 200
    cuerpo = r.json()
    assert set(cuerpo) == {"items", "total", "pagina", "limite", "total_paginas"}
    assert (cuerpo["total"], cuerpo["pagina"], cuerpo["limite"], cuerpo["total_paginas"]) == (7, 2, 3, 3)
    assert [p["precio"] for p in cuerpo["items"]] == [400, 300, 200]


@pytest.mark.parametrize("params", [
    {"pagina": 0}, {"limite": 0}, {"limite": 101}, {"direccion": "arriba"}, {"ordenar_por": "color"},
])
def test_parametros_de_consulta_invalidos_dan_422(api, params):
    assert_error(api.get("/productos", params=params), 422, "VALIDATION_ERROR")


def test_pedido_completo_descuenta_y_devuelve_stock(api):
    cat = crear_categoria(api)
    prod = crear_producto(api, cat["id"], stock=10)
    cli = crear_cliente(api)

    r = api.post("/pedidos", json={"cliente_id": cli["id"], "detalles": [{"producto_id": prod["id"], "cantidad": 3}]})
    assert r.status_code == 201, r.text
    pedido = r.json()
    assert pedido["total"] == 3 * 1190 and pedido["estado"] == "PENDIENTE"
    assert api.get(f"/productos/{prod['id']}").json()["stock"] == 7

    r = api.post(f"/pedidos/{pedido['id']}/cancelar")
    assert r.status_code == 200 and r.json()["estado"] == "CANCELADO"
    assert api.get(f"/productos/{prod['id']}").json()["stock"] == 10
    assert_error(api.post(f"/pedidos/{pedido['id']}/cancelar"), 400, "ORDER_NOT_CANCELLABLE")


def test_400_stock_insuficiente_y_transicion_invalida(api):
    cat = crear_categoria(api)
    prod = crear_producto(api, cat["id"], stock=2)
    cli = crear_cliente(api)
    r = api.post("/pedidos", json={"cliente_id": cli["id"], "detalles": [{"producto_id": prod["id"], "cantidad": 5}]})
    assert_error(r, 400, "INSUFFICIENT_STOCK")

    ok = api.post("/pedidos", json={"cliente_id": cli["id"], "detalles": [{"producto_id": prod["id"], "cantidad": 1}]})
    r = api.patch(f"/pedidos/{ok.json()['id']}/estado", json={"estado": "ENTREGADO"})
    assert_error(r, 400, "INVALID_STATE_TRANSITION")
    r = api.patch(f"/pedidos/{ok.json()['id']}/estado", json={"estado": "CONFIRMADO"})
    assert r.status_code == 200 and r.json()["estado"] == "CONFIRMADO"


def test_openapi_documenta_al_menos_12_endpoints(api):
    rutas = api.get("/openapi.json").json()["paths"]
    total = sum(len([m for m in metodos if m in {"get", "post", "put", "patch", "delete"}]) for metodos in rutas.values())
    assert total >= 12
