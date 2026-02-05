// src/routes/domicilioRoutes.js

const express = require('express');
const router = express.Router();
const domicilioController = require('../controllers/domicilioController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/checkRole');
const { validateId } = require('../middlewares/validate');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');

/**
 * RUTAS DE DOMICILIOS
 *
 * Permite crear domicilios independientes que luego pueden
 * asociarse a adolescentes o usar como lugares de hechos en CJ
 */

/**
 * @route   GET /api/domicilios
 * @desc    Obtener todos los domicilios
 * @query   es_lugar_hechos? (true/false), search?
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    asyncHandler(domicilioController.getAll)
);

/**
 * @route   GET /api/domicilios/personales
 * @desc    Obtener solo domicilios personales (no lugares de hechos)
 * @access  Private
 */
router.get(
    '/personales',
    authMiddleware,
    asyncHandler(domicilioController.getPersonales)
);

/**
 * @route   GET /api/domicilios/lugares-hechos
 * @desc    Obtener solo lugares de hechos
 * @access  Private
 */
router.get(
    '/lugares-hechos',
    authMiddleware,
    asyncHandler(domicilioController.getLugaresHechos)
);

/**
 * @route   GET /api/domicilios/:id
 * @desc    Obtener domicilio por ID
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validateId,
    asyncHandler(domicilioController.getById)
);

/**
 * @route   POST /api/domicilios
 * @desc    Crear nuevo domicilio
 * @body    { municipio?, calle_numero?, colonia?, es_lugar_hechos? }
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
                `No tienes permisos para crear domicilios. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    [
        body('municipio')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('El municipio no puede tener más de 100 caracteres'),

        body('calle_numero')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('La calle y número no puede tener más de 200 caracteres'),

        body('colonia')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('La colonia no puede tener más de 100 caracteres'),

        body('es_lugar_hechos')
            .optional()
            .isBoolean()
            .withMessage('es_lugar_hechos debe ser true o false'),

        validate
    ],
    asyncHandler(domicilioController.create)
);

/**
 * @route   PUT /api/domicilios/:id
 * @desc    Actualizar domicilio
 * @body    { municipio?, calle_numero?, colonia?, es_lugar_hechos? }
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
                `No tienes permisos para modificar domicilios. ` +
                `Roles permitidos: ${rolesPermitidos.join(', ')}`
            ));
        }

        next();
    },
    validateId,
    [
        body('municipio')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('El municipio no puede tener más de 100 caracteres'),

        body('calle_numero')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('La calle y número no puede tener más de 200 caracteres'),

        body('colonia')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('La colonia no puede tener más de 100 caracteres'),

        body('es_lugar_hechos')
            .optional()
            .isBoolean()
            .withMessage('es_lugar_hechos debe ser true o false'),

        validate
    ],
    asyncHandler(domicilioController.update)
);

/**
 * @route   DELETE /api/domicilios/:id
 * @desc    Eliminar domicilio
 * @access  Private (Solo Administrador)
 */
router.delete(
    '/:id',
    authMiddleware,
    adminOnly,
    validateId,
    asyncHandler(domicilioController.remove)
);

module.exports = router;