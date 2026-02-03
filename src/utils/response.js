// src/utils/response.js

/**
 * FORMATO ESTÁNDAR DE RESPUESTAS
 *
 * ¿Por qué estandarizar respuestas?
 * - El frontend siempre sabe qué esperar
 * - Facilita el manejo de errores en el cliente
 * - Consistencia en toda la API
 * - Fácil de documentar
 */

/**
 * RESPUESTA EXITOSA
 *
 * Formato:
 * {
 *   success: true,
 *   data: { ... },
 *   message: "Operación exitosa",
 *   timestamp: "2024-02-02T10:30:00.000Z"
 * }
 */
const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * RESPUESTA DE CREACIÓN (201)
 * Cuando se crea un nuevo recurso
 */
const createdResponse = (res, data, message = 'Recurso creado exitosamente') => {
    return successResponse(res, data, message, 201);
};

/**
 * RESPUESTA SIN CONTENIDO (204)
 * Para DELETE exitoso o actualizaciones que no retornan data
 */
const noContentResponse = (res) => {
    return res.status(204).send();
};

/**
 * RESPUESTA DE ERROR
 *
 * Formato:
 * {
 *   success: false,
 *   error: {
 *     message: "Descripción del error",
 *     code: "ERROR_CODE",
 *     details: []  // Opcional: errores de validación detallados
 *   },
 *   timestamp: "2024-02-02T10:30:00.000Z"
 * }
 */
const errorResponse = (res, message, statusCode = 500, code = null, details = null) => {
    const response = {
        success: false,
        error: {
            message,
            ...(code && { code }),
            ...(details && { details })
        },
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
};

/**
 * RESPUESTA PAGINADA
 * Para listas con paginación
 *
 * Formato:
 * {
 *   success: true,
 *   data: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 20,
 *     total: 150,
 *     totalPages: 8,
 *     hasNext: true,
 *     hasPrev: false
 *   },
 *   timestamp: "..."
 * }
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Consulta exitosa') => {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * HELPER: Calcular OFFSET para paginación
 *
 * Uso en controller:
 * const { limit, offset } = getPaginationParams(req.query.page, req.query.limit);
 * const sql = `SELECT * FROM adolescente LIMIT ? OFFSET ?`;
 */
const getPaginationParams = (page = 1, limit = 20, maxLimit = 100) => {
    // Convertir a números y validar
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(
        Math.max(1, parseInt(limit) || 20),
        maxLimit
    );

    const offset = (pageNum - 1) * limitNum;

    return {
        page: pageNum,
        limit: limitNum,
        offset
    };
};

/**
 * HELPER: Extraer mensaje de error genérico
 * Para no exponer detalles técnicos en producción
 */
const getSafeErrorMessage = (error, isDevelopment = false) => {
    // En desarrollo, mostrar el mensaje completo
    if (isDevelopment) {
        return error.message;
    }

    // En producción, mensajes genéricos para errores no operacionales
    if (error.isOperational) {
        return error.message;
    }

    return 'Ha ocurrido un error. Por favor contacta al administrador.';
};

module.exports = {
    // Respuestas exitosas
    successResponse,
    createdResponse,
    noContentResponse,

    // Respuestas de error
    errorResponse,

    // Paginación
    paginatedResponse,
    getPaginationParams,

    // Helpers
    getSafeErrorMessage
};