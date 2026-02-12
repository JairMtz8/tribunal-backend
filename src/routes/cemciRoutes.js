// src/routes/cemciRoutes.js

const express = require('express');
const router = express.Router();
const cemciController = require('../controllers/cemciController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { canConsultar, canModificar, canEliminar } = require('../middlewares/checkCarpetaPermission');
const { validateId, validateCjId } = require('../middlewares/validate');

/**
 * RUTAS DE CEMCI
 *
 * PERMISOS:
 * - Consultar: Todos
 * - Crear/Modificar: Admin, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

// =====================================================
// CEMCI (Carpeta principal)
// =====================================================

/**
 * @route   GET /api/cemci
 * @desc    Obtener todas las CEMCI
 * @query   estado_procesal_id?, concluido?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    canConsultar('CEMCI'),
    asyncHandler(cemciController.getAll)
);

/**
 * @route   GET /api/cemci/stats
 * @desc    Obtener estadísticas de CEMCI
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    canConsultar('CEMCI'),
    asyncHandler(cemciController.getStats)
);

/**
 * @route   GET /api/cemci/cj/:cj_id
 * @desc    Obtener CEMCI por CJ_ID
 * @access  Private
 */
router.get(
    '/cj/:cj_id',
    authMiddleware,
    canConsultar('CEMCI'),
    validateCjId,
    asyncHandler(cemciController.getByCjId)
);

/**
 * @route   GET /api/cemci/:id
 * @desc    Obtener CEMCI por ID (con seguimientos)
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    canConsultar('CEMCI'),
    validateId,
    asyncHandler(cemciController.getById)
);

/**
 * @route   PUT /api/cemci/:id
 * @desc    Actualizar CEMCI (llenar datos adicionales)
 * @body    { cjo_id?, fecha_recepcion_cemci?, estado_procesal_id?, concluido?, observaciones? }
 * @access  Private (Admin, Juzgado Ejecución)
 * @note    CEMCI se crea automáticamente al aplicar medida cautelar de internamiento
 */
router.put(
    '/:id',
    authMiddleware,
    canModificar('CEMCI'),
    validateId,
    asyncHandler(cemciController.update)
);

/**
 * @route   DELETE /api/cemci/:id
 * @desc    Eliminar CEMCI
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    canEliminar('CEMCI'),
    validateId,
    asyncHandler(cemciController.remove)
);

// =====================================================
// CEMCI SEGUIMIENTO
// =====================================================

/**
 * @route   GET /api/cemci/seguimiento/suspendidos
 * @desc    Obtener seguimientos suspendidos
 * @access  Private
 */
router.get(
    '/seguimiento/suspendidos',
    authMiddleware,
    canConsultar('CEMCI'),
    asyncHandler(cemciController.getSuspendidos)
);

/**
 * @route   GET /api/cemci/seguimiento/stats
 * @desc    Obtener estadísticas de seguimientos
 * @access  Private
 */
router.get(
    '/seguimiento/stats',
    authMiddleware,
    canConsultar('CEMCI'),
    asyncHandler(cemciController.getStatsSeguimiento)
);

/**
 * @route   GET /api/cemci/:cemci_id/seguimientos
 * @desc    Obtener seguimientos de un CEMCI
 * @access  Private
 */
router.get(
    '/:cemci_id/seguimientos',
    authMiddleware,
    canConsultar('CEMCI'),
    validateId,
    asyncHandler(cemciController.getSeguimientosByCemci)
);

/**
 * @route   GET /api/cemci/seguimiento/proceso/:proceso_id
 * @desc    Obtener seguimiento de un proceso
 * @access  Private
 */
router.get(
    '/seguimiento/proceso/:proceso_id',
    authMiddleware,
    canConsultar('CEMCI'),
    validateId,
    asyncHandler(cemciController.getSeguimientoByProceso)
);

/**
 * @route   POST /api/cemci/seguimiento
 * @desc    Crear seguimiento de CEMCI
 * @body    { cemci_id, proceso_id, ... }
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.post(
    '/seguimiento',
    authMiddleware,
    canModificar('CEMCI'),
    asyncHandler(cemciController.createSeguimiento)
);

/**
 * @route   PUT /api/cemci/seguimiento/:id
 * @desc    Actualizar seguimiento
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.put(
    '/seguimiento/:id',
    authMiddleware,
    canModificar('CEMCI'),
    validateId,
    asyncHandler(cemciController.updateSeguimiento)
);

/**
 * @route   DELETE /api/cemci/seguimiento/:id
 * @desc    Eliminar seguimiento
 * @access  Private (Solo Admin)
 */
router.delete(
    '/seguimiento/:id',
    authMiddleware,
    canEliminar('CEMCI'),
    validateId,
    asyncHandler(cemciController.removeSeguimiento)
);

/**
 * @route   PUT /api/cemci/:id/numero
 * @desc    Actualizar número de CEMCI
 * @body    { numero_cemci: "CEMCI-010/2025" }
 * @access  Private
 */
router.put(
    '/:id/numero',
    authMiddleware,
    validateId,
    asyncHandler(cemciController.updateNumero)
);

module.exports = router;