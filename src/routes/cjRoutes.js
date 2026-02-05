// src/routes/cjRoutes.js

const express = require('express');
const router = express.Router();
const cjController = require('../controllers/cjController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { canConsultar, canModificar, canEliminar } = require('../middlewares/checkCarpetaPermission');
const { validateId, validatePagination } = require('../middlewares/validate');

/**
 * RUTAS DE CJ (Carpeta Judicial)
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Modificar: Admin y Juzgado
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/cj
 * @desc    Obtener todas las carpetas judiciales
 * @query   page?, limit?, search?, tipo_fuero?, vinculacion?, reincidente?
 * @access  Private (requiere autenticación)
 */
router.get(
    '/',
    authMiddleware,
    canConsultar('CJ'),
    validatePagination,
    asyncHandler(cjController.getAll)
);

/**
 * @route   GET /api/cj/stats
 * @desc    Obtener estadísticas de CJ
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    canConsultar('CJ'),
    asyncHandler(cjController.getStats)
);

/**
 * @route   GET /api/cj/:id
 * @desc    Obtener CJ por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    canConsultar('CJ'),
    validateId,
    asyncHandler(cjController.getById)
);

/**
 * @route   PUT /api/cj/:id
 * @desc    Actualizar CJ
 * @body    Cualquier campo de CJ
 * @access  Private (Admin o Juzgado)
 */
router.put(
    '/:id',
    authMiddleware,
    canModificar('CJ'),
    validateId,
    asyncHandler(cjController.update)
);

/**
 * @route   DELETE /api/cj/:id
 * @desc    Eliminar CJ
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    canEliminar('CJ'),
    validateId,
    asyncHandler(cjController.remove)
);

module.exports = router;