// src/controllers/cjConductaController.js

const cjConductaModel = require('../models/cjConductaModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields, BadRequestError } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CJ_CONDUCTA
 *
 * Gestiona las conductas/delitos del adolescente en una CJ
 * Ahora incluye soporte para calificativas
 */

/**
 * OBTENER CONDUCTAS DE UNA CJ
 */
const getByCjId = async (req, res) => {
    const { cj_id } = req.params;

    const conductas = await cjConductaModel.getByCjId(cj_id);

    return successResponse(
        res,
        conductas,
        'Conductas del adolescente obtenidas exitosamente'
    );
};

/**
 * OBTENER CONDUCTA POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const conducta = await cjConductaModel.getById(id);

    return successResponse(
        res,
        conducta,
        'Conducta obtenida exitosamente'
    );
};

/**
 * CREAR CONDUCTA DEL ADOLESCENTE
 */
const create = async (req, res) => {
    const { cj_id, conducta_id, calificativa_id, especificacion_adicional, fecha_conducta } = req.body;

    // Validaciones
    validateRequiredFields(req.body, ['cj_id', 'conducta_id', 'calificativa_id']);

    // Crear la conducta
    const nuevaConducta = await cjConductaModel.create({
        cj_id,
        conducta_id,
        calificativa_id,
        especificacion_adicional: especificacion_adicional || null,
        fecha_conducta: fecha_conducta || null
    });

    const conductaCompleta = await cjConductaModel.getById(nuevaConducta.id_conducta);

    return createdResponse(res, conductaCompleta, 'Conducta del adolescente creada exitosamente');
};

/**
 * ACTUALIZAR CONDUCTA
 */
const update = async (req, res) => {
    const { id } = req.params;

    const conducta = await cjConductaModel.update(id, req.body);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR CONDUCTA
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const conducta = await cjConductaModel.remove(id);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE CONDUCTAS
 */
const getStats = async (req, res) => {
    const stats = await cjConductaModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas por calificativa obtenidas exitosamente'
    );
};

/**
 * CONDUCTAS MÁS FRECUENTES
 */
const getMasFrecuentes = async (req, res) => {
    const { limit } = req.query;

    const conductas = await cjConductaModel.getMasFrecuentes(
        limit ? parseInt(limit) : 10
    );

    return successResponse(
        res,
        conductas,
        'Conductas más frecuentes obtenidas exitosamente'
    );
};

/**
 * ESTADÍSTICAS POR DELITO Y CALIFICATIVA
 */
const getStatsByDelitoCalificativa = async (req, res) => {
    const stats = await cjConductaModel.getStatsByDelitoCalificativa();

    return successResponse(
        res,
        stats,
        'Estadísticas por delito y calificativa obtenidas exitosamente'
    );
};

module.exports = {
    getByCjId,
    getById,
    create,
    update,
    remove,
    getStats,
    getMasFrecuentes,
    getStatsByDelitoCalificativa
};