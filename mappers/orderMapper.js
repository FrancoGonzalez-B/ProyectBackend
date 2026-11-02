const mapOrderDetail = (detail) => {
  const data = detail.toJSON ? detail.toJSON() : detail;

  return {
    id: data.id,
    productId: data.productoId,
    variantId: data.varianteId,
    quantity: data.cantidad,
    unitPrice: Number(data.precioUnitario),
  };
};

const mapOrder = (order) => {
  const data = order.toJSON ? order.toJSON() : order;

  return {
    id: data.id,
    clientId: data.clienteId,
    shippingAddress: data.direccionEnvio,
    status: data.estado,
    date: data.fecha,
    total: Number(data.total),
    details: data.detalles ? data.detalles.map(mapOrderDetail) : undefined,
  };
};

module.exports = { mapOrder, mapOrderDetail };
