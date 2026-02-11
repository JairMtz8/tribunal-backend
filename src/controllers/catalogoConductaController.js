// src/controllers/catalogoConductaController.js

const catalogoConductaModel = require('../models/catalogoConductaModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CONDUCTA (CATÁLOGO)
 *
 * Gestiona el catálogo de delitos/conductas base
 */

/**
 * CREAR CONDUCTA
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['nombre']);

    const id = await catalogoConductaModel.create(req.body);
    const conducta = await catalogoConductaModel.getById(id);

    return createdResponse(
        res,
        conducta,
        'Conducta creada exitosamente'
    );
};

/**
 * OBTENER TODAS LAS CONDUCTAS
 */
const getAll = async (req, res) => {
    const { activo, fuero_default, search } = req.query;

    const conductas = await catalogoConductaModel.getAll({
        activo,
        fuero_default,
        search
    });

    return successResponse(
        res,
        conductas,
        'Conductas obtenidas exitosamente'
    );
};

/**
 * OBTENER SOLO ACTIVAS
 */
const getActivas = async (req, res) => {
    const conductas = await catalogoConductaModel.getActivas();

    return successResponse(
        res,
        conductas,
        'Conductas activas obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const conducta = await catalogoConductaModel.getById(id);

    return successResponse(
        res,
        conducta,
        'Conducta obtenida exitosamente'
    );
};

/**
 * OBTENER POR FUERO
 */
const getByFuero = async (req, res) => {
    const { fuero } = req.params;

    const conductas = await catalogoConductaModel.getByFuero(fuero);

    return successResponse(
        res,
        conductas,
        `Conductas de fuero ${fuero} obtenidas exitosamente`
    );
};

/**
 * ACTUALIZAR CONDUCTA
 */
const update = async (req, res) => {
    const { id } = req.params;

    const conducta = await catalogoConductaModel.update(id, req.body);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ACTIVAR/DESACTIVAR CONDUCTA
 */
const toggleActivo = async (req, res) => {
    const { id } = req.params;

    const conducta = await catalogoConductaModel.toggleActivo(id);

    return successResponse(
        res,
        conducta,
        `Conducta ${conducta.activo ? 'activada' : 'desactivada'} exitosamente`
    );
};

/**
 * ELIMINAR CONDUCTA
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const conducta = await catalogoConductaModel.remove(id);

    return successResponse(
        res,
        conducta,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE USO
 */
const getStatsUso = async (req, res) => {
    const stats = await catalogoConductaModel.getStatsUso();

    return successResponse(
        res,
        stats,
        'Estadísticas de uso obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getAll,
    getActivas,
    getById,
    getByFuero,
    update,
    toggleActivo,
    remove,
    getStatsUso
};