// src/controllers/cjController.js

const cjModel = require('../models/cjModel');
const { successResponse, paginatedResponse, getPaginationParams } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CJ
 *
 * Operaciones sobre carpetas judiciales
 */

/**
 * OBTENER TODAS LAS CJ
 */
const getAll = async (req, res) => {
    const { search, tipo_fuero, vinculacion, reincidente } = req.query;

    const usePagination = req.query.page || req.query.limit;

    const filters = {
        search,
        tipo_fuero,
        vinculacion: vinculacion !== undefined ? vinculacion === 'true' : undefined,
        reincidente: reincidente !== undefined ? reincidente === 'true' : undefined
    };

    if (usePagination) {
        const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

        const [cjs, total] = await Promise.all([
            cjModel.getAll({ ...filters, limit, offset }),
            cjModel.getCount(filters)
        ]);

        return paginatedResponse(
            res,
            cjs,
            page,
            limit,
            total,
            'Carpetas judiciales obtenidas exitosamente'
        );
    } else {
        const cjs = await cjModel.getAll(filters);

        return successResponse(
            res,
            cjs,
            'Carpetas judiciales obtenidas exitosamente'
        );
    }
};

/**
 * OBTENER CJ POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const cj = await cjModel.getById(id);

    return successResponse(
        res,
        cj,
        'Carpeta judicial obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR CJ
 */
const update = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const cjActualizado = await cjModel.update(id, data);

    return successResponse(
        res,
        cjActualizado,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR CJ
 * Solo Admin puede eliminar
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const cj = await cjModel.remove(id);

    return successResponse(
        res,
        cj,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * OBTENER ESTADÍSTICAS DE CJ
 */
const getStats = async (req, res) => {
    const total = await cjModel.getCount();

    const [totalComun, totalFederal] = await Promise.all([
        cjModel.getCount({ tipo_fuero: 'Común' }),
        cjModel.getCount({ tipo_fuero: 'Federal' })
    ]);

    const [totalVinculados, totalReincidentes] = await Promise.all([
        cjModel.getCount({ vinculacion: true }),
        cjModel.getCount({ reincidente: true })
    ]);

    const stats = {
        total,
        por_fuero: {
            comun: totalComun,
            federal: totalFederal
        },
        vinculados: totalVinculados,
        reincidentes: totalReincidentes
    };

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

module.exports = {
    getAll,
    getById,
    update,
    remove,
    getStats
};