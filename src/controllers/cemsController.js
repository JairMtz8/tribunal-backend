// src/controllers/cemsController.js

const cemsModel = require('../models/cemsModel');
const cemsExhortacionModel = require('../models/cemsExhortacionModel');
const cemsSeguimientoModel = require('../models/cemsSeguimientoModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CEMS
 */

// =====================================================
// CEMS PRINCIPAL
// =====================================================

/**
 * CREAR CEMS (manual - normalmente se auto-crea)
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['numero_cems', 'cj_id', 'cjo_id']);

    const id = await cemsModel.create(req.body);
    const cems = await cemsModel.getById(id);

    return createdResponse(
        res,
        cems,
        'CEMS creada exitosamente'
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { estado_procesal_id, status } = req.query;

    const cemss = await cemsModel.getAll({
        estado_procesal_id,
        status
    });

    return successResponse(
        res,
        cemss,
        'CEMS obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const cems = await cemsModel.getById(id);

    // Obtener exhortaciones y seguimientos asociados
    const [exhortaciones, seguimientos] = await Promise.all([
        cemsExhortacionModel.getByCemsId(id),
        cemsSeguimientoModel.getByCemsId(id)
    ]);

    return successResponse(
        res,
        {
            ...cems,
            exhortaciones,
            seguimientos
        },
        'CEMS obtenida exitosamente'
    );
};

/**
 * OBTENER POR CJO_ID
 */
const getByCjoId = async (req, res) => {
    const { cjo_id } = req.params;

    const cems = await cemsModel.getByCjoId(cjo_id);

    if (!cems) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe CEMS para esta CJO');
    }

    // Obtener exhortaciones y seguimientos
    const [exhortaciones, seguimientos] = await Promise.all([
        cemsExhortacionModel.getByCemsId(cems.id_cems),
        cemsSeguimientoModel.getByCemsId(cems.id_cems)
    ]);

    return successResponse(
        res,
        {
            ...cems,
            exhortaciones,
            seguimientos
        },
        'CEMS obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const cems = await cemsModel.update(id, req.body);

    return successResponse(
        res,
        cems,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const cems = await cemsModel.remove(id);

    return successResponse(
        res,
        cems,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await cemsModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

// =====================================================
// EXHORTACIÓN
// =====================================================

/**
 * CREAR EXHORTACIÓN
 */
const createExhortacion = async (req, res) => {
    validateRequiredFields(req.body, ['cems_id', 'proceso_id']);

    const id = await cemsExhortacionModel.create(req.body);
    const exhortacion = await cemsExhortacionModel.getById(id);

    return createdResponse(
        res,
        exhortacion,
        'Exhortación de CEMS creada exitosamente'
    );
};

/**
 * OBTENER EXHORTACIONES DE CEMS
 */
const getExhortacionesByCems = async (req, res) => {
    const { cems_id } = req.params;

    const exhortaciones = await cemsExhortacionModel.getByCemsId(cems_id);

    return successResponse(
        res,
        exhortaciones,
        'Exhortaciones obtenidas exitosamente'
    );
};

/**
 * OBTENER EXHORTACIÓN POR PROCESO
 */
const getExhortacionByProceso = async (req, res) => {
    const { proceso_id } = req.params;

    const exhortacion = await cemsExhortacionModel.getByProcesoId(proceso_id);

    if (!exhortacion) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe exhortación de CEMS para este proceso');
    }

    return successResponse(
        res,
        exhortacion,
        'Exhortación obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR EXHORTACIÓN
 */
const updateExhortacion = async (req, res) => {
    const { id } = req.params;

    const exhortacion = await cemsExhortacionModel.update(id, req.body);

    return successResponse(
        res,
        exhortacion,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR EXHORTACIÓN
 */
const removeExhortacion = async (req, res) => {
    const { id } = req.params;

    const exhortacion = await cemsExhortacionModel.remove(id);

    return successResponse(
        res,
        exhortacion,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE EXHORTACIONES
 */
const getStatsExhortacion = async (req, res) => {
    const stats = await cemsExhortacionModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas de exhortaciones obtenidas exitosamente'
    );
};

// =====================================================
// SEGUIMIENTO
// =====================================================

/**
 * CREAR SEGUIMIENTO
 */
const createSeguimiento = async (req, res) => {
    validateRequiredFields(req.body, ['cems_id', 'proceso_id']);

    const id = await cemsSeguimientoModel.create(req.body);
    const seguimiento = await cemsSeguimientoModel.getById(id);

    return createdResponse(
        res,
        seguimiento,
        'Seguimiento de CEMS creado exitosamente'
    );
};

/**
 * OBTENER SEGUIMIENTOS DE CEMS
 */
const getSeguimientosByCems = async (req, res) => {
    const { cems_id } = req.params;

    const seguimientos = await cemsSeguimientoModel.getByCemsId(cems_id);

    return successResponse(
        res,
        seguimientos,
        'Seguimientos obtenidos exitosamente'
    );
};

/**
 * OBTENER SEGUIMIENTO POR PROCESO
 */
const getSeguimientoByProceso = async (req, res) => {
    const { proceso_id } = req.params;

    const seguimiento = await cemsSeguimientoModel.getByProcesoId(proceso_id);

    if (!seguimiento) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe seguimiento de CEMS para este proceso');
    }

    return successResponse(
        res,
        seguimiento,
        'Seguimiento obtenido exitosamente'
    );
};

/**
 * ACTUALIZAR SEGUIMIENTO
 */
const updateSeguimiento = async (req, res) => {
    const { id } = req.params;

    const seguimiento = await cemsSeguimientoModel.update(id, req.body);

    return successResponse(
        res,
        seguimiento,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR SEGUIMIENTO
 */
const removeSeguimiento = async (req, res) => {
    const { id } = req.params;

    const seguimiento = await cemsSeguimientoModel.remove(id);

    return successResponse(
        res,
        seguimiento,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * SEGUIMIENTOS CON CUMPLIMIENTO ANTICIPADO
 */
const getCumplimientoAnticipado = async (req, res) => {
    const seguimientos = await cemsSeguimientoModel.getCumplimientoAnticipado();

    return successResponse(
        res,
        seguimientos,
        'Seguimientos con cumplimiento anticipado obtenidos exitosamente'
    );
};

/**
 * SEGUIMIENTOS SUSTRAÍDOS
 */
const getSustraidos = async (req, res) => {
    const seguimientos = await cemsSeguimientoModel.getSustraidos();

    return successResponse(
        res,
        seguimientos,
        'Seguimientos de sustraídos obtenidos exitosamente'
    );
};

/**
 * SEGUIMIENTOS CON ORDEN LIBRADA
 */
const getConOrdenLibrada = async (req, res) => {
    const seguimientos = await cemsSeguimientoModel.getConOrdenLibrada();

    return successResponse(
        res,
        seguimientos,
        'Seguimientos con orden librada obtenidos exitosamente'
    );
};

/**
 * ESTADÍSTICAS DE SEGUIMIENTOS
 */
const getStatsSeguimiento = async (req, res) => {
    const stats = await cemsSeguimientoModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas de seguimiento obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getAll,
    getById,
    getByCjoId,
    update,
    remove,
    getStats,
    createExhortacion,
    getExhortacionesByCems,
    getExhortacionByProceso,
    updateExhortacion,
    removeExhortacion,
    getStatsExhortacion,
    createSeguimiento,
    getSeguimientosByCems,
    getSeguimientoByProceso,
    updateSeguimiento,
    removeSeguimiento,
    getCumplimientoAnticipado,
    getSustraidos,
    getConOrdenLibrada,
    getStatsSeguimiento
};