// src/controllers/adolescenteController.js

const adolescenteModel = require('../models/adolescenteModel');
const { successResponse, createdResponse, paginatedResponse, getPaginationParams } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE ADOLESCENTES
 */

/**
 * OBTENER TODOS (con filtros y paginación)
 */
const getAll = async (req, res) => {
    const { search, sexo, edad_min, edad_max } = req.query;

    const usePagination = req.query.page || req.query.limit;

    const filters = {
        search,
        sexo,
        edad_min: edad_min ? parseInt(edad_min) : null,
        edad_max: edad_max ? parseInt(edad_max) : null
    };

    if (usePagination) {
        const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

        const [adolescentes, total] = await Promise.all([
            adolescenteModel.getAll({ ...filters, limit, offset }),
            adolescenteModel.getCount(filters)
        ]);

        return paginatedResponse(
            res,
            adolescentes,
            page,
            limit,
            total,
            'Adolescentes obtenidos exitosamente'
        );
    } else {
        const adolescentes = await adolescenteModel.getAll(filters);

        return successResponse(
            res,
            adolescentes,
            'Adolescentes obtenidos exitosamente'
        );
    }
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const adolescente = await adolescenteModel.getById(id);

    return successResponse(
        res,
        adolescente,
        'Adolescente obtenido exitosamente'
    );
};

/**
 * CREAR ADOLESCENTE
 */
const create = async (req, res) => {
    const data = req.body;

    // Validar campos requeridos
    validateRequiredFields(data, ['nombre', 'fecha_nacimiento']);

    const adolescenteId = await adolescenteModel.create(data);

    // Obtener el adolescente completo recién creado
    const adolescente = await adolescenteModel.getById(adolescenteId);

    return createdResponse(
        res,
        adolescente,
        'Adolescente creado exitosamente'
    );
};

/**
 * ACTUALIZAR ADOLESCENTE
 */
const update = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    await adolescenteModel.update(id, data);

    // Obtener el adolescente actualizado
    const adolescente = await adolescenteModel.getById(id);

    return successResponse(
        res,
        adolescente,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR ADOLESCENTE
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const adolescente = await adolescenteModel.remove(id);

    return successResponse(
        res,
        adolescente,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * VERIFICAR SI TIENE PROCESO
 */
const checkProceso = async (req, res) => {
    const { id } = req.params;

    // Verificar que existe
    await adolescenteModel.getById(id);

    const tieneProceso = await adolescenteModel.tieneProceso(id);

    return successResponse(
        res,
        { tiene_proceso: tieneProceso },
        'Verificación completada'
    );
};

/**
 * ESTADÍSTICAS DE ADOLESCENTES
 */
const getStats = async (req, res) => {
    const total = await adolescenteModel.getCount();

    // Contar por sexo
    const porSexo = await Promise.all([
        adolescenteModel.getCount({ sexo: 'Hombre' }),
        adolescenteModel.getCount({ sexo: 'Mujer' })
    ]);

    // Contar por rango de edad
    const porEdad = await Promise.all([
        adolescenteModel.getCount({ edad_min: 12, edad_max: 13 }),
        adolescenteModel.getCount({ edad_min: 14, edad_max: 15 }),
        adolescenteModel.getCount({ edad_min: 16, edad_max: 17 })
    ]);

    const stats = {
        total,
        por_sexo: {
            hombres: porSexo[0],
            mujeres: porSexo[1]
        },
        por_edad: {
            '12-13': porEdad[0],
            '14-15': porEdad[1],
            '16-17': porEdad[2]
        }
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
    checkProceso,
    getStats
};