// src/routes/internamientoRoutes.js

const express = require('express');
const router = express.Router();
const internamientoController = require('../controllers/internamientoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId, validateProcesoId } = require('../middlewares/validate');

/**
 * RUTAS DE INTERNAMIENTO
 *
 * PERMISOS:
 * - Consultar: Todos
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/internamiento
 * @desc    Obtener todos los internamientos
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(internamientoController.getAll)
);

/**
 * @route   GET /api/internamiento/cumplidos
 * @desc    Obtener internamientos cumplidos
 * @access  Private
 */
router.get(
    '/cumplidos',
    authMiddleware,
    asyncHandler(internamientoController.getCumplidos)
);

/**
 * @route   GET /api/internamiento/activos
 * @desc    Obtener internamientos activos
 * @access  Private
 */
router.get(
    '/activos',
    authMiddleware,
    asyncHandler(internamientoController.getActivos)
);

/**
 * @route   GET /api/internamiento/stats
 * @desc    Obtener estadísticas de internamientos
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(internamientoController.getStats)
);

/**
 * @route   GET /api/internamiento/proceso/:proceso_id
 * @desc    Obtener internamiento de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id',
    authMiddleware,
    validateProcesoId,
    asyncHandler(internamientoController.getByProcesoId)
);

/**
 * @route   GET /api/internamiento/:id
 * @desc    Obtener internamiento por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(internamientoController.getById)
);

/**
 * @route   POST /api/internamiento
 * @desc    Crear internamiento
 * @body    { proceso_id, fecha_cumplimiento? }
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
                `No tienes permisos para crear internamientos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(internamientoController.create)
);

/**
 * @route   PUT /api/internamiento/:id
 * @desc    Actualizar internamiento
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
                `No tienes permisos para modificar internamientos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(internamientoController.update)
);

/**
 * @route   DELETE /api/internamiento/:id
 * @desc    Eliminar internamiento
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(internamientoController.remove)
);

module.exports = router;