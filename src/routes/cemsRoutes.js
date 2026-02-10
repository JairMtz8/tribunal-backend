// src/routes/cemsRoutes.js

const express = require('express');
const router = express.Router();
const cemsController = require('../controllers/cemsController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { canConsultar, canModificar, canEliminar } = require('../middlewares/checkCarpetaPermission');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CEMS
 *
 * PERMISOS:
 * - Consultar: Todos
 * - Crear/Modificar: Admin, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

// =====================================================
// CEMS (Carpeta principal)
// =====================================================

/**
 * @route   GET /api/cems
 * @desc    Obtener todas las CEMS
 * @query   estado_procesal_id?, status?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getAll)
);

/**
 * @route   GET /api/cems/stats
 * @desc    Obtener estadísticas de CEMS
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getStats)
);

/**
 * @route   GET /api/cems/cjo/:cjo_id
 * @desc    Obtener CEMS por CJO_ID
 * @access  Private
 */
router.get(
    '/cjo/:cjo_id',
    authMiddleware,
    canConsultar('CEMS'),
    validateId,
    asyncHandler(cemsController.getByCjoId)
);

/**
 * @route   GET /api/cems/:id
 * @desc    Obtener CEMS por ID (con exhortaciones y seguimientos)
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    canConsultar('CEMS'),
    validateId,
    asyncHandler(cemsController.getById)
);

/**
 * @route   POST /api/cems
 * @desc    Crear CEMS (manual - normalmente se auto-crea)
 * @body    { numero_cems, cj_id, cjo_id, cemci_id?, ... }
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.post(
    '/',
    authMiddleware,
    canModificar('CEMS'),
    asyncHandler(cemsController.create)
);

/**
 * @route   PUT /api/cems/:id
 * @desc    Actualizar CEMS
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.put(
    '/:id',
    authMiddleware,
    canModificar('CEMS'),
    validateId,
    asyncHandler(cemsController.update)
);

/**
 * @route   DELETE /api/cems/:id
 * @desc    Eliminar CEMS
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    canEliminar('CEMS'),
    validateId,
    asyncHandler(cemsController.remove)
);

// =====================================================
// CEMS EXHORTACIÓN
// =====================================================

/**
 * @route   GET /api/cems/exhortacion/stats
 * @desc    Obtener estadísticas de exhortaciones
 * @access  Private
 */
router.get(
    '/exhortacion/stats',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getStatsExhortacion)
);

/**
 * @route   GET /api/cems/:cems_id/exhortaciones
 * @desc    Obtener exhortaciones de un CEMS
 * @access  Private
 */
router.get(
    '/:cems_id/exhortaciones',
    authMiddleware,
    canConsultar('CEMS'),
    validateId,
    asyncHandler(cemsController.getExhortacionesByCems)
);

/**
 * @route   GET /api/cems/exhortacion/proceso/:proceso_id
 * @desc    Obtener exhortación de un proceso
 * @access  Private
 */
router.get(
    '/exhortacion/proceso/:proceso_id',
    authMiddleware,
    canConsultar('CEMS'),
    validateId,
    asyncHandler(cemsController.getExhortacionByProceso)
);

/**
 * @route   POST /api/cems/exhortacion
 * @desc    Crear exhortación de CEMS
 * @body    { cems_id, proceso_id, ... }
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.post(
    '/exhortacion',
    authMiddleware,
    canModificar('CEMS'),
    asyncHandler(cemsController.createExhortacion)
);

/**
 * @route   PUT /api/cems/exhortacion/:id
 * @desc    Actualizar exhortación
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.put(
    '/exhortacion/:id',
    authMiddleware,
    canModificar('CEMS'),
    validateId,
    asyncHandler(cemsController.updateExhortacion)
);

/**
 * @route   DELETE /api/cems/exhortacion/:id
 * @desc    Eliminar exhortación
 * @access  Private (Solo Admin)
 */
router.delete(
    '/exhortacion/:id',
    authMiddleware,
    canEliminar('CEMS'),
    validateId,
    asyncHandler(cemsController.removeExhortacion)
);

// =====================================================
// CEMS SEGUIMIENTO
// =====================================================

/**
 * @route   GET /api/cems/seguimiento/cumplimiento-anticipado
 * @desc    Obtener seguimientos con cumplimiento anticipado
 * @access  Private
 */
router.get(
    '/seguimiento/cumplimiento-anticipado',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getCumplimientoAnticipado)
);

/**
 * @route   GET /api/cems/seguimiento/sustraidos
 * @desc    Obtener seguimientos de sustraídos
 * @access  Private
 */
router.get(
    '/seguimiento/sustraidos',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getSustraidos)
);

/**
 * @route   GET /api/cems/seguimiento/orden-librada
 * @desc    Obtener seguimientos con orden librada
 * @access  Private
 */
router.get(
    '/seguimiento/orden-librada',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getConOrdenLibrada)
);

/**
 * @route   GET /api/cems/seguimiento/stats
 * @desc    Obtener estadísticas de seguimientos
 * @access  Private
 */
router.get(
    '/seguimiento/stats',
    authMiddleware,
    canConsultar('CEMS'),
    asyncHandler(cemsController.getStatsSeguimiento)
);

/**
 * @route   GET /api/cems/:cems_id/seguimientos
 * @desc    Obtener seguimientos de un CEMS
 * @access  Private
 */
router.get(
    '/:cems_id/seguimientos',
    authMiddleware,
    canConsultar('CEMS'),
    validateId,
    asyncHandler(cemsController.getSeguimientosByCems)
);

/**
 * @route   GET /api/cems/seguimiento/proceso/:proceso_id
 * @desc    Obtener seguimiento de un proceso
 * @access  Private
 */
router.get(
    '/seguimiento/proceso/:proceso_id',
    authMiddleware,
    canConsultar('CEMS'),
    validateId,
    asyncHandler(cemsController.getSeguimientoByProceso)
);

/**
 * @route   POST /api/cems/seguimiento
 * @desc    Crear seguimiento de CEMS
 * @body    { cems_id, proceso_id, ... }
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.post(
    '/seguimiento',
    authMiddleware,
    canModificar('CEMS'),
    asyncHandler(cemsController.createSeguimiento)
);

/**
 * @route   PUT /api/cems/seguimiento/:id
 * @desc    Actualizar seguimiento
 * @access  Private (Admin, Juzgado Ejecución)
 */
router.put(
    '/seguimiento/:id',
    authMiddleware,
    canModificar('CEMS'),
    validateId,
    asyncHandler(cemsController.updateSeguimiento)
);

/**
 * @route   DELETE /api/cems/seguimiento/:id
 * @desc    Eliminar seguimiento
 * @access  Private (Solo Admin)
 */
router.delete(
    '/seguimiento/:id',
    authMiddleware,
    canEliminar('CEMS'),
    validateId,
    asyncHandler(cemsController.removeSeguimiento)
);

module.exports = router;