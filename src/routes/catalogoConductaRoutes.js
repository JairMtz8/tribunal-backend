// src/routes/catalogoConductaRoutes.js

const express = require('express');
const router = express.Router();
const catalogoConductaController = require('../controllers/catalogoConductaController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CONDUCTA (CATÁLOGO)
 *
 * PERMISOS:
 * - Consultar: Todos autenticados
 * - Crear/Modificar/Eliminar: Solo Admin
 */

/**
 * @route   GET /api/catalogo-conductas
 * @desc    Obtener todas las conductas
 * @query   activo?, fuero_default?, search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(catalogoConductaController.getAll)
);

/**
 * @route   GET /api/catalogo-conductas/activas
 * @desc    Obtener solo conductas activas
 * @access  Private
 */
router.get(
    '/activas',
    authMiddleware,
    asyncHandler(catalogoConductaController.getActivas)
);

/**
 * @route   GET /api/catalogo-conductas/stats
 * @desc    Obtener estadísticas de uso
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(catalogoConductaController.getStatsUso)
);

/**
 * @route   GET /api/catalogo-conductas/fuero/:fuero
 * @desc    Obtener conductas por fuero (Común o Federal)
 * @access  Private
 */
router.get(
    '/fuero/:fuero',
    authMiddleware,
    asyncHandler(catalogoConductaController.getByFuero)
);

/**
 * @route   GET /api/catalogo-conductas/:id
 * @desc    Obtener conducta por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(catalogoConductaController.getById)
);

/**
 * @route   POST /api/catalogo-conductas
 * @desc    Crear conducta
 * @body    { nombre, descripcion?, fuero_default?, activo? }
 * @access  Private (Solo Admin)
 */
router.post(
    '/',
    authMiddleware,
    adminOnly,
    asyncHandler(catalogoConductaController.create)
);

/**
 * @route   PUT /api/catalogo-conductas/:id
 * @desc    Actualizar conducta
 * @access  Private (Solo Admin)
 */
router.put(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(catalogoConductaController.update)
);

/**
 * @route   PUT /api/catalogo-conductas/:id/toggle
 * @desc    Activar/Desactivar conducta
 * @access  Private (Solo Admin)
 */
router.put(
    '/:id/toggle',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(catalogoConductaController.toggleActivo)
);

/**
 * @route   DELETE /api/catalogo-conductas/:id
 * @desc    Eliminar conducta
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(catalogoConductaController.remove)
);

module.exports = router;