// src/middlewares/validate.js

const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('../utils/errorHandler');

/**
 * MIDDLEWARE DE VALIDACIÓN
 *
 * Usa express-validator para validar datos de entrada
 * Si hay errores, lanza ValidationError con detalles
 */

// =====================================================
// EJECUTOR DE VALIDACIONES
// =====================================================
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Formatear errores
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));

        throw new ValidationError(
            'Error de validación en los datos enviados',
            formattedErrors
        );
    }

    next();
};

// =====================================================
// VALIDACIONES PARA CATÁLOGOS
// =====================================================

/**
 * Validar tipo de catálogo en la URL
 */
const validateCatalogoTipo = [
    param('tipo')
        .isIn([
            'roles',
            'estados-procesales',
            'status',
            'tipos-medidas-sancionadoras',
            'tipos-medidas-cautelares',
            'tipos-reparacion'
        ])
        .withMessage('Tipo de catálogo no válido'),
    validate
];

/**
 * Validar ID numérico
 */
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),
    validate
];

/**
 * Validar creación de catálogo
 */
const validateCatalogoCreate = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 150 })
        .withMessage('El nombre no puede tener más de 150 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('La descripción no puede tener más de 150 caracteres'),

    // Para tipos de medidas sancionadoras
    body('es_privativa')
        .optional()
        .isBoolean()
        .withMessage('es_privativa debe ser true o false'),

    // Para tipos de medidas cautelares
    body('genera_cemci')
        .optional()
        .isBoolean()
        .withMessage('genera_cemci debe ser true o false'),

    validate
];

/**
 * Validar actualización de catálogo
 */
const validateCatalogoUpdate = [
    body('nombre')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El nombre no puede estar vacío')
        .isLength({ max: 150 })
        .withMessage('El nombre no puede tener más de 150 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('La descripción no puede tener más de 150 caracteres'),

    body('es_privativa')
        .optional()
        .isBoolean()
        .withMessage('es_privativa debe ser true o false'),

    body('genera_cemci')
        .optional()
        .isBoolean()
        .withMessage('genera_cemci debe ser true o false'),

    validate
];

/**
 * Validar parámetros de paginación
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero mayor a 0'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un número entre 1 y 100'),

    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('search no puede tener más de 100 caracteres'),

    validate
];

/**
 * Validar fecha en formato YYYY-MM-DD
 */
const validateDate = (fieldName) => {
    return body(fieldName)
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage(`${fieldName} debe tener formato YYYY-MM-DD`)
        .custom((value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error(`${fieldName} no es una fecha válida`);
            }
            return true;
        });
};

/**
 * Validar que una fecha sea anterior a otra
 */
const validateDateBefore = (field1, field2) => {
    return body(field2)
        .custom((value, { req }) => {
            if (!value || !req.body[field1]) {
                return true; // Si alguna no existe, pasar (se valida con .optional())
            }

            const date1 = new Date(req.body[field1]);
            const date2 = new Date(value);

            if (date1 >= date2) {
                throw new Error(`${field2} debe ser posterior a ${field1}`);
            }

            return true;
        });
};

/**
 * Validar email
 */
const validateEmail = (fieldName) => {
    return body(fieldName)
        .optional()
        .trim()
        .isEmail()
        .withMessage(`${fieldName} debe ser un email válido`)
        .normalizeEmail();
};

/**
 * Validar teléfono (10 dígitos)
 */
const validatePhone = (fieldName) => {
    return body(fieldName)
        .optional()
        .trim()
        .matches(/^\d{10}$/)
        .withMessage(`${fieldName} debe tener 10 dígitos`);
};

/**
 * Validar booleano
 */
const validateBoolean = (fieldName) => {
    return body(fieldName)
        .optional()
        .isBoolean()
        .withMessage(`${fieldName} debe ser true o false`);
};

module.exports = {
    validate,
    validateCatalogoTipo,
    validateId,
    validateCatalogoCreate,
    validateCatalogoUpdate,
    validatePagination,
    validateDate,
    validateDateBefore,
    validateEmail,
    validatePhone,
    validateBoolean
};