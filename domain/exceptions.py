class ErrorDeDominio(Exception):

    codigo = "DOMAIN_ERROR"

    def __init__(self, mensaje: str, detalles: list[dict] | None = None, codigo: str | None = None):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.detalles = detalles or []
        if codigo:  
            self.codigo = codigo


class RecursoNoEncontrado(ErrorDeDominio):
    """El recurso pedido no existe -> HTTP 404."""

    codigo = "RESOURCE_NOT_FOUND"


class ReglaDeNegocioViolada(ErrorDeDominio):
    """Solicitud comprensible pero que rompe una regla del negocio -> HTTP 400."""

    codigo = "BUSINESS_RULE_VIOLATION"


class ConflictoDeEstado(ErrorDeDominio):
    """Choca con el estado actual (duplicado, recurso en uso) -> HTTP 409."""

    codigo = "CONFLICT"
