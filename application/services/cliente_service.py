from domain.entities import Cliente
from domain.exceptions import ConflictoDeEstado, RecursoNoEncontrado
from domain.repositories import ClienteRepository


class ClienteService:
    def __init__(self, clientes: ClienteRepository):
        self._clientes = clientes

    def crear(self, nombre: str, email: str, telefono: str, direccion: str) -> Cliente:
        if self._clientes.obtener_por_email(email) is not None:
            raise ConflictoDeEstado(
                "Ya existe un cliente registrado con ese correo",
                codigo="EMAIL_ALREADY_EXISTS",
                detalles=[{"campo": "email", "valor": email}],
            )
        return self._clientes.crear(Cliente(nombre=nombre, email=email, telefono=telefono, direccion=direccion))

    def listar(self) -> list[Cliente]:
        return self._clientes.listar()

    def obtener(self, cliente_id: int) -> Cliente:
        cliente = self._clientes.obtener_por_id(cliente_id)
        if cliente is None:
            raise RecursoNoEncontrado(
                "No existe un cliente con el ID solicitado",
                detalles=[{"campo": "cliente_id", "valor": cliente_id}],
            )
        return cliente
