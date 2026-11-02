const MAX_TOTAL_CENTS = 99999999999999;

function totalCents(details) {
  const total = details.reduce(
    (sum, detail) =>
      sum + Math.round(detail.precioUnitario * 100) * detail.cantidad,
    0,
  );
  if (!Number.isSafeInteger(total) || total < 0 || total > MAX_TOTAL_CENTS) {
    const ReglaDeNegocioViolada = require('./exceptions/ReglaDeNegocioViolada');
    throw new ReglaDeNegocioViolada('El total supera el máximo permitido');
  }
  return total;
}

module.exports = { totalCents, MAX_TOTAL_CENTS };
