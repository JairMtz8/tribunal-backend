// src/middlewares/checkRole.js

const { ForbiddenError } = require('../utils/errorHandler');

/**
 * MIDDLEWARE DE VERIFICACIÓN DE ROLES
 *
 * Verifica que el usuario tenga uno de los roles permitidos
 * DEBE usarse DESPUÉS de authMiddleware
 *
 * Uso:
 * router.post('/ruta',
 *   authMiddleware,
 *   checkRole(['Administrador', 'Juez']),
 *   controller.funcion
 * )
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Verificar que authMiddleware se haya ejecutado antes
        if (!req.user) {
            return next(new ForbiddenError('Autenticación requerida antes de verificar rol'));
        }

        // Obtener el rol del usuario
        const userRole = req.user.rol_nombre;

        // Verificar si el rol está en la lista de permitidos
        if (!allowedRoles.includes(userRole)) {
            return next(new ForbiddenError(
                `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
            ));
        }

        // El usuario tiene el rol necesario, continuar
        next();
    };
};

/**
 * MIDDLEWARE: Solo Administrador
 * Atajo para verificar que sea administrador
 */
const adminOnly = checkRole(['Administrador']);

/**
 * MIDDLEWARE: Administrador o Juzgado
 * Los roles que pueden hacer operaciones en CJ y CJO
 */
const adminOrJuzgado = checkRole(['Administrador', 'Juzgado']);

/**
 * MIDDLEWARE: Administrador o Juzgado Ejecución
 * Los roles que pueden hacer operaciones en CEMCI y CEMS
 */
const adminOrJuzgadoEjecucion = checkRole(['Administrador', 'Juzgado Ejecución']);

/**
 * MIDDLEWARE: Verificar que sea el mismo usuario
 * Útil para endpoints donde un usuario solo puede modificar sus propios datos
 *
 * Uso:
 * router.put('/usuarios/:id', authMiddleware, checkOwnUser, controller.update)
 */
const checkOwnUser = (req, res, next) => {
    if (!req.user) {
        return next(new ForbiddenError('Autenticación requerida'));
    }

    const requestedUserId = parseInt(req.params.id);
    const currentUserId = req.user.id_usuario;

    // Si no es el mismo usuario Y no es administrador
    if (requestedUserId !== currentUserId && req.user.rol_nombre !== 'Administrador') {
        return next(new ForbiddenError('Solo puedes modificar tu propia información'));
    }

    next();
};

/**
 * MIDDLEWARE: Verificar permisos específicos
 * Para casos más complejos donde necesitas verificar múltiples condiciones
 */
const checkPermission = (permissionCheck) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Autenticación requerida'));
        }

        // permissionCheck es una función que retorna true/false
        if (!permissionCheck(req.user, req)) {
            return next(new ForbiddenError('No tienes permisos para realizar esta acción'));
        }

        next();
    };
};

module.exports = {
    checkRole,
    adminOnly,
    adminOrJuzgado,
    adminOrJuzgadoEjecucion,
    checkOwnUser,
    checkPermission
};