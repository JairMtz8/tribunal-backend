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
 * Validar CJ_ID numérico
 */
const validateCjId = [
    param('cj_id')
        .isInt({ min: 1 })
        .withMessage('El CJ_ID debe ser un número entero positivo'),
    validate
];

/**
 * Validar CJO_ID numérico
 */
const validateCjoId = [
    param('cjo_id')
        .isInt({ min: 1 })
        .withMessage('El CJO_ID debe ser un número entero positivo'),
    validate
];

/**
 * Validar PROCESO_ID numérico
 */
const validateProcesoId = [
    param('proceso_id')
        .isInt({ min: 1 })
        .withMessage('El PROCESO_ID debe ser un número entero positivo'),
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

// =====================================================
// VALIDACIONES PARA ADOLESCENTES
// =====================================================

/**
 * Validar creación de adolescente
 */
const validateAdolescenteCreate = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 150 })
        .withMessage('El nombre no puede tener más de 150 caracteres'),

    body('iniciales')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Las iniciales no pueden tener más de 10 caracteres'),

    body('sexo')
        .optional()
        .isIn(['Hombre', 'Mujer', 'Otro'])
        .withMessage('Sexo debe ser: Hombre, Mujer u Otro'),

    body('fecha_nacimiento')
        .notEmpty()
        .withMessage('La fecha de nacimiento es obligatoria')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Fecha debe tener formato YYYY-MM-DD')
        .custom((value) => {
            const fecha = new Date(value);
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha de nacimiento inválida');
            }

            // Calcular edad
            const hoy = new Date();
            let edad = hoy.getFullYear() - fecha.getFullYear();
            const mes = hoy.getMonth() - fecha.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
                edad--;
            }

            if (edad < 12 || edad > 17) {
                throw new Error(`La edad debe estar entre 12 y 17 años (edad calculada: ${edad})`);
            }

            return true;
        }),

    body('nacionalidad')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('La nacionalidad no puede tener más de 50 caracteres'),

    body('idioma')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El idioma no puede tener más de 50 caracteres'),

    body('otro_idioma_lengua')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Otro idioma no puede tener más de 50 caracteres'),

    body('escolaridad')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La escolaridad no puede tener más de 100 caracteres'),

    body('ocupacion')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La ocupación no puede tener más de 100 caracteres'),

    body('estado_civil')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El estado civil no puede tener más de 50 caracteres'),

    body('lugar_nacimiento_municipio')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El municipio no puede tener más de 100 caracteres'),

    body('lugar_nacimiento_estado')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El estado no puede tener más de 100 caracteres'),

    body('fuma_cigarro')
        .optional()
        .isBoolean()
        .withMessage('fuma_cigarro debe ser true o false'),

    body('consume_alcohol')
        .optional()
        .isBoolean()
        .withMessage('consume_alcohol debe ser true o false'),

    body('consume_drogas')
        .optional()
        .isBoolean()
        .withMessage('consume_drogas debe ser true o false'),

    body('tipo_droga')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El tipo de droga no puede tener más de 100 caracteres'),

    body('telefono')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El teléfono no puede tener más de 50 caracteres'),

    body('correo')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Correo inválido')
        .normalizeEmail(),

    // Validación de domicilio_id (si se usa domicilio existente)
    body('domicilio_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('domicilio_id debe ser un número entero positivo'),

    // Validación de domicilio (objeto anidado)
    body('domicilio.municipio')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El municipio no puede tener más de 100 caracteres'),

    body('domicilio.calle_numero')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La calle y número no puede tener más de 200 caracteres'),

    body('domicilio.colonia')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La colonia no puede tener más de 100 caracteres'),

    validate
];

/**
 * Validar actualización de adolescente
 */
const validateAdolescenteUpdate = [
    body('nombre')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El nombre no puede estar vacío')
        .isLength({ max: 150 })
        .withMessage('El nombre no puede tener más de 150 caracteres'),

    body('iniciales')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Las iniciales no pueden tener más de 10 caracteres'),

    body('sexo')
        .optional()
        .isIn(['Hombre', 'Mujer', 'Otro'])
        .withMessage('Sexo debe ser: Hombre, Mujer u Otro'),

    body('fecha_nacimiento')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Fecha debe tener formato YYYY-MM-DD')
        .custom((value) => {
            const fecha = new Date(value);
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha de nacimiento inválida');
            }

            const hoy = new Date();
            let edad = hoy.getFullYear() - fecha.getFullYear();
            const mes = hoy.getMonth() - fecha.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
                edad--;
            }

            if (edad < 12 || edad > 17) {
                throw new Error(`La edad debe estar entre 12 y 17 años (edad calculada: ${edad})`);
            }

            return true;
        }),

    body('telefono')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El teléfono no puede tener más de 50 caracteres'),

    body('correo')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Correo inválido')
        .normalizeEmail(),

    body('fuma_cigarro')
        .optional()
        .isBoolean()
        .withMessage('fuma_cigarro debe ser true o false'),

    body('consume_alcohol')
        .optional()
        .isBoolean()
        .withMessage('consume_alcohol debe ser true o false'),

    body('consume_drogas')
        .optional()
        .isBoolean()
        .withMessage('consume_drogas debe ser true o false'),

    body('domicilio.municipio')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El municipio no puede tener más de 100 caracteres'),

    body('domicilio.calle_numero')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La calle y número no puede tener más de 200 caracteres'),

    body('domicilio.colonia')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La colonia no puede tener más de 100 caracteres'),

    validate
];

module.exports = {
    validate,
    validateCatalogoTipo,
    validateId,
    validateCjId,
    validateCjoId,
    validateProcesoId,
    validateCatalogoCreate,
    validateCatalogoUpdate,
    validatePagination,
    validateDate,
    validateDateBefore,
    validateEmail,
    validatePhone,
    validateBoolean,
    validateAdolescenteCreate,
    validateAdolescenteUpdate
};