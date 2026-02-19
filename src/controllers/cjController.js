// src/controllers/cjController.js

const cjModel = require('../models/cjModel');
const domicilioModel = require('../models/domicilioModel');
const {successResponse, paginatedResponse, getPaginationParams} = require('../utils/response');
const {validateRequiredFields} = require('../utils/errorHandler');
const {SUCCESS_MESSAGES} = require('../config/constants');

/**
 * CONTROLADOR DE CJ
 *
 * Operaciones sobre carpetas judiciales
 */

/**
 * OBTENER TODAS LAS CJ
 */
const getAll = async (req, res) => {
    const {search, tipo_fuero, vinculacion, reincidente} = req.query;

    const usePagination = req.query.page || req.query.limit;

    const filters = {
        search,
        tipo_fuero,
        vinculacion: vinculacion !== undefined ? vinculacion === 'true' : undefined,
        reincidente: reincidente !== undefined ? reincidente === 'true' : undefined
    };

    if (usePagination) {
        const {page, limit, offset} = getPaginationParams(req.query.page, req.query.limit);

        const [cjs, total] = await Promise.all([
            cjModel.getAll({...filters, limit, offset}),
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
    const {id} = req.params;

    const cj = await cjModel.getById(id);

    return successResponse(
        res,
        cj,
        'Carpeta judicial obtenida exitosamente'
    );
};

const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

const update = async (req, res) => {
    const {id} = req.params;
    let cjData = req.body;

    // Formatear fechas
    const camposFecha = [
        'fecha_ingreso', 'fecha_control', 'fecha_formulacion',
        'fecha_vinculacion', 'fecha_suspension', 'fecha_terminacion_suspension',
        'fecha_audiencia_intermedia', 'fecha_sustraccion'
    ];

    camposFecha.forEach(campo => {
        if (cjData[campo]) {
            cjData[campo] = formatDate(cjData[campo]);
        }
    });

    // MANEJO DEL DOMICILIO DE LOS HECHOS
    if (cjData.domicilio_hechos) {
        const domicilioData = {
            ...cjData.domicilio_hechos,
            es_lugar_hechos: true  // ← MARCAR COMO LUGAR DE HECHOS
        };

        // Obtener CJ actual para ver si ya tiene domicilio
        const cjActual = await cjModel.getById(id);

        if (cjActual.domicilio_hechos_id) {
            // Actualizar domicilio existente
            await domicilioModel.update(cjActual.domicilio_hechos_id, domicilioData);
            cjData.domicilio_hechos_id = cjActual.domicilio_hechos_id;
        } else {
            // Crear nuevo domicilio
            const nuevoDomicilio = await domicilioModel.create(domicilioData);
            cjData.domicilio_hechos_id = nuevoDomicilio.id_domicilio;
        }

        // Eliminar el objeto domicilio_hechos del cjData
        delete cjData.domicilio_hechos;
    }

    // Actualizar CJ
    const cj = await cjModel.update(id, cjData);

    return successResponse(res, cj, 'CJ actualizado exitosamente');
};

/**
 * ELIMINAR CJ
 * Solo Admin puede eliminar
 */
const remove = async (req, res) => {
    const {id} = req.params;

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
        cjModel.getCount({tipo_fuero: 'Común'}),
        cjModel.getCount({tipo_fuero: 'Federal'})
    ]);

    const [totalVinculados, totalReincidentes] = await Promise.all([
        cjModel.getCount({vinculacion: true}),
        cjModel.getCount({reincidente: true})
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