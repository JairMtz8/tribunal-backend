// src/routes/catalogoRoutes.js

const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOrJuzgado, adminOnly } = require('../middlewares/checkRole');
const {
    validateCatalogoTipo,
    validateId,
    validateCatalogoCreate,
    validateCatalogoUpdate,
    validatePagination
} = require('../middlewares/validate');

/**
 * RUTAS DE CATÁLOGOS
 *
 * Todas las rutas usan el parámetro :tipo para identificar el catálogo
 * Ejemplo: /api/catalogos/roles
 *
 * PROTECCIÓN:
 * - GET (lectura): Requiere autenticación
 * - POST/PUT/DELETE (escritura): Requiere rol Administrador o Juzgado
 */

/**
 * @route   GET /api/catalogos/:tipo
 * @desc    Obtener todos los registros de un catálogo
 * @query   page (opcional) - Número de página
 * @query   limit (opcional) - Registros por página
 * @query   search (opcional) - Búsqueda por nombre
 * @access  Private (requiere autenticación)
 */
router.get(
    '/:tipo',
    authMiddleware,  // ← Requiere estar autenticado
    validateCatalogoTipo,
    validatePagination,
    asyncHandler(catalogoController.getAll)
);

/**
 * @route   GET /api/catalogos/:tipo/stats
 * @desc    Obtener estadísticas de un catálogo
 * @access  Private (requiere autenticación)
 */
router.get(
    '/:tipo/stats',
    authMiddleware,
    validateCatalogoTipo,
    asyncHandler(catalogoController.getStats)
);

/**
 * @route   GET /api/catalogos/:tipo/:id
 * @desc    Obtener un registro específico por ID
 * @access  Private (requiere autenticación)
 */
router.get(
    '/:tipo/:id',
    authMiddleware,
    validateCatalogoTipo,
    validateId,
    asyncHandler(catalogoController.getById)
);

/**
 * @route   POST /api/catalogos/:tipo
 * @desc    Crear un nuevo registro en el catálogo
 * @body    { nombre, descripcion?, es_privativa?, genera_cemci? }
 * @access  Private (Solo Admin o Juzgado)
 */
router.post(
    '/:tipo',
    authMiddleware,
    adminOrJuzgado,  // ← Solo Admin o Juzgado pueden crear
    validateCatalogoTipo,
    validateCatalogoCreate,
    asyncHandler(catalogoController.create)
);

/**
 * @route   PUT /api/catalogos/:tipo/:id
 * @desc    Actualizar un registro del catálogo
 * @body    { nombre?, descripcion?, es_privativa?, genera_cemci? }
 * @access  Private (Solo Admin o Juzgado)
 */
router.put(
    '/:tipo/:id',
    authMiddleware,
    adminOrJuzgado,
    validateCatalogoTipo,
    validateId,
    validateCatalogoUpdate,
    asyncHandler(catalogoController.update)
);

/**
 * @route   DELETE /api/catalogos/:tipo/:id
 * @desc    Eliminar un registro del catálogo
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:tipo/:id',
    authMiddleware,
    adminOnly,  // ← Solo Admin puede eliminar
    validateCatalogoTipo,
    validateId,
    asyncHandler(catalogoController.remove)
);

module.exports = router;