function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación' });
    }

    // Aquí se valida el token
    const validToken = 'ave_mayo_123'; //token valido

    if (token.replace('Bearer ', '') !== validToken) {
        return res.status(403).json({ message: 'Token de autenticación inválido' });
    }
    next(); // Continuar con la solicitud
}

module.exports = authMiddleware;