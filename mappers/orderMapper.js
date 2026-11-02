const mapOrderDetail = (detail) => {
  const data = detail.toJSON ? detail.toJSON() : detail;

  return {
    id: data.id,
    productId: data.productId,
    quantity: data.quantity,
    unitPrice: Number(data.unitPrice),
  };
};

const mapOrder = (order) => {
  const data = order.toJSON ? order.toJSON() : order;

  return {
    id: data.id,
    clientId: data.clientId,
    shippingAddress: data.shippingAddress,
    status: data.status,
    date: data.date,
    total: Number(data.total),
    details: data.details ? data.details.map(mapOrderDetail) : undefined,
  };
};

module.exports = { mapOrder, mapOrderDetail };
