// src/routes/cjConductaRoutes.js

const express = require('express');
const router = express.Router();
const cjConductaController = require('../controllers/cjConductaController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { canConsultar, canModificar, canEliminar } = require('../middlewares/checkCarpetaPermission');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CJ_CONDUCTA (Conductas del Adolescente)
 *
 * Gestiona las conductas/delitos que cometió el adolescente
 * Una CJ puede tener múltiples conductas
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Modificar: Admin y Juzgado
 * - Eliminar: Admin y Juzgado
 */

/**
 * @route   GET /api/cj-conductas/stats
 * @desc    Obtener estadísticas de conductas
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    canConsultar('CJ'),
    asyncHandler(cjConductaController.getStats)
);

/**
 * @route   GET /api/cj-conductas/mas-frecuentes
 * @desc    Obtener conductas más frecuentes
 * @query   limit? (default: 10)
 * @access  Private
 */
router.get(
    '/mas-frecuentes',
    authMiddleware,
    canConsultar('CJ'),
    asyncHandler(cjConductaController.getMasFrecuentes)
);

/**
 * @route   GET /api/cj-conductas/cj/:cj_id
 * @desc    Obtener todas las conductas de una CJ
 * @access  Private
 */
router.get(
    '/cj/:cj_id',
    authMiddleware,
    canConsultar('CJ'),
    validateId,
    asyncHandler(cjConductaController.getByCjId)
);

/**
 * @route   GET /api/cj-conductas/:id
 * @desc    Obtener conducta por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    canConsultar('CJ'),
    validateId,
    asyncHandler(cjConductaController.getById)
);

/**
 * @route   POST /api/cj-conductas
 * @desc    Crear nueva conducta del adolescente
 * @body    { cj_id, conducta_id?, texto_conducta?, fecha_conducta? }
 * @access  Private (Admin o Juzgado)
 */
router.post(
    '/',
    authMiddleware,
    canModificar('CJ'),
    asyncHandler(cjConductaController.create)
);

/**
 * @route   PUT /api/cj-conductas/:id
 * @desc    Actualizar conducta
 * @access  Private (Admin o Juzgado)
 */
router.put(
    '/:id',
    authMiddleware,
    canModificar('CJ'),
    validateId,
    asyncHandler(cjConductaController.update)
);

/**
 * @route   DELETE /api/cj-conductas/:id
 * @desc    Eliminar conducta
 * @access  Private (Admin o Juzgado)
 */
router.delete(
    '/:id',
    authMiddleware,
    canEliminar('CJ'),
    validateId,
    asyncHandler(cjConductaController.remove)
);

module.exports = router;