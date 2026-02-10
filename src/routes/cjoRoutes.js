// src/routes/cjoRoutes.js

const express = require('express');
const router = express.Router();
const cjoController = require('../controllers/cjoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { canConsultar, canModificar, canEliminar } = require('../middlewares/checkCarpetaPermission');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CJO (CARPETA JUICIO ORAL)
 *
 * PERMISOS:
 * - Consultar: Todos
 * - Crear/Modificar: Admin, Juzgado
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/cjo
 * @desc    Obtener todas las CJO
 * @query   fuero?, sentencia?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    canConsultar('CJO'),
    asyncHandler(cjoController.getAll)
);

/**
 * @route   GET /api/cjo/stats
 * @desc    Obtener estadísticas de CJO
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    canConsultar('CJO'),
    asyncHandler(cjoController.getStats)
);

/**
 * @route   GET /api/cjo/cj/:cj_id
 * @desc    Obtener CJO por CJ_ID
 * @access  Private
 */
router.get(
    '/cj/:cj_id',
    authMiddleware,
    canConsultar('CJO'),
    validateId,
    asyncHandler(cjoController.getByCjId)
);

/**
 * @route   GET /api/cjo/:id
 * @desc    Obtener CJO por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    canConsultar('CJO'),
    validateId,
    asyncHandler(cjoController.getById)
);

/**
 * @route   POST /api/cjo
 * @desc    Crear CJO (auto-crea CEMS si sentencia condenatoria o mixta)
 * @body    { numero_cjo, cj_id, sentencia?, ... }
 * @access  Private (Admin, Juzgado)
 */
router.post(
    '/',
    authMiddleware,
    canModificar('CJO'),
    asyncHandler(cjoController.create)
);

/**
 * @route   PUT /api/cjo/:id
 * @desc    Actualizar CJO (auto-crea CEMS si sentencia cambia a condenatoria o mixta)
 * @access  Private (Admin, Juzgado)
 */
router.put(
    '/:id',
    authMiddleware,
    canModificar('CJO'),
    validateId,
    asyncHandler(cjoController.update)
);

/**
 * @route   DELETE /api/cjo/:id
 * @desc    Eliminar CJO
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    canEliminar('CJO'),
    validateId,
    asyncHandler(cjoController.remove)
);

module.exports = router;