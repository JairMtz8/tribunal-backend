// src/routes/calificativaDelitoRoutes.js

const express = require('express');
const router = express.Router();
const calificativaDelitoController = require('../controllers/calificativaDelitoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CALIFICATIVA_DELITO
 *
 * PERMISOS:
 * - Consultar: Todos autenticados
 * - Crear/Modificar/Eliminar: Solo Admin
 */

/**
 * @route   GET /api/catalogo-calificativas
 * @desc    Obtener todas las calificativas
 * @query   activo?, search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(calificativaDelitoController.getAll)
);

/**
 * @route   GET /api/catalogo-calificativas/activas
 * @desc    Obtener solo calificativas activas
 * @access  Private
 */
router.get(
    '/activas',
    authMiddleware,
    asyncHandler(calificativaDelitoController.getActivas)
);

/**
 * @route   GET /api/catalogo-calificativas/stats
 * @desc    Obtener estadísticas de uso
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(calificativaDelitoController.getStatsUso)
);

/**
 * @route   GET /api/catalogo-calificativas/:id
 * @desc    Obtener calificativa por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(calificativaDelitoController.getById)
);

/**
 * @route   POST /api/catalogo-calificativas
 * @desc    Crear calificativa
 * @body    { nombre, activo? }
 * @access  Private (Solo Admin)
 */
router.post(
    '/',
    authMiddleware,
    adminOnly,
    asyncHandler(calificativaDelitoController.create)
);

/**
 * @route   PUT /api/catalogo-calificativas/:id
 * @desc    Actualizar calificativa
 * @access  Private (Solo Admin)
 */
router.put(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(calificativaDelitoController.update)
);

/**
 * @route   PUT /api/catalogo-calificativas/:id/toggle
 * @desc    Activar/Desactivar calificativa
 * @access  Private (Solo Admin)
 */
router.put(
    '/:id/toggle',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(calificativaDelitoController.toggleActivo)
);

/**
 * @route   DELETE /api/catalogo-calificativas/:id
 * @desc    Eliminar calificativa
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(calificativaDelitoController.remove)
);

module.exports = router;