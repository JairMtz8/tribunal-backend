// src/controllers/cjoController.js

const cjoModel = require('../models/cjoModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CJO (CARPETA JUICIO ORAL)
 */

/**
 * CREAR CJO
 * Auto-crea CEMS si sentencia es condenatoria
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['numero_cjo', 'cj_id']);

    const resultado = await cjoModel.create(req.body);
    const cjo = await cjoModel.getById(resultado.cjo_id);

    let mensaje = 'CJO creada exitosamente';

    if (resultado.cems_creado) {
        mensaje += '. CEMS creado automáticamente (sentencia condenatoria o mixta)';
    }

    return createdResponse(
        res,
        {
            cjo,
            cems_creado: resultado.cems_creado,
            cems_id: resultado.cems_id
        },
        mensaje
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { fuero, sentencia } = req.query;

    const cjos = await cjoModel.getAll({ fuero, sentencia });

    return successResponse(
        res,
        cjos,
        'CJOs obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const cjo = await cjoModel.getById(id);

    return successResponse(
        res,
        cjo,
        'CJO obtenida exitosamente'
    );
};

/**
 * OBTENER POR CJ_ID
 */
const getByCjId = async (req, res) => {
    const { cj_id } = req.params;

    const cjo = await cjoModel.getByCjId(cj_id);

    if (!cjo) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe CJO para esta CJ');
    }

    return successResponse(
        res,
        cjo,
        'CJO obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const resultado = await cjoModel.update(id, req.body);

    let mensaje = SUCCESS_MESSAGES.UPDATED;

    if (resultado.cems_creado) {
        mensaje += '. CEMS creado automáticamente (sentencia condenatoria o mixta)';
    }

    return successResponse(
        res,
        {
            cjo: resultado.cjo,
            cems_creado: resultado.cems_creado,
            cems_id: resultado.cems_id
        },
        mensaje
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const cjo = await cjoModel.remove(id);

    return successResponse(
        res,
        cjo,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await cjoModel.getStats();

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
    getByCjId,
    update,
    remove,
    getStats
};