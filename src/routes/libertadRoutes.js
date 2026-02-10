// src/routes/libertadRoutes.js

const express = require('express');
const router = express.Router();
const libertadController = require('../controllers/libertadController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE LIBERTAD
 *
 * PERMISOS:
 * - Consultar: Todos
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/libertad
 * @desc    Obtener todas las libertades
 * @query   cumplida?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(libertadController.getAll)
);

/**
 * @route   GET /api/libertad/activas
 * @desc    Obtener libertades activas
 * @access  Private
 */
router.get(
    '/activas',
    authMiddleware,
    asyncHandler(libertadController.getActivas)
);

/**
 * @route   GET /api/libertad/proximas-vencer
 * @desc    Obtener libertades próximas a vencer
 * @query   dias? (default: 30)
 * @access  Private
 */
router.get(
    '/proximas-vencer',
    authMiddleware,
    asyncHandler(libertadController.getProximasVencer)
);

/**
 * @route   GET /api/libertad/stats
 * @desc    Obtener estadísticas de libertades
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(libertadController.getStats)
);

/**
 * @route   GET /api/libertad/proceso/:proceso_id
 * @desc    Obtener libertad de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id',
    authMiddleware,
    validateId,
    asyncHandler(libertadController.getByProcesoId)
);

/**
 * @route   GET /api/libertad/:id
 * @desc    Obtener libertad por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(libertadController.getById)
);

/**
 * @route   POST /api/libertad
 * @desc    Crear libertad
 * @body    { proceso_id, obligaciones?, fecha_inicial_ejecucion?, termino_obligaciones? }
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
                `No tienes permisos para crear libertades. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(libertadController.create)
);

/**
 * @route   PUT /api/libertad/:id
 * @desc    Actualizar libertad
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
                `No tienes permisos para modificar libertades. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(libertadController.update)
);

/**
 * @route   PUT /api/libertad/:id/cumplir
 * @desc    Marcar libertad como cumplida
 * @body    { fecha_cumplimiento? }
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
                `No tienes permisos para marcar libertades como cumplidas. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(libertadController.marcarCumplida)
);

/**
 * @route   DELETE /api/libertad/:id
 * @desc    Eliminar libertad
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(libertadController.remove)
);

module.exports = router;