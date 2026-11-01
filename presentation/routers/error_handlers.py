import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from domain.exceptions import (
    ConflictoDeEstado,
    ErrorDeDominio,
    RecursoNoEncontrado,
    ReglaDeNegocioViolada,
)

logger = logging.getLogger(__name__)

_ESTADO_HTTP = {
    RecursoNoEncontrado: 404,
    ReglaDeNegocioViolada: 400,
    ConflictoDeEstado: 409,
}


def _respuesta(estado: int, code: str, message: str, details: list | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=estado,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def _mensaje_validacion(error: dict) -> str:
    """Traduce los mensajes de Pydantic (en inglés) a mensajes útiles en español."""
    tipo = error.get("type", "")
    ctx = error.get("ctx", {}) or {}
    traducciones = {
        "missing": "El campo es obligatorio",
        "string_too_short": f"Debe tener al menos {ctx.get('min_length')} caracteres",
        "string_too_long": f"Debe tener como máximo {ctx.get('max_length')} caracteres",
        "too_short": f"Debe contener al menos {ctx.get('min_length')} elemento(s)",
        "too_long": f"Debe contener como máximo {ctx.get('max_length')} elemento(s)",
        "greater_than": f"Debe ser mayor que {ctx.get('gt')}",
        "greater_than_equal": f"Debe ser mayor o igual que {ctx.get('ge')}",
        "less_than": f"Debe ser menor que {ctx.get('lt')}",
        "less_than_equal": f"Debe ser menor o igual que {ctx.get('le')}",
        "string_pattern_mismatch": "Tiene un formato inválido",
        "enum": f"Valor no permitido. Valores válidos: {ctx.get('expected')}",
        "literal_error": f"Valor no permitido. Valores válidos: {ctx.get('expected')}",
        "int_parsing": "Debe ser un número entero",
        "int_from_float": "Debe ser un número entero",
        "bool_parsing": "Debe ser verdadero o falso",
        "json_invalid": "El cuerpo de la solicitud no es un JSON válido",
        "string_type": "Debe ser un texto",
    }
    if tipo == "value_error":
        return str(error.get("msg", "Valor inválido")).removeprefix("Value error, ")
    return traducciones.get(tipo, str(error.get("msg", "Valor inválido")))


def registrar_manejadores_de_error(app: FastAPI) -> None:
    @app.exception_handler(ErrorDeDominio)
    async def _error_de_dominio(request: Request, exc: ErrorDeDominio):
        estado = next((h for tipo, h in _ESTADO_HTTP.items() if isinstance(exc, tipo)), 400)
        return _respuesta(estado, exc.codigo, exc.mensaje, exc.detalles)

    @app.exception_handler(RequestValidationError)
    async def _error_de_validacion(request: Request, exc: RequestValidationError):
        detalles = []
        for error in exc.errors():
            ubicacion = error["loc"] 
            campo = ".".join(str(parte) for parte in ubicacion[1:]) or str(ubicacion[0])
            detalles.append({
                "campo": campo,
                "ubicacion": str(ubicacion[0]),
                "mensaje": _mensaje_validacion(error),
                "tipo": error.get("type"),
            })
        return _respuesta(422, "VALIDATION_ERROR", "Los datos enviados no cumplen las validaciones", detalles)

    @app.exception_handler(StarletteHTTPException)
    async def _error_http(request: Request, exc: StarletteHTTPException):
        mensajes = {
            404: ("ROUTE_NOT_FOUND", "La ruta solicitada no existe"),
            405: ("METHOD_NOT_ALLOWED", "El método HTTP no está permitido en esta ruta"),
        }
        code, message = mensajes.get(exc.status_code, (f"HTTP_{exc.status_code}", str(exc.detail)))
        return _respuesta(exc.status_code, code, message)

    @app.exception_handler(Exception)
    async def _error_inesperado(request: Request, exc: Exception):
        logger.exception("Error no controlado en %s %s", request.method, request.url.path)
        return _respuesta(500, "INTERNAL_ERROR", "Ocurrió un error interno. Intente nuevamente más tarde")
