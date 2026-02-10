// src/routes/medidaCautelarRoutes.js

const express = require('express');
const router = express.Router();
const medidaCautelarController = require('../controllers/medidaCautelarController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE MEDIDAS CAUTELARES
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear/Modificar/Revocar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/medidas-cautelares/stats
 * @desc    Obtener estadísticas de medidas cautelares
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(medidaCautelarController.getStats)
);

/**
 * @route   GET /api/medidas-cautelares/proceso/:proceso_id
 * @desc    Obtener medidas de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id',
    authMiddleware,
    validateId,
    asyncHandler(medidaCautelarController.getByProcesoId)
);

/**
 * @route   GET /api/medidas-cautelares/proceso/:proceso_id/activas
 * @desc    Obtener medidas activas (no revocadas) de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id/activas',
    authMiddleware,
    validateId,
    asyncHandler(medidaCautelarController.getMedidasActivas)
);

/**
 * @route   GET /api/medidas-cautelares/proceso/:proceso_id/privativas
 * @desc    Verificar si proceso tiene medidas privativas
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id/privativas',
    authMiddleware,
    validateId,
    asyncHandler(medidaCautelarController.verificarPrivativas)
);

/**
 * @route   GET /api/medidas-cautelares/:id
 * @desc    Obtener medida por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(medidaCautelarController.getById)
);

/**
 * @route   POST /api/medidas-cautelares
 * @desc    Crear medida cautelar (auto-crea CEMCI si aplica)
 * @body    { proceso_id, tipo_medida_cautelar_id, fecha_medida_cautelar, observaciones? }
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
                `No tienes permisos para crear medidas cautelares. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(medidaCautelarController.create)
);

/**
 * @route   PUT /api/medidas-cautelares/:id
 * @desc    Actualizar medida cautelar
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
                `No tienes permisos para modificar medidas cautelares. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(medidaCautelarController.update)
);

/**
 * @route   PUT /api/medidas-cautelares/:id/revocar
 * @desc    Revocar medida cautelar
 * @body    { fecha_revocacion? }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.put(
    '/:id/revocar',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para revocar medidas cautelares. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(medidaCautelarController.revocar)
);

/**
 * @route   DELETE /api/medidas-cautelares/:id
 * @desc    Eliminar medida cautelar
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(medidaCautelarController.remove)
);

module.exports = router;