const { verifyToken } = require('../../infrastructure/security/tokens');
const reject = (res, status, code, message) =>
  res.status(status).json({ error: { code, message, details: [] } });

function crearAutenticacion({ usuarios, secret } = {}) {
  return async (req, res, next) => {
    try {
      const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
      if (!match)
        return reject(
          res,
          401,
          'UNAUTHORIZED',
          'Se requiere un token Bearer válido',
        );
      const claims = verifyToken(match[1], {
        secret: secret === undefined ? process.env.AUTH_SECRET : secret,
      });
      if (!claims)
        return reject(res, 401, 'UNAUTHORIZED', 'Token inválido o expirado');
      const model = usuarios || require('../../infrastructure/models').Usuario;
      const usuario = await model.findByPk(claims.sub, {
        attributes: ['id', 'role'],
      });
      if (!usuario)
        return reject(res, 401, 'UNAUTHORIZED', 'Token inválido o expirado');
      req.usuario = { id: usuario.id, role: usuario.role };
      req.auth = req.usuario;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const autenticar = crearAutenticacion();
function soloAdmin(req, res, next) {
  if (!req.usuario)
    return reject(res, 401, 'UNAUTHORIZED', 'Autenticación requerida');
  if (req.usuario.role !== 'admin')
    return reject(
      res,
      403,
      'FORBIDDEN',
      'Esta operación requiere permisos de administrador',
    );
  return next();
}
function exigirPropietario(campo, origen = 'params') {
  return (req, res, next) => {
    if (!req.usuario)
      return reject(res, 401, 'UNAUTHORIZED', 'Autenticación requerida');
    if (req.usuario.role === 'admin') return next();
    const id = Number(req[origen]?.[campo]);
    if (!Number.isSafeInteger(id) || id !== req.usuario.id)
      return reject(
        res,
        403,
        'FORBIDDEN',
        'No tienes permisos sobre estos datos',
      );
    return next();
  };
}
module.exports = {
  autenticar,
  soloAdmin,
  exigirPropietario,
  crearAutenticacion,
};
