// src/controllers/catalogoController.js

const catalogoModel = require('../models/catalogoModel');
const { successResponse, createdResponse, paginatedResponse, getPaginationParams } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE CATÁLOGOS
 *
 * Maneja la lógica de negocio para todas las tablas de catálogo
 */

// =====================================================
// OBTENER TODOS (con paginación opcional)
// =====================================================
const getAll = async (req, res) => {
    const { tipo } = req.params;
    const { search } = req.query;

    // Si no hay parámetros de paginación, traer todo
    const usePagination = req.query.page || req.query.limit;

    if (usePagination) {
        // Con paginación
        const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

        const [data, total] = await Promise.all([
            catalogoModel.getAll(tipo, { search, limit, offset }),
            catalogoModel.getCount(tipo, search)
        ]);

        return paginatedResponse(
            res,
            data,
            page,
            limit,
            total,
            `${tipo} obtenidos exitosamente`
        );
    } else {
        // Sin paginación (todos los registros)
        const data = await catalogoModel.getAll(tipo, { search });

        return successResponse(
            res,
            data,
            `${tipo} obtenidos exitosamente`
        );
    }
};

// =====================================================
// OBTENER POR ID
// =====================================================
const getById = async (req, res) => {
    const { tipo, id } = req.params;

    const data = await catalogoModel.getById(tipo, id);

    return successResponse(
        res,
        data,
        `Registro obtenido exitosamente`
    );
};

// =====================================================
// CREAR
// =====================================================
const create = async (req, res) => {
    const { tipo } = req.params;
    const data = req.body;

    const newRecord = await catalogoModel.create(tipo, data);

    return createdResponse(
        res,
        newRecord,
        SUCCESS_MESSAGES.CREATED
    );
};

// =====================================================
// ACTUALIZAR
// =====================================================
const update = async (req, res) => {
    const { tipo, id } = req.params;
    const data = req.body;

    const updatedRecord = await catalogoModel.update(tipo, id, data);

    return successResponse(
        res,
        updatedRecord,
        SUCCESS_MESSAGES.UPDATED
    );
};

// =====================================================
// ELIMINAR
// =====================================================
const remove = async (req, res) => {
    const { tipo, id } = req.params;

    const deletedRecord = await catalogoModel.remove(tipo, id);

    return successResponse(
        res,
        deletedRecord,
        SUCCESS_MESSAGES.DELETED
    );
};

// =====================================================
// OBTENER ESTADÍSTICAS DE UN CATÁLOGO
// =====================================================
const getStats = async (req, res) => {
    const { tipo } = req.params;

    const total = await catalogoModel.getCount(tipo);
    const all = await catalogoModel.getAll(tipo);

    const stats = {
        tipo,
        total,
        registros: all
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
    create,
    update,
    remove,
    getStats
};