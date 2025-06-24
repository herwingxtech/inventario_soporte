// src/middleware/auth.middleware.js
// * Este middleware se encarga de proteger las rutas verificando el token JWT.

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    // * Busco el token en el encabezado 'Authorization'.
    // * El formato esperado es 'Bearer <token>'.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // * Extraigo el token (quito 'Bearer ').
            token = req.headers.authorization.split(' ')[1];

            // * Verifico el token usando mi clave secreta.
            // * Si el token es inválido o ha expirado, jwt.verify lanzará un error.
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // * Si el token es válido, el payload decodificado se añade al objeto `req`.
            // * Ahora, todas las rutas posteriores protegidas tendrán acceso a `req.user`.
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                roleId: decoded.roleId
            };
            
            console.log(`Middleware: Token válido para usuario ID ${req.user.userId}. Petición autorizada.`);
            next(); // * Permito que la petición continúe a la ruta solicitada.

        } catch (error) {
            console.error('Middleware: Token inválido o expirado.', error.message);
            // Si hay un error en la verificación, el usuario no está autorizado.
            return res.status(401).json({ message: 'No autorizado, token falló.' });
        }
    }

    // * Si no hay token en el encabezado, el usuario no está autorizado.
    if (!token) {
        console.warn('Middleware: Petición sin token.');
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

module.exports = {
    protect
}; 