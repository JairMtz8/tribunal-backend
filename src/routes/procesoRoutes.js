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

module.exports = router;