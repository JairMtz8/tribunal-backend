// src/routes/victimaRoutes.js

const express = require('express');
const router = express.Router();
const victimaController = require('../controllers/victimaController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId, validatePagination } = require('../middlewares/validate');

/**
 * RUTAS DE VÍCTIMAS
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 *
 * NOTA: Las rutas de asociación a procesos están en procesoRoutes.js
 */

/**
 * @route   GET /api/victimas/stats
 * @desc    Obtener estadísticas de víctimas
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(victimaController.getStats)
);

/**
 * @route   GET /api/victimas
 * @desc    Obtener todas las víctimas
 * @query   page?, limit?, sexo?, es_menor?, search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    validatePagination,
    asyncHandler(victimaController.getAll)
);

/**
 * @route   GET /api/victimas/:id
 * @desc    Obtener víctima por ID (con procesos)
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(victimaController.getById)
);

/**
 * @route   POST /api/victimas
 * @desc    Crear nueva víctima
 * @body    { nombre, iniciales?, sexo?, edad?, es_menor? }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para crear víctimas. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(victimaController.create)
);

/**
 * @route   PUT /api/victimas/:id
 * @desc    Actualizar víctima
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.put(
    '/:id',
    authMiddleware,
    (req, res, next) => {
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para modificar víctimas. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(victimaController.update)
);

/**
 * @route   DELETE /api/victimas/:id
 * @desc    Eliminar víctima
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(victimaController.remove)
);

module.exports = router;