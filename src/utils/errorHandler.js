// src/utils/errorHandler.js

/**
 * CLASES DE ERROR PERSONALIZADAS
 *
 * ¿Por qué crear errores personalizados?
 * - Identificar el tipo de error fácilmente
 * - Asignar códigos HTTP automáticamente
 * - Mensajes consistentes para el frontend
 * - Separar errores de negocio de errores técnicos
 */

/**
 * ERROR BASE
 * Todos los errores personalizados heredan de esta clase
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Error esperado vs error de programación

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * ERROR 400 - BAD REQUEST
 * Cuando el cliente envía datos inválidos
 *
 * Ejemplo: Falta un campo obligatorio, formato de fecha incorrecto
 */
class BadRequestError extends AppError {
    constructor(message = 'Solicitud inválida') {
        super(message, 400);
    }
}

/**
 * ERROR 401 - UNAUTHORIZED
 * Cuando no hay token o el token es inválido
 *
 * Ejemplo: Token JWT expirado, sin token en el header
 */
class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado. Token inválido o expirado') {
        super(message, 401);
    }
}

/**
 * ERROR 403 - FORBIDDEN
 * Cuando el usuario no tiene permisos para la acción
 *
 * Ejemplo: Usuario con rol "defensa" intenta crear un proceso (solo jueces)
 */
class ForbiddenError extends AppError {
    constructor(message = 'No tienes permisos para realizar esta acción') {
        super(message, 403);
    }
}

/**
 * ERROR 404 - NOT FOUND
 * Cuando no se encuentra un recurso
 *
 * Ejemplo: Adolescente con ID 999 no existe
 */
class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}

/**
 * ERROR 409 - CONFLICT
 * Cuando hay conflicto con el estado actual
 *
 * Ejemplo: Intentar crear CJO cuando ya existe para ese CJ
 */
class ConflictError extends AppError {
    constructor(message = 'Conflicto con el estado actual del recurso') {
        super(message, 409);
    }
}

/**
 * ERROR 422 - UNPROCESSABLE ENTITY
 * Cuando los datos son válidos pero no cumplen reglas de negocio
 *
 * Ejemplo: Fecha de vinculación anterior a fecha de control
 */
class ValidationError extends AppError {
    constructor(message = 'Error de validación', errors = []) {
        super(message, 422);
        this.errors = errors; // Array de errores detallados
    }
}

/**
 * ERROR 500 - INTERNAL SERVER ERROR
 * Errores del servidor (base de datos, archivos, etc.)
 *
 * Ejemplo: Error de conexión a MySQL, disco lleno
 */
class InternalServerError extends AppError {
    constructor(message = 'Error interno del servidor') {
        super(message, 500);
    }
}

/**
 * HELPER: Manejo de errores de MySQL
 * Convierte errores de MySQL a errores personalizados
 */
const handleDatabaseError = (error) => {
    // Error de clave duplicada (ej: número_cj ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
        const match = error.message.match(/for key '(.+?)'/);
        const field = match ? match[1] : 'campo';
        return new ConflictError(`Ya existe un registro con ese ${field}`);
    }

    // Error de constraint de foreign key
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return new BadRequestError('Referencia inválida: el registro relacionado no existe');
    }

    // Error al eliminar por foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return new ConflictError('No se puede eliminar: existen registros relacionados');
    }

    // Error de sintaxis SQL (esto es un bug del backend)
    if (error.code === 'ER_PARSE_ERROR') {
        console.error('🐛 Error de sintaxis SQL:', error.message);
        return new InternalServerError('Error en la consulta a la base de datos');
    }

    // Error genérico de base de datos
    console.error('❌ Error de base de datos no manejado:', error);
    return new InternalServerError('Error al acceder a la base de datos');
};

/**
 * HELPER: Validar campos requeridos
 *
 * Uso:
 * validateRequiredFields(req.body, ['nombre', 'numero_cj', 'fecha_ingreso']);
 */
const validateRequiredFields = (data, requiredFields) => {
    const missing = [];

    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            missing.push(field);
        }
    }

    if (missing.length > 0) {
        throw new BadRequestError(`Campos requeridos faltantes: ${missing.join(', ')}`);
    }
};

/**
 * HELPER: Validar fechas secuenciales
 *
 * Uso:
 * validateDateSequence(fecha_control, fecha_vinculacion, 'fecha_vinculacion debe ser posterior a fecha_control');
 */
const validateDateSequence = (date1, date2, message) => {
    if (date1 && date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        if (d1 > d2) {
            throw new ValidationError(message);
        }
    }
};

module.exports = {
    // Clases de error
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    InternalServerError,

    // Helpers
    handleDatabaseError,
    validateRequiredFields,
    validateDateSequence
};