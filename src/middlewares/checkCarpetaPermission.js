// src/middlewares/checkCarpetaPermission.js

const { ForbiddenError } = require('../utils/errorHandler');
const { ROLES } = require('../config/constants');

/**
 * MIDDLEWARE: Verificar permisos por tipo de carpeta
 *
 * Define qué roles pueden hacer qué operaciones en cada tipo de carpeta
 *
 * REGLAS:
 * - Administrador: Acceso total a todo
 * - Juzgado: Crear/Modificar/Eliminar CJ y CJO solamente
 * - Juzgado Ejecución: Crear/Modificar/Eliminar CEMCI y CEMS solamente
 * - Todos: Pueden CONSULTAR todas las carpetas
 */

/**
 * Definición de permisos por carpeta
 */
const PERMISOS_CARPETAS = {
    CJ: {
        consultar: [ROLES.ADMIN, ROLES.JUZGADO, ROLES.JUZGADO_EJECUCION, ROLES.FISCAL, ROLES.DEFENSA, ROLES.ASESOR],
        crear: [ROLES.ADMIN, ROLES.JUZGADO],
        modificar: [ROLES.ADMIN, ROLES.JUZGADO],
        eliminar: [ROLES.ADMIN, ROLES.JUZGADO]
    },
    CJO: {
        consultar: [ROLES.ADMIN, ROLES.JUZGADO, ROLES.JUZGADO_EJECUCION, ROLES.FISCAL, ROLES.DEFENSA, ROLES.ASESOR],
        crear: [ROLES.ADMIN, ROLES.JUZGADO],
        modificar: [ROLES.ADMIN, ROLES.JUZGADO],
        eliminar: [ROLES.ADMIN, ROLES.JUZGADO]
    },
    CEMCI: {
        consultar: [ROLES.ADMIN, ROLES.JUZGADO, ROLES.JUZGADO_EJECUCION, ROLES.FISCAL, ROLES.DEFENSA, ROLES.ASESOR],
        crear: [ROLES.ADMIN, ROLES.JUZGADO_EJECUCION],
        modificar: [ROLES.ADMIN, ROLES.JUZGADO_EJECUCION],
        eliminar: [ROLES.ADMIN, ROLES.JUZGADO_EJECUCION]
    },
    CEMS: {
        consultar: [ROLES.ADMIN, ROLES.JUZGADO, ROLES.JUZGADO_EJECUCION, ROLES.FISCAL, ROLES.DEFENSA, ROLES.ASESOR],
        crear: [ROLES.ADMIN, ROLES.JUZGADO_EJECUCION],
        modificar: [ROLES.ADMIN, ROLES.JUZGADO_EJECUCION],
        eliminar: [ROLES.ADMIN, ROLES.JUZGADO_EJECUCION]
    }
};

/**
 * Verificar si el usuario tiene permiso para una operación en un tipo de carpeta
 */
const tienePermiso = (rol, tipoCarpeta, operacion) => {
    const permisos = PERMISOS_CARPETAS[tipoCarpeta];

    if (!permisos) {
        return false;
    }

    const rolesPermitidos = permisos[operacion];

    if (!rolesPermitidos) {
        return false;
    }

    return rolesPermitidos.includes(rol);
};

/**
 * MIDDLEWARE: Verificar permiso de CONSULTA
 * Todos los roles pueden consultar todas las carpetas
 */
const canConsultar = (tipoCarpeta) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Autenticación requerida'));
        }

        const userRole = req.user.rol_nombre;

        if (!tienePermiso(userRole, tipoCarpeta, 'consultar')) {
            return next(new ForbiddenError(
                `No tienes permisos para consultar carpetas de tipo ${tipoCarpeta}`
            ));
        }

        next();
    };
};

/**
 * MIDDLEWARE: Verificar permiso de CREAR
 */
const canCrear = (tipoCarpeta) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Autenticación requerida'));
        }

        const userRole = req.user.rol_nombre;

        if (!tienePermiso(userRole, tipoCarpeta, 'crear')) {
            return next(new ForbiddenError(
                `No tienes permisos para crear carpetas de tipo ${tipoCarpeta}. ` +
                `Esta operación requiere uno de estos roles: ${PERMISOS_CARPETAS[tipoCarpeta].crear.join(', ')}`
            ));
        }

        next();
    };
};

/**
 * MIDDLEWARE: Verificar permiso de MODIFICAR
 */
const canModificar = (tipoCarpeta) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Autenticación requerida'));
        }

        const userRole = req.user.rol_nombre;

        if (!tienePermiso(userRole, tipoCarpeta, 'modificar')) {
            return next(new ForbiddenError(
                `No tienes permisos para modificar carpetas de tipo ${tipoCarpeta}. ` +
                `Esta operación requiere uno de estos roles: ${PERMISOS_CARPETAS[tipoCarpeta].modificar.join(', ')}`
            ));
        }

        next();
    };
};

/**
 * MIDDLEWARE: Verificar permiso de ELIMINAR
 */
const canEliminar = (tipoCarpeta) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Autenticación requerida'));
        }

        const userRole = req.user.rol_nombre;

        if (!tienePermiso(userRole, tipoCarpeta, 'eliminar')) {
            return next(new ForbiddenError(
                `No tienes permisos para eliminar carpetas de tipo ${tipoCarpeta}. ` +
                `Esta operación requiere uno de estos roles: ${PERMISOS_CARPETAS[tipoCarpeta].eliminar.join(', ')}`
            ));
        }

        next();
    };
};

/**
 * HELPER: Verificar si el usuario puede hacer cualquier operación de escritura
 * (crear, modificar o eliminar) en al menos un tipo de carpeta
 */
const canEscribirEnAlgunaCarpeta = (req) => {
    if (!req.user) return false;

    const userRole = req.user.rol_nombre;

    // Administrador siempre puede
    if (userRole === ROLES.ADMIN) return true;

    // Verificar si tiene permisos en alguna carpeta
    for (const tipoCarpeta of Object.keys(PERMISOS_CARPETAS)) {
        if (tienePermiso(userRole, tipoCarpeta, 'crear') ||
            tienePermiso(userRole, tipoCarpeta, 'modificar') ||
            tienePermiso(userRole, tipoCarpeta, 'eliminar')) {
            return true;
        }
    }

    return false;
};

/**
 * HELPER: Obtener carpetas a las que el usuario tiene acceso de escritura
 */
const getCarpetasConAccesoEscritura = (rol) => {
    const carpetas = [];

    for (const [tipoCarpeta, permisos] of Object.entries(PERMISOS_CARPETAS)) {
        if (permisos.crear.includes(rol) ||
            permisos.modificar.includes(rol) ||
            permisos.eliminar.includes(rol)) {
            carpetas.push(tipoCarpeta);
        }
    }

    return carpetas;
};

module.exports = {
    canConsultar,
    canCrear,
    canModificar,
    canEliminar,
    tienePermiso,
    canEscribirEnAlgunaCarpeta,
    getCarpetasConAccesoEscritura,
    PERMISOS_CARPETAS
};