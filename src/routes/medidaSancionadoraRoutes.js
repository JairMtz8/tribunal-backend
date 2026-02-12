// src/routes/medidaSancionadoraRoutes.js

const express = require('express');
const router = express.Router();
const medidaSancionadoraController = require('../controllers/medidaSancionadoraController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId, validateProcesoId } = require('../middlewares/validate');

/**
 * RUTAS DE MEDIDAS SANCIONADORAS
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/medidas-sancionadoras/privativas
 * @desc    Obtener todas las medidas privativas
 * @access  Private
 */
router.get(
    '/privativas',
    authMiddleware,
    asyncHandler(medidaSancionadoraController.getPrivativas)
);

/**
 * @route   GET /api/medidas-sancionadoras/no-privativas
 * @desc    Obtener todas las medidas no privativas
 * @access  Private
 */
router.get(
    '/no-privativas',
    authMiddleware,
    asyncHandler(medidaSancionadoraController.getNoPrivativas)
);

/**
 * @route   GET /api/medidas-sancionadoras/stats
 * @desc    Obtener estadísticas por tipo
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(medidaSancionadoraController.getStats)
);

/**
 * @route   GET /api/medidas-sancionadoras/stats/generales
 * @desc    Obtener estadísticas generales
 * @access  Private
 */
router.get(
    '/stats/generales',
    authMiddleware,
    asyncHandler(medidaSancionadoraController.getStatsGenerales)
);

/**
 * @route   GET /api/medidas-sancionadoras/proceso/:proceso_id
 * @desc    Obtener medidas de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id',
    authMiddleware,
    validateProcesoId,
    asyncHandler(medidaSancionadoraController.getByProcesoId)
);

/**
 * @route   GET /api/medidas-sancionadoras/proceso/:proceso_id/privativas
 * @desc    Verificar si proceso tiene medidas privativas
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id/privativas',
    authMiddleware,
    validateProcesoId,
    asyncHandler(medidaSancionadoraController.verificarPrivativas)
);

/**
 * @route   GET /api/medidas-sancionadoras/:id
 * @desc    Obtener medida por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(medidaSancionadoraController.getById)
);

/**
 * @route   POST /api/medidas-sancionadoras
 * @desc    Crear medida sancionadora
 * @body    { proceso_id, tipo_medida_sancionadora_id, plazo_anios?, plazo_meses?, plazo_dias? }
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
                `No tienes permisos para crear medidas sancionadoras. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(medidaSancionadoraController.create)
);

/**
 * @route   PUT /api/medidas-sancionadoras/:id
 * @desc    Actualizar medida sancionadora
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
                `No tienes permisos para modificar medidas sancionadoras. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(medidaSancionadoraController.update)
);

/**
 * @route   DELETE /api/medidas-sancionadoras/:id
 * @desc    Eliminar medida sancionadora
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(medidaSancionadoraController.remove)
);

module.exports = router;