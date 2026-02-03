// src/utils/jwt.js

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('./errorHandler');

/**
 * UTILIDADES PARA JWT
 *
 * Maneja la generación y verificación de tokens JWT
 */

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_super_segura_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * GENERAR TOKEN
 *
 * Crea un JWT con la información del usuario
 *
 * Payload incluye:
 * - id: ID del usuario
 * - usuario: Nombre de usuario
 * - rol: Nombre del rol
 * - iat: Timestamp de creación
 * - exp: Timestamp de expiración
 */
const generateToken = (user) => {
    const payload = {
        id: user.id_usuario,
        usuario: user.usuario,
        rol: user.rol_nombre,  // Nombre del rol (ej: "Admin")
        rolId: user.rol_id     // ID del rol (para queries)
    };

    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });

    return token;
};

/**
 * VERIFICAR TOKEN
 *
 * Valida que el token sea válido y no haya expirado
 * Retorna el payload decodificado
 * Lanza error si es inválido o expiró
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Token expirado. Por favor inicia sesión nuevamente');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Token inválido');
        }
        throw new UnauthorizedError('Error al verificar token');
    }
};

/**
 * EXTRAER TOKEN DEL HEADER
 *
 * Extrae el token del header Authorization
 * Formato esperado: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }

    // Verificar formato "Bearer TOKEN"
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }

    // Extraer solo el token
    const token = authHeader.substring(7); // Quitar "Bearer "
    return token;
};

/**
 * DECODIFICAR TOKEN SIN VERIFICAR
 *
 * Útil para debugging o ver qué contiene un token
 * NO usa esto para autenticación, usa verifyToken()
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    extractTokenFromHeader,
    decodeToken
};