// src/routes/conductaRoutes.js

const express = require('express');
const router = express.Router();
const conductaController = require('../controllers/conductaController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE CONDUCTAS (Catálogo de Delitos)
 *
 * Todos pueden CONSULTAR
 * Solo ADMIN puede CREAR/MODIFICAR/ELIMINAR
 */

/**
 * @route   GET /api/conductas
 * @desc    Obtener todas las conductas
 * @query   tipo_conducta?, fuero_default?, activo?, search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(conductaController.getAll)
);

/**
 * @route   GET /api/conductas/stats
 * @desc    Obtener estadísticas de conductas
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(conductaController.getStats)
);

/**
 * @route   GET /api/conductas/:id
 * @desc    Obtener conducta por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(conductaController.getById)
);

/**
 * @route   POST /api/conductas
 * @desc    Crear nueva conducta
 * @body    { nombre, descripcion?, tipo_conducta?, fuero_default? }
 * @access  Private (Solo Admin)
 */
router.post(
    '/',
    authMiddleware,
    adminOnly,
    asyncHandler(conductaController.create)
);

/**
 * @route   PUT /api/conductas/:id
 * @desc    Actualizar conducta
 * @access  Private (Solo Admin)
 */
router.put(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(conductaController.update)
);

/**
 * @route   DELETE /api/conductas/:id
 * @desc    Eliminar conducta (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(conductaController.remove)
);

module.exports = router;