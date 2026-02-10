// src/controllers/medidaSancionadoraController.js

const medidaSancionadoraModel = require('../models/medidaSancionadoraModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE MEDIDAS SANCIONADORAS
 */

/**
 * CREAR MEDIDA SANCIONADORA
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, [
        'proceso_id',
        'tipo_medida_sancionadora_id'
    ]);

    const id = await medidaSancionadoraModel.create(req.body);
    const medida = await medidaSancionadoraModel.getById(id);

    return createdResponse(
        res,
        medida,
        'Medida sancionadora creada exitosamente'
    );
};

/**
 * OBTENER MEDIDAS DE UN PROCESO
 */
const getByProcesoId = async (req, res) => {
    const { proceso_id } = req.params;

    const medidas = await medidaSancionadoraModel.getByProcesoId(proceso_id);

    return successResponse(
        res,
        medidas,
        'Medidas sancionadoras obtenidas exitosamente'
    );
};

/**
 * OBTENER MEDIDA POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const medida = await medidaSancionadoraModel.getById(id);

    return successResponse(
        res,
        medida,
        'Medida sancionadora obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR MEDIDA
 */
const update = async (req, res) => {
    const { id } = req.params;

    const medida = await medidaSancionadoraModel.update(id, req.body);

    return successResponse(
        res,
        medida,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR MEDIDA
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const medida = await medidaSancionadoraModel.remove(id);

    return successResponse(
        res,
        medida,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * OBTENER MEDIDAS PRIVATIVAS
 */
const getPrivativas = async (req, res) => {
    const medidas = await medidaSancionadoraModel.getPrivativas();

    return successResponse(
        res,
        medidas,
        'Medidas privativas obtenidas exitosamente'
    );
};

/**
 * OBTENER MEDIDAS NO PRIVATIVAS
 */
const getNoPrivativas = async (req, res) => {
    const medidas = await medidaSancionadoraModel.getNoPrivativas();

    return successResponse(
        res,
        medidas,
        'Medidas no privativas obtenidas exitosamente'
    );
};

/**
 * VERIFICAR SI PROCESO TIENE MEDIDAS PRIVATIVAS
 */
const verificarPrivativas = async (req, res) => {
    const { proceso_id } = req.params;

    const tiene = await medidaSancionadoraModel.tieneMedidasPrivativas(proceso_id);

    return successResponse(
        res,
        { tiene_medidas_privativas: tiene },
        'Verificación completada'
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await medidaSancionadoraModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

/**
 * ESTADÍSTICAS GENERALES
 */
const getStatsGenerales = async (req, res) => {
    const stats = await medidaSancionadoraModel.getStatsGenerales();

    return successResponse(
        res,
        stats,
        'Estadísticas generales obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getByProcesoId,
    getById,
    update,
    remove,
    getPrivativas,
    getNoPrivativas,
    verificarPrivativas,
    getStats,
    getStatsGenerales
};