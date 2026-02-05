// src/controllers/domicilioController.js

const domicilioModel = require('../models/domicilioModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE DOMICILIOS
 */

/**
 * LISTAR TODOS
 */
const getAll = async (req, res) => {
    const { es_lugar_hechos, search } = req.query;

    const filters = {};

    if (es_lugar_hechos !== undefined) {
        filters.es_lugar_hechos = es_lugar_hechos === 'true';
    }

    if (search) {
        filters.search = search;
    }

    const domicilios = await domicilioModel.getAll(filters);

    return successResponse(
        res,
        domicilios,
        'Domicilios obtenidos exitosamente'
    );
};

/**
 * OBTENER SOLO DOMICILIOS PERSONALES
 */
const getPersonales = async (req, res) => {
    const domicilios = await domicilioModel.getDomiciliosPersonales();

    return successResponse(
        res,
        domicilios,
        'Domicilios personales obtenidos exitosamente'
    );
};

/**
 * OBTENER SOLO LUGARES DE HECHOS
 */
const getLugaresHechos = async (req, res) => {
    const domicilios = await domicilioModel.getLugaresHechos();

    return successResponse(
        res,
        domicilios,
        'Lugares de hechos obtenidos exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const domicilio = await domicilioModel.getById(id);

    return successResponse(
        res,
        domicilio,
        'Domicilio obtenido exitosamente'
    );
};

/**
 * CREAR DOMICILIO
 */
const create = async (req, res) => {
    const data = req.body;

    const domicilio = await domicilioModel.create(data);

    return createdResponse(
        res,
        domicilio,
        'Domicilio creado exitosamente'
    );
};

/**
 * ACTUALIZAR DOMICILIO
 */
const update = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const domicilio = await domicilioModel.update(id, data);

    return successResponse(
        res,
        domicilio,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR DOMICILIO
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const domicilio = await domicilioModel.remove(id);

    return successResponse(
        res,
        domicilio,
        SUCCESS_MESSAGES.DELETED
    );
};

module.exports = {
    getAll,
    getPersonales,
    getLugaresHechos,
    getById,
    create,
    update,
    remove
};