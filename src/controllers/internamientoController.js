// src/controllers/internamientoController.js

const internamientoModel = require('../models/internamientoModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE INTERNAMIENTO
 */

/**
 * CREAR INTERNAMIENTO
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['proceso_id']);

    const id = await internamientoModel.create(req.body);
    const internamiento = await internamientoModel.getById(id);

    return createdResponse(
        res,
        internamiento,
        'Internamiento creado exitosamente'
    );
};

/**
 * OBTENER TODOS
 */
const getAll = async (req, res) => {
    const internamientos = await internamientoModel.getAll();

    return successResponse(
        res,
        internamientos,
        'Internamientos obtenidos exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const internamiento = await internamientoModel.getById(id);

    return successResponse(
        res,
        internamiento,
        'Internamiento obtenido exitosamente'
    );
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (req, res) => {
    const { proceso_id } = req.params;

    const internamiento = await internamientoModel.getByProcesoId(proceso_id);

    if (!internamiento) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe internamiento para este proceso');
    }

    return successResponse(
        res,
        internamiento,
        'Internamiento obtenido exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const internamiento = await internamientoModel.update(id, req.body);

    return successResponse(
        res,
        internamiento,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const internamiento = await internamientoModel.remove(id);

    return successResponse(
        res,
        internamiento,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * INTERNAMIENTOS CUMPLIDOS
 */
const getCumplidos = async (req, res) => {
    const internamientos = await internamientoModel.getCumplidos();

    return successResponse(
        res,
        internamientos,
        'Internamientos cumplidos obtenidos exitosamente'
    );
};

/**
 * INTERNAMIENTOS ACTIVOS
 */
const getActivos = async (req, res) => {
    const internamientos = await internamientoModel.getActivos();

    return successResponse(
        res,
        internamientos,
        'Internamientos activos obtenidos exitosamente'
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await internamientoModel.getStats();

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
    getByProcesoId,
    update,
    remove,
    getCumplidos,
    getActivos,
    getStats
};