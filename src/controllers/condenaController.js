// src/controllers/condenaController.js

const condenaModel = require('../models/condenaModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CONDENA
 */

/**
 * CREAR CONDENA
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['proceso_id']);

    const id = await condenaModel.create(req.body);
    const condena = await condenaModel.getById(id);

    return createdResponse(
        res,
        condena,
        'Condena creada exitosamente'
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { cumplida } = req.query;

    const condenas = await condenaModel.getAll({ cumplida });

    return successResponse(
        res,
        condenas,
        'Condenas obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const condena = await condenaModel.getById(id);

    return successResponse(
        res,
        condena,
        'Condena obtenida exitosamente'
    );
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (req, res) => {
    const { proceso_id } = req.params;

    const condena = await condenaModel.getByProcesoId(proceso_id);

    if (!condena) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe condena para este proceso');
    }

    return successResponse(
        res,
        condena,
        'Condena obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const condena = await condenaModel.update(id, req.body);

    return successResponse(
        res,
        condena,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * MARCAR COMO CUMPLIDA
 */
const marcarCumplida = async (req, res) => {
    const { id } = req.params;

    const condena = await condenaModel.marcarCumplida(id);

    return successResponse(
        res,
        condena,
        'Condena marcada como cumplida'
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const condena = await condenaModel.remove(id);

    return successResponse(
        res,
        condena,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await condenaModel.getStats();

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
    getStats
};