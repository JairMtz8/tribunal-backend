// src/controllers/victimaController.js

const victimaModel = require('../models/victimaModel');
const procesoVictimaModel = require('../models/procesoVictimaModel');
const { successResponse, createdResponse, paginatedResponse, getPaginationParams } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE VÍCTIMAS
 */

/**
 * OBTENER TODAS LAS VÍCTIMAS
 */
const getAll = async (req, res) => {
    const { sexo, es_menor, search } = req.query;

    const usePagination = req.query.page || req.query.limit;

    const filters = {
        sexo,
        es_menor: es_menor !== undefined ? es_menor === 'true' : undefined,
        search
    };

    if (usePagination) {
        const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

        const [victimas, total] = await Promise.all([
            victimaModel.getAll({ ...filters, limit, offset }),
            victimaModel.getCount(filters)
        ]);

        return paginatedResponse(
            res,
            victimas,
            page,
            limit,
            total,
            'Víctimas obtenidas exitosamente'
        );
    } else {
        const victimas = await victimaModel.getAll(filters);

        return successResponse(
            res,
            victimas,
            'Víctimas obtenidas exitosamente'
        );
    }
};

/**
 * OBTENER VÍCTIMA POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const victima = await victimaModel.getById(id);

    // Obtener procesos en los que está involucrada
    const procesos = await procesoVictimaModel.getProcesosByVictima(id);

    return successResponse(
        res,
        {
            ...victima,
            procesos
        },
        'Víctima obtenida exitosamente'
    );
};

/**
 * CREAR VÍCTIMA
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['nombre']);

    const id = await victimaModel.create(req.body);
    const victima = await victimaModel.getById(id);

    return createdResponse(
        res,
        victima,
        'Víctima creada exitosamente'
    );
};

/**
 * ACTUALIZAR VÍCTIMA
 */
const update = async (req, res) => {
    const { id } = req.params;

    const victima = await victimaModel.update(id, req.body);

    return successResponse(
        res,
        victima,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR VÍCTIMA
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const victima = await victimaModel.remove(id);

    return successResponse(
        res,
        victima,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE VÍCTIMAS
 */
const getStats = async (req, res) => {
    const stats = await victimaModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

/**
 * ASOCIAR VÍCTIMA A PROCESO
 */
const asociarAProceso = async (req, res) => {
    const { id } = req.params; // proceso_id
    const { victima_id } = req.body;

    validateRequiredFields(req.body, ['victima_id']);

    const resultado = await procesoVictimaModel.asociar(id, victima_id);

    // Obtener víctima completa
    const victima = await victimaModel.getById(victima_id);

    return createdResponse(
        res,
        victima,
        'Víctima asociada al proceso exitosamente'
    );
};

/**
 * DESASOCIAR VÍCTIMA DE PROCESO
 */
const desasociarDeProceso = async (req, res) => {
    const { id, victima_id } = req.params;

    await procesoVictimaModel.desasociar(id, victima_id);

    return successResponse(
        res,
        { proceso_id: id, victima_id },
        'Víctima desasociada del proceso exitosamente'
    );
};

/**
 * OBTENER VÍCTIMAS DE UN PROCESO
 */
const getVictimasByProceso = async (req, res) => {
    const { id } = req.params;

    const victimas = await procesoVictimaModel.getVictimasByProceso(id);

    return successResponse(
        res,
        victimas,
        'Víctimas del proceso obtenidas exitosamente'
    );
};

/**
 * ASOCIAR MÚLTIPLES VÍCTIMAS A PROCESO
 */
const asociarMultiples = async (req, res) => {
    const { id } = req.params; // proceso_id
    const { victimas_ids } = req.body;

    validateRequiredFields(req.body, ['victimas_ids']);

    if (!Array.isArray(victimas_ids) || victimas_ids.length === 0) {
        const { BadRequestError } = require('../utils/errorHandler');
        throw new BadRequestError('victimas_ids debe ser un array con al menos un ID');
    }

    const resultados = await procesoVictimaModel.asociarMultiples(id, victimas_ids);

    return successResponse(
        res,
        resultados,
        'Proceso de asociación completado'
    );
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getStats,
    asociarAProceso,
    desasociarDeProceso,
    getVictimasByProceso,
    asociarMultiples
};