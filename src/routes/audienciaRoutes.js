// src/routes/audienciaRoutes.js

const express = require('express');
const router = express.Router();
const audienciaController = require('../controllers/audienciaController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');

/**
 * RUTAS DE AUDIENCIAS
 *
 * PERMISOS:
 * - Consultar: Todos los usuarios autenticados
 * - Crear/Modificar: Admin, Juzgado, Juzgado Ejecución
 * - Eliminar: Solo Admin
 */

/**
 * @route   GET /api/audiencias
 * @desc    Obtener todas las audiencias
 * @query   tipo?, fecha_desde?, fecha_hasta?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(audienciaController.getAll)
);

/**
 * @route   GET /api/audiencias/proximas
 * @desc    Obtener audiencias próximas (siguientes 30 días por defecto)
 * @query   dias?
 * @access  Private
 */
router.get(
    '/proximas',
    authMiddleware,
    asyncHandler(audienciaController.getProximas)
);

/**
 * @route   GET /api/audiencias/del-dia
 * @desc    Obtener audiencias del día
 * @query   fecha? (formato: YYYY-MM-DD)
 * @access  Private
 */
router.get(
    '/del-dia',
    authMiddleware,
    asyncHandler(audienciaController.getDelDia)
);

/**
 * @route   GET /api/audiencias/stats
 * @desc    Obtener estadísticas de audiencias
 * @access  Private
 */
router.get(
    '/stats',
    authMiddleware,
    asyncHandler(audienciaController.getStats)
);

/**
 * @route   GET /api/audiencias/stats/tipo
 * @desc    Obtener estadísticas por tipo de audiencia
 * @access  Private
 */
router.get(
    '/stats/tipo',
    authMiddleware,
    asyncHandler(audienciaController.getStatsByTipo)
);

/**
 * @route   GET /api/audiencias/proceso/:proceso_id
 * @desc    Obtener audiencias de un proceso
 * @access  Private
 */
router.get(
    '/proceso/:proceso_id',
    authMiddleware,
    validateId,
    asyncHandler(audienciaController.getByProcesoId)
);

/**
 * @route   GET /api/audiencias/carpeta/:tipo_carpeta/:carpeta_id
 * @desc    Obtener audiencias de una carpeta específica
 * @param   tipo_carpeta (CJ, CJO, CEMCI, CEMS)
 * @access  Private
 */
router.get(
    '/carpeta/:tipo_carpeta/:carpeta_id',
    authMiddleware,
    asyncHandler(audienciaController.getByCarpeta)
);

/**
 * @route   GET /api/audiencias/:id
 * @desc    Obtener audiencia por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(audienciaController.getById)
);

/**
 * @route   POST /api/audiencias
 * @desc    Crear audiencia
 * @body    { proceso_id, fecha_audiencia, cj_id?, cjo_id?, cemci_id?, cems_id?, tipo?, observaciones? }
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
                `No tienes permisos para crear audiencias. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    asyncHandler(audienciaController.create)
);

/**
 * @route   PUT /api/audiencias/:id
 * @desc    Actualizar audiencia
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
                `No tienes permisos para modificar audiencias. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    asyncHandler(audienciaController.update)
);

/**
 * @route   DELETE /api/audiencias/:id
 * @desc    Eliminar audiencia
 * @access  Private (Solo Admin)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(audienciaController.remove)
);

module.exports = router;