// src/controllers/audienciaController.js

const audienciaModel = require('../models/audienciaModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE AUDIENCIAS
 */

/**
 * CREAR AUDIENCIA
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['proceso_id', 'fecha_audiencia']);

    const id = await audienciaModel.create(req.body);
    const audiencia = await audienciaModel.getById(id);

    return createdResponse(
        res,
        audiencia,
        'Audiencia creada exitosamente'
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { tipo, fecha_desde, fecha_hasta } = req.query;

    const audiencias = await audienciaModel.getAll({
        tipo,
        fecha_desde,
        fecha_hasta
    });

    return successResponse(
        res,
        audiencias,
        'Audiencias obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const audiencia = await audienciaModel.getById(id);

    return successResponse(
        res,
        audiencia,
        'Audiencia obtenida exitosamente'
    );
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (req, res) => {
    const { proceso_id } = req.params;

    const audiencias = await audienciaModel.getByProcesoId(proceso_id);

    return successResponse(
        res,
        audiencias,
        'Audiencias del proceso obtenidas exitosamente'
    );
};

/**
 * OBTENER POR CARPETA
 */
const getByCarpeta = async (req, res) => {
    const { tipo_carpeta, carpeta_id } = req.params;

    const audiencias = await audienciaModel.getByCarpeta(
        tipo_carpeta.toUpperCase(),
        carpeta_id
    );

    return successResponse(
        res,
        audiencias,
        `Audiencias de ${tipo_carpeta} obtenidas exitosamente`
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const audiencia = await audienciaModel.update(id, req.body);

    return successResponse(
        res,
        audiencia,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const audiencia = await audienciaModel.remove(id);

    return successResponse(
        res,
        audiencia,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * AUDIENCIAS PRÓXIMAS
 */
const getProximas = async (req, res) => {
    const { dias } = req.query;

    const audiencias = await audienciaModel.getProximas(dias ? parseInt(dias) : 30);

    return successResponse(
        res,
        audiencias,
        'Audiencias próximas obtenidas exitosamente'
    );
};

/**
 * AUDIENCIAS DEL DÍA
 */
const getDelDia = async (req, res) => {
    const { fecha } = req.query;

    const audiencias = await audienciaModel.getDelDia(fecha);

    return successResponse(
        res,
        audiencias,
        'Audiencias del día obtenidas exitosamente'
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await audienciaModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

/**
 * ESTADÍSTICAS POR TIPO
 */
const getStatsByTipo = async (req, res) => {
    const stats = await audienciaModel.getStatsByTipo();

    return successResponse(
        res,
        stats,
        'Estadísticas por tipo obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getAll,
    getById,
    getByProcesoId,
    getByCarpeta,
    update,
    remove,
    getProximas,
    getDelDia,
    getStats,
    getStatsByTipo
};