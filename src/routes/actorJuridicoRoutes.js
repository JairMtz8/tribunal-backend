// src/routes/actorJuridicoRoutes.js

const express = require('express');
const router = express.Router();
const actorJuridicoController = require('../controllers/actorJuridicoController');
const {asyncHandler} = require('../middlewares/errorMiddleware');
const {authMiddleware} = require('../middlewares/auth');
const {adminOnly} = require('../middlewares/checkRole');
const {validateId} = require('../middlewares/validate');

/**
 * RUTAS DE ACTORES JURÍDICOS
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 *
 * NOTA: Las rutas de asignación a procesos están en procesoRoutes.js
 */

/**
 * @route   GET /api/actores/stats
 * @desc    Obtener estadísticas de actores
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(actorJuridicoController.getStats)
);

/**
 * @route   GET /api/actores/tipo/:tipo
 * @desc    Obtener actores por tipo
 * @param   tipo (defensa, fiscal, asesor juridico, juez, representante, juez apoyo)
 * @access  Private
 */
router.get(
    '/tipo/:tipo',
    authMiddleware,
    asyncHandler(actorJuridicoController.getByTipo)
);

/**
 * @route   GET /api/actores
 * @desc    Obtener todos los actores jurídicos
 * @query   tipo?, search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(actorJuridicoController.getAll)
);

/**
 * @route   GET /api/actores/search
 * @desc    Buscar actores por nombre
 * @query   q (query string)
 * @access  Private
 */
router.get(
    '/search',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const {q} = req.query;

        if (!q || q.length < 3) {
            return res.json({success: true, data: []});
        }

        const sql = `
            SELECT *
            FROM actor_juridico
            WHERE nombre LIKE ?
            ORDER BY nombre LIMIT 10
        `;

        const {executeQuery} = require('../config/database');
        const actores = await executeQuery(sql, [`%${q}%`]);

        return res.json({
            success: true,
            data: actores
        });
    })
);


/**
 * @route   GET /api/actores/:id
 * @desc    Obtener actor por ID (con procesos)
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(actorJuridicoController.getById)
);

/**
 * @route   POST /api/actores
 * @desc    Crear nuevo actor jurídico
 * @body    { nombre, tipo }
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.post(
    '/',
    authMiddleware,
    (req, res, next) => {
        const {rol_nombre} = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const {ForbiddenError} = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para crear actores jurídicos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(actorJuridicoController.create)
);

/**
 * @route   PUT /api/actores/:id
 * @desc    Actualizar actor jurídico
 * @access  Private (Admin, Juzgado, Juzgado Ejecución)
 */
router.put(
    '/:id',
    authMiddleware,
    (req, res, next) => {
        const {rol_nombre} = req.user;
        const rolesPermitidos = ['Administrador', 'Juzgado', 'Juzgado Ejecución'];

        if (!rolesPermitidos.includes(rol_nombre)) {
            const {ForbiddenError} = require('../utils/errorHandler');
            return next(new ForbiddenError(
                `No tienes permisos para modificar actores jurídicos. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(actorJuridicoController.update)
);

/**
 * @route   DELETE /api/actores/:id
 * @desc    Eliminar actor jurídico
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(actorJuridicoController.remove)
);

module.exports = router;