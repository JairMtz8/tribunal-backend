// src/controllers/cemciController.js

const cemciModel = require('../models/cemciModel');
const cemciSeguimientoModel = require('../models/cemciSeguimientoModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CEMCI
 */

/**
 * CREAR CEMCI (manual - normalmente se auto-crea)
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['numero_cemci', 'cj_id']);

    const id = await cemciModel.create(req.body);
    const cemci = await cemciModel.getById(id);

    return createdResponse(
        res,
        cemci,
        'CEMCI creada exitosamente'
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const { estado_procesal_id, concluido } = req.query;

    const cemcis = await cemciModel.getAll({
        estado_procesal_id,
        concluido
    });

    return successResponse(
        res,
        cemcis,
        'CEMCIs obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const cemci = await cemciModel.getById(id);

    // Obtener seguimientos asociados
    const seguimientos = await cemciSeguimientoModel.getByCemciId(id);

    return successResponse(
        res,
        {
            ...cemci,
            seguimientos
        },
        'CEMCI obtenida exitosamente'
    );
};

/**
 * OBTENER POR CJ_ID
 */
const getByCjId = async (req, res) => {
    const { cj_id } = req.params;

    const cemci = await cemciModel.getByCjId(cj_id);

    if (!cemci) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe CEMCI para esta CJ');
    }

    // Obtener seguimientos
    const seguimientos = await cemciSeguimientoModel.getByCemciId(cemci.id_cemci);

    return successResponse(
        res,
        {
            ...cemci,
            seguimientos
        },
        'CEMCI obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    const cemci = await cemciModel.update(id, req.body);

    return successResponse(
        res,
        cemci,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const cemci = await cemciModel.remove(id);

    return successResponse(
        res,
        cemci,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await cemciModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

// =====================================================
// SEGUIMIENTO
// =====================================================

/**
 * CREAR SEGUIMIENTO
 */
const createSeguimiento = async (req, res) => {
    validateRequiredFields(req.body, ['cemci_id', 'proceso_id']);

    const id = await cemciSeguimientoModel.create(req.body);
    const seguimiento = await cemciSeguimientoModel.getById(id);

    return createdResponse(
        res,
        seguimiento,
        'Seguimiento de CEMCI creado exitosamente'
    );
};

/**
 * OBTENER SEGUIMIENTOS DE CEMCI
 */
const getSeguimientosByCemci = async (req, res) => {
    const { cemci_id } = req.params;

    const seguimientos = await cemciSeguimientoModel.getByCemciId(cemci_id);

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

    const seguimiento = await cemciSeguimientoModel.getByProcesoId(proceso_id);

    if (!seguimiento) {
        const { NotFoundError } = require('../utils/errorHandler');
        throw new NotFoundError('No existe seguimiento de CEMCI para este proceso');
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

    const seguimiento = await cemciSeguimientoModel.update(id, req.body);

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

    const seguimiento = await cemciSeguimientoModel.remove(id);

    return successResponse(
        res,
        seguimiento,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * SEGUIMIENTOS SUSPENDIDOS
 */
const getSuspendidos = async (req, res) => {
    const suspendidos = await cemciSeguimientoModel.getSuspendidos();

    return successResponse(
        res,
        suspendidos,
        'Seguimientos suspendidos obtenidos exitosamente'
    );
};

/**
 * ESTADÍSTICAS DE SEGUIMIENTOS
 */
const getStatsSeguimiento = async (req, res) => {
    const stats = await cemciSeguimientoModel.getStats();

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
    getByCjId,
    update,
    remove,
    getStats,
    createSeguimiento,
    getSeguimientosByCemci,
    getSeguimientoByProceso,
    updateSeguimiento,
    removeSeguimiento,
    getSuspendidos,
    getStatsSeguimiento
};