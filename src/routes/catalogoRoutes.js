// src/routes/catalogoRoutes.js

const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
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
 */

/**
 * @route   GET /api/catalogos/:tipo
 * @desc    Obtener todos los registros de un catálogo
 * @query   page (opcional) - Número de página
 * @query   limit (opcional) - Registros por página
 * @query   search (opcional) - Búsqueda por nombre
 * @access  Public (TODO: cambiar a Private cuando haya auth)
 */
router.get(
    '/:tipo',
    validateCatalogoTipo,
    validatePagination,
    asyncHandler(catalogoController.getAll)
);

/**
 * @route   GET /api/catalogos/:tipo/stats
 * @desc    Obtener estadísticas de un catálogo
 * @access  Public (TODO: cambiar a Private)
 */
router.get(
    '/:tipo/stats',
    validateCatalogoTipo,
    asyncHandler(catalogoController.getStats)
);

/**
 * @route   GET /api/catalogos/:tipo/:id
 * @desc    Obtener un registro específico por ID
 * @access  Public (TODO: cambiar a Private)
 */
router.get(
    '/:tipo/:id',
    validateCatalogoTipo,
    validateId,
    asyncHandler(catalogoController.getById)
);

/**
 * @route   POST /api/catalogos/:tipo
 * @desc    Crear un nuevo registro en el catálogo
 * @body    { nombre, descripcion?, es_privativa?, genera_cemci? }
 * @access  Private (TODO: Solo Admin/Juez)
 */
router.post(
    '/:tipo',
    validateCatalogoTipo,
    validateCatalogoCreate,
    asyncHandler(catalogoController.create)
);

/**
 * @route   PUT /api/catalogos/:tipo/:id
 * @desc    Actualizar un registro del catálogo
 * @body    { nombre?, descripcion?, es_privativa?, genera_cemci? }
 * @access  Private (TODO: Solo Admin/Juez)
 */
router.put(
    '/:tipo/:id',
    validateCatalogoTipo,
    validateId,
    validateCatalogoUpdate,
    asyncHandler(catalogoController.update)
);

/**
 * @route   DELETE /api/catalogos/:tipo/:id
 * @desc    Eliminar un registro del catálogo
 * @access  Private (TODO: Solo Admin)
 */
router.delete(
    '/:tipo/:id',
    validateCatalogoTipo,
    validateId,
    asyncHandler(catalogoController.remove)
);

module.exports = router;