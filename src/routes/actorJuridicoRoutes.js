// src/routes/actorJuridicoRoutes.js

const express = require('express');
const router = express.Router();
const actorJuridicoController = require('../controllers/actorJuridicoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE ACTORES JURÍDICOS
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 * - Asignar/Desasignar: Admin, Juzgado, Juzgado Ejecución
 */

/**
 * @route   GET /api/actores
 * @desc    Obtener todos los actores jurídicos
 * @query   tipo?, search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(actorJuridicoController.getAll)
);

/**
 * @route   GET /api/actores/stats
 * @desc    Obtener estadísticas de actores
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(actorJuridicoController.getStats)
);

/**
 * @route   GET /api/actores/tipo/:tipo
 * @desc    Obtener actores por tipo
 * @param   tipo (defensa, fiscal, asesor juridico, juez, representante, juez apoyo)
 * @access  Private
 */
router.get(
    '/tipo/:tipo',
    authMiddleware,
    asyncHandler(actorJuridicoController.getByTipo)
);

/**
 * @route   GET /api/actores/:id
 * @desc    Obtener actor por ID (con procesos)
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(actorJuridicoController.getById)
);

/**
 * @route   POST /api/actores
 * @desc    Crear nuevo actor jurídico
 * @body    { nombre, tipo }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para crear actores jurídicos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(actorJuridicoController.create)
);

/**
 * @route   PUT /api/actores/:id
 * @desc    Actualizar actor jurídico
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.put(
    '/:id',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para modificar actores jurídicos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(actorJuridicoController.update)
);

/**
 * @route   DELETE /api/actores/:id
 * @desc    Eliminar actor jurídico
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(actorJuridicoController.remove)
);

/**
 * @route   GET /api/procesos/:id/actores
 * @desc    Obtener actores de un proceso (todas las carpetas)
 * @access  Private
 */
router.get(
    '/procesos/:id/actores',
    authMiddleware,
    validateId,
    asyncHandler(actorJuridicoController.getActoresByProceso)
);

/**
 * @route   GET /api/procesos/:id/actores/agrupados
 * @desc    Obtener actores agrupados por carpeta
 * @access  Private
 */
router.get(
    '/procesos/:id/actores/agrupados',
    authMiddleware,
    validateId,
    asyncHandler(actorJuridicoController.getActoresAgrupados)
);

/**
 * @route   GET /api/procesos/:id/actores/:tipo_carpeta
 * @desc    Obtener actores de proceso por carpeta específica
 * @param   tipo_carpeta (CJ, CJO, CEMCI, CEMS)
 * @access  Private
 */
router.get(
    '/procesos/:id/actores/:tipo_carpeta',
    authMiddleware,
    validateId,
    asyncHandler(actorJuridicoController.getActoresByProcesoCarpeta)
);

/**
 * @route   POST /api/procesos/:id/actores
 * @desc    Asignar actor a proceso/carpeta
 * @body    { tipo_carpeta, actor_id }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/procesos/:id/actores',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para asignar actores a procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(actorJuridicoController.asignarAProceso)
);

/**
 * @route   POST /api/procesos/:id/actores/multiples
 * @desc    Asignar múltiples actores a proceso/carpeta
 * @body    { tipo_carpeta, actores_ids: [1, 2, 3] }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/procesos/:id/actores/multiples',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para asignar actores a procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(actorJuridicoController.asignarMultiples)
);

/**
 * @route   DELETE /api/procesos/:id/actores/:tipo_carpeta/:actor_id
 * @desc    Desasignar actor de proceso/carpeta
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.delete(
    '/procesos/:id/actores/:tipo_carpeta/:actor_id',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para desasignar actores de procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(actorJuridicoController.desasignarDeProceso)
);

module.exports = router;