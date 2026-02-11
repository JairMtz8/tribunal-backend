// src/controllers/calificativaDelitoController.js

const calificativaDelitoModel = require('../models/calificativaDelitoModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CALIFICATIVA_DELITO
 *
 * Gestiona el catálogo de calificativas de delitos
 */

/**
 * CREAR CALIFICATIVA
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['nombre']);

    const id = await calificativaDelitoModel.create(req.body);
    const calificativa = await calificativaDelitoModel.getById(id);

    return createdResponse(
        res,
        calificativa,
        'Calificativa creada exitosamente'
    );
};

/**
 * OBTENER TODAS LAS CALIFICATIVAS
 */
const getAll = async (req, res) => {
    const { activo, search } = req.query;

    const calificativas = await calificativaDelitoModel.getAll({ activo, search });

    return successResponse(
        res,
        calificativas,
        'Calificativas obtenidas exitosamente'
    );
};

/**
 * OBTENER SOLO ACTIVAS
 */
const getActivas = async (req, res) => {
    const calificativas = await calificativaDelitoModel.getActivas();

    return successResponse(
        res,
        calificativas,
        'Calificativas activas obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const calificativa = await calificativaDelitoModel.getById(id);

    return successResponse(
        res,
        calificativa,
        'Calificativa obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR CALIFICATIVA
 */
const update = async (req, res) => {
    const { id } = req.params;

    const calificativa = await calificativaDelitoModel.update(id, req.body);

    return successResponse(
        res,
        calificativa,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ACTIVAR/DESACTIVAR CALIFICATIVA
 */
const toggleActivo = async (req, res) => {
    const { id } = req.params;

    const calificativa = await calificativaDelitoModel.toggleActivo(id);

    return successResponse(
        res,
        calificativa,
        `Calificativa ${calificativa.activo ? 'activada' : 'desactivada'} exitosamente`
    );
};

/**
 * ELIMINAR CALIFICATIVA
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const calificativa = await calificativaDelitoModel.remove(id);

    return successResponse(
        res,
        calificativa,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE USO
 */
const getStatsUso = async (req, res) => {
    const stats = await calificativaDelitoModel.getStatsUso();

    return successResponse(
        res,
        stats,
        'Estadísticas de uso obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getAll,
    getActivas,
    getById,
    update,
    toggleActivo,
    remove,
    getStatsUso
};