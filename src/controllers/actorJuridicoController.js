// src/controllers/actorJuridicoController.js

const actorJuridicoModel = require('../models/actorJuridicoModel');
const procesoActorModel = require('../models/procesoActorModel');
const { successResponse, createdResponse, paginatedResponse, getPaginationParams } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE ACTORES JURÍDICOS
 */

/**
 * OBTENER TODOS LOS ACTORES
 */
const getAll = async (req, res) => {
    const { tipo, search } = req.query;

    const actores = await actorJuridicoModel.getAll({ tipo, search });

    return successResponse(
        res,
        actores,
        'Actores jurídicos obtenidos exitosamente'
    );
};

/**
 * OBTENER ACTOR POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const actor = await actorJuridicoModel.getById(id);

    // Obtener procesos en los que está asignado
    const procesos = await procesoActorModel.getProcesosByActor(id);

    return successResponse(
        res,
        {
            ...actor,
            procesos
        },
        'Actor jurídico obtenido exitosamente'
    );
};

/**
 * CREAR ACTOR JURÍDICO
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['nombre', 'tipo']);

    // Validar que el tipo sea válido
    const tiposValidos = ['defensa', 'fiscal', 'asesor juridico', 'juez', 'representante', 'juez apoyo'];
    if (!tiposValidos.includes(req.body.tipo)) {
        const { BadRequestError } = require('../utils/errorHandler');
        throw new BadRequestError(
            `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
        );
    }

    const id = await actorJuridicoModel.create(req.body);
    const actor = await actorJuridicoModel.getById(id);

    return createdResponse(
        res,
        actor,
        'Actor jurídico creado exitosamente'
    );
};

/**
 * ACTUALIZAR ACTOR
 */
