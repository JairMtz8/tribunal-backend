// src/controllers/libertadController.js

const libertadModel = require('../models/libertadModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE LIBERTAD
 */

/**
 * CREAR LIBERTAD
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['proceso_id']);

    const id = await libertadModel.create(req.body);
    const libertad = await libertadModel.getById(id);

    return createdResponse(
        res,
        libertad,
        'Libertad creada exitosamente'
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { cumplida } = req.query;

    const libertades = await libertadModel.getAll({ cumplida });

    return successResponse(
        res,
        libertades,
        'Libertades obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const libertad = await libertadModel.getById(id);

    return successResponse(
        res,
        libertad,
        'Libertad obtenida exitosamente'
    );
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (req, res) => {
    const { proceso_id } = req.params;

    const libertad = await libertadModel.getByProcesoId(proceso_id);

    if (!libertad) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe libertad para este proceso');
    }

    return successResponse(
        res,
        libertad,
        'Libertad obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const libertad = await libertadModel.update(id, req.body);

    return successResponse(
        res,
        libertad,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * MARCAR COMO CUMPLIDA
 */
const marcarCumplida = async (req, res) => {
    const { id } = req.params;
    const { fecha_cumplimiento } = req.body;

    const libertad = await libertadModel.marcarCumplida(id, fecha_cumplimiento);

    return successResponse(
        res,
        libertad,
        'Libertad marcada como cumplida'
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const libertad = await libertadModel.remove(id);

    return successResponse(
        res,
        libertad,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * LIBERTADES ACTIVAS
 */
const getActivas = async (req, res) => {
    const libertades = await libertadModel.getActivas();

    return successResponse(
        res,
        libertades,
        'Libertades activas obtenidas exitosamente'
    );
};

/**
 * LIBERTADES PRÓXIMAS A VENCER
 */
const getProximasVencer = async (req, res) => {
    const { dias } = req.query;

    const libertades = await libertadModel.getProximasVencer(dias ? parseInt(dias) : 30);

    return successResponse(
        res,
        libertades,
        'Libertades próximas a vencer obtenidas exitosamente'
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await libertadModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getAll,
    getById,
    getByProcesoId,
    update,
    marcarCumplida,
    remove,
    getActivas,
    getProximasVencer,
    getStats
};