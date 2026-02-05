// src/routes/adolescenteRoutes.js

const express = require('express');
const router = express.Router();
const adolescenteController = require('../controllers/adolescenteController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOrJuzgado, adminOrJuzgadoEjecucion, adminOnly } = require('../middlewares/checkRole');
const {
    validateId,
    validatePagination,
    validateAdolescenteCreate,
    validateAdolescenteUpdate
} = require('../middlewares/validate');

/**
 * RUTAS DE ADOLESCENTES
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear: Administrador, Juzgado, Juzgado Ejecución
 * - Modificar: Administrador, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Administrador
 */

/**
 * @route   GET /api/adolescentes
 * @desc    Obtener todos los adolescentes
 * @query   page?, limit?, search?, sexo?, edad_min?, edad_max?
 * @access  Private (requiere autenticación)
 */
router.get(
    '/',
    authMiddleware,
    validatePagination,
    asyncHandler(adolescenteController.getAll)
);

/**
 * @route   GET /api/adolescentes/stats
 * @desc    Obtener estadísticas de adolescentes
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(adolescenteController.getStats)
);

/**
 * @route   GET /api/adolescentes/:id
 * @desc    Obtener adolescente por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(adolescenteController.getById)
);

/**
 * @route   GET /api/adolescentes/:id/proceso
 * @desc    Verificar si el adolescente tiene proceso
 * @access  Private
 */
router.get(
    '/:id/proceso',
    authMiddleware,
    validateId,
    asyncHandler(adolescenteController.checkProceso)
);

/**
 * @route   POST /api/adolescentes
 * @desc    Crear nuevo adolescente
 * @body    { nombre, fecha_nacimiento, sexo?, iniciales?, domicilio?, ... }
 * @access  Private (Admin, Juzgado o Juzgado Ejecución)
 */
router.post(
    '/',
    authMiddleware,
    (req, res, next) => {
        // Permitir Admin, Juzgado o Juzgado Ejecución
        const { rol_nombre } = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const { ForbiddenError } = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para crear adolescentes. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateAdolescenteCreate,
    asyncHandler(adolescenteController.create)
);

/**
 * @route   PUT /api/adolescentes/:id
 * @desc    Actualizar adolescente
 * @body    { nombre?, fecha_nacimiento?, sexo?, domicilio?, ... }
 * @access  Private (Admin, Juzgado o Juzgado Ejecución)
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
                `No tienes permisos para modificar adolescentes. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    validateAdolescenteUpdate,
    asyncHandler(adolescenteController.update)
);

/**
 * @route   DELETE /api/adolescentes/:id
 * @desc    Eliminar adolescente
 * @access  Private (Solo Administrador)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(adolescenteController.remove)
);

module.exports = router;