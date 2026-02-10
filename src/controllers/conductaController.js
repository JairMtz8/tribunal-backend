// src/controllers/conductaController.js

const conductaModel = require('../models/conductaModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CONDUCTAS (Catálogo de Delitos)
 */

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { tipo_conducta, fuero_default, activo, search } = req.query;

    const conductas = await conductaModel.getAll({
        tipo_conducta,
        fuero_default,
        activo: activo !== undefined ? activo === 'true' : undefined,
        search
    });

    return successResponse(
        res,
        conductas,
        'Conductas obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;
    const conducta = await conductaModel.getById(id);

    return successResponse(
        res,
        conducta,
        'Conducta obtenida exitosamente'
    );
};

/**
 * CREAR
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['nombre']);

    const id = await conductaModel.create(req.body);
    const conducta = await conductaModel.getById(id);

    return createdResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.CREATED
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;
    const conducta = await conductaModel.update(id, req.body);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;
    const conducta = await conductaModel.remove(id);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await conductaModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getStats
};