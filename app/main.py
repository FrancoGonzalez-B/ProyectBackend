"""Ensambla la aplicación. Ejecutar con:  uvicorn app.main:app --reload
Documentación interactiva (OpenAPI/Swagger): http://localhost:8000/docs"""
from fastapi import FastAPI

from presentation.error_handlers import registrar_manejadores_de_error
from presentation.routers import categorias, clientes, pedidos, productos

DESCRIPCION = """
API REST de un **supermercado en línea**: catálogo (categorías y productos),
clientes y pedidos con control de stock.

Todos los errores usan la misma estructura:
`{"error": {"code": "...", "message": "...", "details": []}}`
"""

app = FastAPI(
    title="API Supermercado en línea",
    version="1.0.0",
    description=DESCRIPCION,
    openapi_tags=[
        {"name": "Categorías", "description": "Agrupan los productos del catálogo"},
        {"name": "Productos", "description": "Catálogo con precio, stock y filtro/orden/paginación"},
        {"name": "Clientes", "description": "Personas que realizan pedidos"},
        {"name": "Pedidos", "description": "Compras con descuento de stock y ciclo de estados"},
        {"name": "Sistema", "description": "Estado de la API"},
    ],
)

registrar_manejadores_de_error(app)

app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(clientes.router)
app.include_router(pedidos.router)


@app.get("/salud", tags=["Sistema"], summary="Estado de la API")
def salud():
    return {"estado": "ok"}
