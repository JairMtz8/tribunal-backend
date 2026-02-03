// src/middlewares/errorMiddleware.js

const { errorResponse, getSafeErrorMessage } = require('../utils/response');
const { AppError, handleDatabaseError } = require('../utils/errorHandler');

/**
 * MIDDLEWARE GLOBAL DE MANEJO DE ERRORES
 *
 * Este middleware DEBE estar al final de todas las rutas en app.js
 * Captura TODOS los errores que ocurran en los controllers
 *
 * Flujo:
 * Controller lanza error → Express lo captura → Este middleware lo procesa → Responde al cliente
 */
const errorMiddleware = (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Log del error para debugging
    console.error('🚨 Error capturado:', {
        message: err.message,
        stack: isDevelopment ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Si es un error de base de datos, convertirlo a AppError
    if (err.code && err.code.startsWith('ER_')) {
        err = handleDatabaseError(err);
    }

    // Si es un error operacional (AppError), responder con sus datos
    if (err instanceof AppError) {
        return errorResponse(
            res,
            err.message,
            err.statusCode,
            err.status,
            err.errors || null
        );
    }

    // Error de validación de express-validator
    if (err.type === 'entity.parse.failed') {
        return errorResponse(
            res,
            'JSON inválido en el body de la petición',
            400,
            'INVALID_JSON'
        );
    }

    // Error genérico no manejado (500)
    const message = getSafeErrorMessage(err, isDevelopment);

    return errorResponse(
        res,
        message,
        500,
        'INTERNAL_SERVER_ERROR',
        isDevelopment ? { stack: err.stack } : null
    );
};

/**
 * MIDDLEWARE: Ruta no encontrada (404)
 * Este middleware se coloca ANTES del errorMiddleware
 * Captura rutas que no existen
 */
const notFoundMiddleware = (req, res, next) => {
    return errorResponse(
        res,
        `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        404,
        'ROUTE_NOT_FOUND'
    );
};

/**
 * WRAPPER: Async Error Handler
 * Envuelve funciones async para capturar errores automáticamente
 *
 * Uso en controllers:
 * router.get('/adolescentes', asyncHandler(async (req, res) => {
 *   const adolescentes = await getAdolescentes();
 *   successResponse(res, adolescentes);
 * }));
 *
 * Sin esto, tendrías que hacer try-catch en cada controller
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorMiddleware,
    notFoundMiddleware,
    asyncHandler
};