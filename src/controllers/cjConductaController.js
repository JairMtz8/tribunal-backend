// src/controllers/cjConductaController.js

const cjConductaModel = require('../models/cjConductaModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CJ_CONDUCTA
 *
 * Gestiona las conductas/delitos del adolescente en una CJ
 */

/**
 * OBTENER CONDUCTAS DE UNA CJ
 */
const getByCjId = async (req, res) => {
    const { cj_id } = req.params;

    const conductas = await cjConductaModel.getByCjId(cj_id);

    return successResponse(
        res,
        conductas,
        'Conductas del adolescente obtenidas exitosamente'
    );
};

/**
 * OBTENER CONDUCTA POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const conducta = await cjConductaModel.getById(id);

    return successResponse(
        res,
        conducta,
        'Conducta obtenida exitosamente'
    );
};

/**
 * CREAR CONDUCTA DEL ADOLESCENTE
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['cj_id']);

    // Al menos debe tener conducta_id O texto_conducta
    if (!req.body.conducta_id && !req.body.texto_conducta) {
        const { BadRequestError } = require('../utils/errorHandler');
        throw new BadRequestError('Debe proporcionar conducta_id o texto_conducta');
    }

    const id = await cjConductaModel.create(req.body);
    const conducta = await cjConductaModel.getById(id);

    return createdResponse(
        res,
        conducta,
        'Conducta del adolescente creada exitosamente'
    );
};

/**
 * ACTUALIZAR CONDUCTA
 */
const update = async (req, res) => {
    const { id } = req.params;

    const conducta = await cjConductaModel.update(id, req.body);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR CONDUCTA
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const conducta = await cjConductaModel.remove(id);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE CONDUCTAS
 */
const getStats = async (req, res) => {
    const stats = await cjConductaModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

/**
 * CONDUCTAS MÁS FRECUENTES
 */
const getMasFrecuentes = async (req, res) => {
    const { limit } = req.query;

    const conductas = await cjConductaModel.getMasFrecuentes(
        limit ? parseInt(limit) : 10
    );

    return successResponse(
        res,
        conductas,
        'Conductas más frecuentes obtenidas exitosamente'
    );
};

module.exports = {
    getByCjId,
    getById,
    create,
    update,
    remove,
    getStats,
    getMasFrecuentes
};