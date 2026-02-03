// src/middlewares/auth.js

const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const authModel = require('../models/authModel');
const { UnauthorizedError, ForbiddenError } = require('../utils/errorHandler');

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 *
 * Verifica que el usuario esté autenticado mediante JWT
 * Agrega req.user con la información del usuario
 *
 * Uso:
 * router.get('/ruta-protegida', authMiddleware, controller.funcion)
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            throw new UnauthorizedError('Token no proporcionado. Por favor inicia sesión');
        }

        // 2. Verificar que el token sea válido
        const decoded = verifyToken(token);

        // 3. Obtener usuario actualizado de la base de datos
        // (por si cambió de rol o fue desactivado)
        const user = await authModel.findById(decoded.id);

        // 4. Verificar que el usuario esté activo
        if (!user.activo) {
            throw new ForbiddenError('Usuario desactivado. Contacta al administrador');
        }

        // 5. Agregar usuario a la request para uso posterior
        req.user = user;

        // 6. Continuar al siguiente middleware/controller
        next();

    } catch (error) {
        // Si es un error de autenticación, pasarlo tal cual
        if (error.statusCode === 401 || error.statusCode === 403) {
            next(error);
        } else {
            // Cualquier otro error, convertirlo a UnauthorizedError
            next(new UnauthorizedError('Error al verificar autenticación'));
        }
    }
};

/**
 * MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
 *
 * Similar a authMiddleware pero NO falla si no hay token
 * Útil para endpoints que funcionan con o sin auth
 *
 * Si hay token válido → req.user se llena
 * Si no hay token → req.user = null y continúa
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = verifyToken(token);
        const user = await authModel.findById(decoded.id);

        if (user && user.activo) {
            req.user = user;
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        // En modo opcional, si hay error, simplemente no hay usuario
        req.user = null;
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware
};