const update = async (req, res) => {
    const { id } = req.params;

    // Validar tipo si se proporciona
    if (req.body.tipo) {
        const tiposValidos = ['defensa', 'fiscal', 'asesor juridico', 'juez', 'representante', 'juez apoyo'];
        if (!tiposValidos.includes(req.body.tipo)) {
            const { BadRequestError } = require('../utils/errorHandler');
            throw new BadRequestError(
                `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
            );
        }
    }

    const actor = await actorJuridicoModel.update(id, req.body);

    return successResponse(
        res,
        actor,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR ACTOR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const actor = await actorJuridicoModel.remove(id);

    return successResponse(
        res,
        actor,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS DE ACTORES
 */
const getStats = async (req, res) => {
    const stats = await actorJuridicoModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

/**
 * OBTENER ACTORES POR TIPO
 */
const getByTipo = async (req, res) => {
    const { tipo } = req.params;

    const actores = await actorJuridicoModel.getByTipo(tipo);

    return successResponse(
        res,
        actores,
        `Actores de tipo ${tipo} obtenidos exitosamente`
    );
};

/**
 * ASIGNAR ACTOR A PROCESO/CARPETA
 */
const asignarAProceso = async (req, res) => {
    const { id } = req.params; // proceso_id
    const { tipo_carpeta, actor_id } = req.body;

    validateRequiredFields(req.body, ['tipo_carpeta', 'actor_id']);

    // Validar tipo_carpeta
    const tiposValidos = ['CJ', 'CJO', 'CEMCI', 'CEMS'];
    if (!tiposValidos.includes(tipo_carpeta)) {
        const { BadRequestError } = require('../utils/errorHandler');
        throw new BadRequestError(
            `Tipo de carpeta inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
        );
    }

    const resultado = await procesoActorModel.asignar(id, tipo_carpeta, actor_id);

    return createdResponse(
        res,
        resultado,
        'Actor asignado al proceso exitosamente'
    );
};

/**
 * DESASIGNAR ACTOR DE PROCESO
 */
const desasignarDeProceso = async (req, res) => {
    const { id, tipo_carpeta, actor_id } = req.params;

    await procesoActorModel.desasignar(id, tipo_carpeta, actor_id);

    return successResponse(
        res,
        { proceso_id: id, tipo_carpeta, actor_id },
        'Actor desasignado del proceso exitosamente'
    );
};

/**
 * OBTENER ACTORES DE UN PROCESO
 */
const getActoresByProceso = async (req, res) => {
    const { id } = req.params;

    const actores = await procesoActorModel.getActoresByProceso(id);

    return successResponse(
        res,
        actores,
        'Actores del proceso obtenidos exitosamente'
    );
};

/**
 * OBTENER ACTORES DE PROCESO POR CARPETA
 */
const getActoresByProcesoCarpeta = async (req, res) => {
    const { id, tipo_carpeta } = req.params;

    const actores = await procesoActorModel.getActoresByProcesoCarpeta(id, tipo_carpeta);

    return successResponse(
        res,
        actores,
        `Actores de ${tipo_carpeta} obtenidos exitosamente`
    );
};

/**
 * OBTENER ACTORES AGRUPADOS POR CARPETA
 */
const getActoresAgrupados = async (req, res) => {
    const { id } = req.params;

    const agrupados = await procesoActorModel.getActoresAgrupadosPorCarpeta(id);

    return successResponse(
        res,
        agrupados,
        'Actores agrupados por carpeta obtenidos exitosamente'
    );
};

/**
 * ASIGNAR MÚLTIPLES ACTORES
 */
const asignarMultiples = async (req, res) => {
    const { id } = req.params; // proceso_id

    // Soportar 2 formatos:
    // Formato 1: { tipo_carpeta: "CJ", actores_ids: [1, 2] }
    // Formato 2: { actores: [{ actor_id: 1, tipo_carpeta: "CJ" }, ...] }

    if (req.body.actores && Array.isArray(req.body.actores)) {
        // Formato 2: Actores con carpetas individuales
        const { actores } = req.body;

        if (actores.length === 0) {
            const { BadRequestError } = require('../utils/errorHandler');
            throw new BadRequestError('El array de actores no puede estar vacío');
        }

        // Validar cada actor
        const tiposValidos = ['CJ', 'CJO', 'CEMCI', 'CEMS'];
        for (const actor of actores) {
            if (!actor.actor_id || !actor.tipo_carpeta) {
                const { BadRequestError } = require('../utils/errorHandler');
                throw new BadRequestError('Cada actor debe tener actor_id y tipo_carpeta');
            }
            if (!tiposValidos.includes(actor.tipo_carpeta)) {
                const { BadRequestError } = require('../utils/errorHandler');
                throw new BadRequestError(
                    `Tipo de carpeta inválido: ${actor.tipo_carpeta}. Debe ser uno de: ${tiposValidos.join(', ')}`
                );
            }
        }

        // Asignar cada actor individualmente
        const resultados = [];
        for (const actor of actores) {
            try {
                const resultado = await procesoActorModel.asignar(id, actor.tipo_carpeta, actor.actor_id);
                resultados.push({
                    actor_id: actor.actor_id,
                    tipo_carpeta: actor.tipo_carpeta,
                    exito: true,
                    data: resultado
                });
            } catch (error) {
                resultados.push({
                    actor_id: actor.actor_id,
                    tipo_carpeta: actor.tipo_carpeta,
                    exito: false,
                    error: error.message
                });
            }
        }

        return successResponse(
            res,
            resultados,
            'Proceso de asignación completado'
        );

    } else {
        // Formato 1: Todos a la misma carpeta
        const { tipo_carpeta, actores_ids } = req.body;

        validateRequiredFields(req.body, ['tipo_carpeta', 'actores_ids']);

        if (!Array.isArray(actores_ids) || actores_ids.length === 0) {
            const { BadRequestError } = require('../utils/errorHandler');
            throw new BadRequestError('actores_ids debe ser un array con al menos un ID');
        }

        const resultados = await procesoActorModel.asignarMultiples(id, tipo_carpeta, actores_ids);

        return successResponse(
            res,
            resultados,
            'Proceso de asignación completado'
        );
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getStats,
    getByTipo,
    asignarAProceso,
    desasignarDeProceso,
    getActoresByProceso,
    getActoresByProcesoCarpeta,
    getActoresAgrupados,
    asignarMultiples
};