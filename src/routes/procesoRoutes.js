// src/routes/procesoRoutes.js

const express = require('express');
const router = express.Router();
const procesoController = require('../controllers/procesoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId, validatePagination } = require('../middlewares/validate');

/**
 * RUTAS DE PROCESO
 *
 * El proceso es el eje central del sistema
 * Al crear un proceso, siempre se crea con una CJ
 */

/**
 * @route   GET /api/procesos
 * @desc    Obtener todos los procesos
 * @query   page?, limit?, search?, status_id?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    validatePagination,
    asyncHandler(procesoController.getAll)
);

/**
 * @route   GET /api/procesos/stats
 * @desc    Obtener estadísticas de procesos
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(procesoController.getStats)
);

/**
 * @route   GET /api/procesos/adolescente/:id
 * @desc    Obtener proceso de un adolescente específico
 * @access  Private
 */
router.get(
    '/adolescente/:id',
    authMiddleware,
    validateId,
    asyncHandler(procesoController.getByAdolescente)
);

/**
 * @route   GET /api/procesos/:id
 * @desc    Obtener proceso por ID (con todas sus carpetas)
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(procesoController.getById)
);

/**
 * @route   POST /api/procesos
 * @desc    Crear proceso con CJ
 * @body    { adolescente_id, status_id?, observaciones?, cj: {...} }
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
                `No tienes permisos para crear procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(procesoController.create)
);

/**
 * @route   PUT /api/procesos/:id
 * @desc    Actualizar proceso
 * @body    { status_id?, observaciones? }
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
                `No tienes permisos para modificar procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(procesoController.update)
);

/**
 * @route   DELETE /api/procesos/:id
 * @desc    Eliminar proceso
 * @access  Private (Solo Administrador)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(procesoController.remove)
);

// =====================================================
// RUTAS DE VÍCTIMAS DEL PROCESO
// =====================================================

const victimaController = require('../controllers/victimaController');

/**
 * @route   GET /api/procesos/:id/victimas
 * @desc    Obtener víctimas de un proceso
 * @access  Private
 */
router.get(
    '/:id/victimas',
    authMiddleware,
    validateId,
    asyncHandler(victimaController.getVictimasByProceso)
);

/**
 * @route   POST /api/procesos/:id/victimas
 * @desc    Asociar víctima a proceso
 * @body    { victima_id }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/:id/victimas',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para asociar víctimas a procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(victimaController.asociarAProceso)
);

/**
 * @route   POST /api/procesos/:id/victimas/multiples
 * @desc    Asociar múltiples víctimas a proceso
 * @body    { victimas_ids: [1, 2, 3] }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/:id/victimas/multiples',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para asociar víctimas a procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(victimaController.asociarMultiples)
);

/**
 * @route   DELETE /api/procesos/:id/victimas/:victima_id
 * @desc    Desasociar víctima de proceso
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.delete(
    '/:id/victimas/:victima_id',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para desasociar víctimas de procesos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(victimaController.desasociarDeProceso)
);

// =====================================================
// RUTAS DE ACTORES JURÍDICOS DEL PROCESO
// =====================================================

const actorJuridicoController = require('../controllers/actorJuridicoController');

/**
 * @route   GET /api/procesos/:id/actores
 * @desc    Obtener actores de un proceso (todas las carpetas)
 * @access  Private
 */
router.get(
    '/:id/actores',
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
    '/:id/actores/agrupados',
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
    '/:id/actores/:tipo_carpeta',
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
    '/:id/actores',
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
    '/:id/actores/multiples',
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
    '/:id/actores/:tipo_carpeta/:actor_id',
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