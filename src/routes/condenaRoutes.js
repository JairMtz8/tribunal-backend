// src/routes/condenaRoutes.js

const express = require('express');
const router = express.Router();
const condenaController = require('../controllers/condenaController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CONDENA
 *
 * PERMISOS:
 * - Consultar: Todos
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/condena
 * @desc    Obtener todas las condenas
 * @query   cumplida?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(condenaController.getAll)
);

/**
 * @route   GET /api/condena/stats
 * @desc    Obtener estadísticas de condenas
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(condenaController.getStats)
);

/**
 * @route   GET /api/condena/proceso/:proceso_id
 * @desc    Obtener condena de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id',
    authMiddleware,
    validateId,
    asyncHandler(condenaController.getByProcesoId)
);

/**
 * @route   GET /api/condena/:id
 * @desc    Obtener condena por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(condenaController.getById)
);

/**
 * @route   POST /api/condena
 * @desc    Crear condena
 * @body    { proceso_id, tipo_reparacion_id?, inicio_computo_sancion?, compurga? }
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
                `No tienes permisos para crear condenas. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(condenaController.create)
);

/**
 * @route   PUT /api/condena/:id
 * @desc    Actualizar condena
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
                `No tienes permisos para modificar condenas. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(condenaController.update)
);

/**
 * @route   PUT /api/condena/:id/cumplir
 * @desc    Marcar condena como cumplida
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.put(
    '/:id/cumplir',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para marcar condenas como cumplidas. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(condenaController.marcarCumplida)
);

/**
 * @route   DELETE /api/condena/:id
 * @desc    Eliminar condena
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(condenaController.remove)
);

module.exports = router;