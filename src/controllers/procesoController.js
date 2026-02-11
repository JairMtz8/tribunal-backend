// src/controllers/procesoController.js

const procesoModel = require('../models/procesoModel');
const cjModel = require('../models/cjModel');
const procesoCarpetaModel = require('../models/procesoCarpetaModel');
const { executeTransaction } = require('../config/database');
const { successResponse, createdResponse, paginatedResponse, getPaginationParams } = require('../utils/response');
const { validateRequiredFields, BadRequestError } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE PROCESO
 *
 * Maneja la creación y gestión de procesos junto con sus carpetas
 */

/**
 * CREAR PROCESO + CJ
 * Ambos se crean en una sola transacción
 */
const create = async (req, res) => {
    const { adolescente_id, status_id, observaciones } = req.body;

    // Validar campos requeridos
    validateRequiredFields(req.body, ['adolescente_id']);

    // Permitir enviar datos de CJ de dos formas:
    // 1. Como objeto: { cj: { numero_cj, ... } }
    // 2. Directamente: { numero_cj, fecha_ingreso, ... }
    const cjData = req.body.cj || req.body;

    // Validar que tenga numero_cj
    if (!cjData.numero_cj) {
        throw new BadRequestError('El campo numero_cj es obligatorio');
    }

    // Crear proceso + CJ + proceso_carpeta en una transacción
    const result = await executeTransaction(async (connection) => {
        // 1. Crear el proceso
        const [procesoResult] = await connection.execute(
            `INSERT INTO proceso (adolescente_id, status_id, observaciones) VALUES (?, ?, ?)`,
            [adolescente_id, status_id || null, observaciones || null]
        );

        const procesoId = procesoResult.insertId;

        // 2. Crear la CJ
        const cjSql = `
      INSERT INTO cj (
        numero_cj, fecha_ingreso, tipo_fuero, numero_ampea,
        tipo_narcotico_asegurado, peso_narcotico_gramos,
        control, lesiones, fecha_control, fecha_formulacion,
        vinculacion, fecha_vinculacion, conducta_vinculacion, declaro,
        suspension_condicional_proceso_prueba, plazo_suspension,
        fecha_suspension, fecha_terminacion_suspension,
        audiencia_intermedia, fecha_audiencia_intermedia,
        estatus_carpeta_preliminar, reincidente, sustraido, fecha_sustraccion,
        medidas_proteccion, numero_toca_apelacion, numero_total_audiencias,
        corporacion_ejecutora, representante_pp_nnya, tipo_representacion_pp_nnya,
        observaciones, observaciones_adicionales, domicilio_hechos_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const [cjResult] = await connection.execute(cjSql, [
            cjData.numero_cj,
            cjData.fecha_ingreso || null,
            cjData.tipo_fuero || null,
            cjData.numero_ampea || null,
            cjData.tipo_narcotico_asegurado || null,
            cjData.peso_narcotico_gramos || null,
            cjData.control || false,
            cjData.lesiones || false,
            cjData.fecha_control || null,
            cjData.fecha_formulacion || null,
            cjData.vinculacion || false,
            cjData.fecha_vinculacion || null,
            cjData.conducta_vinculacion || null,
            cjData.declaro || null,
            cjData.suspension_condicional_proceso_prueba || false,
            cjData.plazo_suspension || null,
            cjData.fecha_suspension || null,
            cjData.fecha_terminacion_suspension || null,
            cjData.audiencia_intermedia || false,
            cjData.fecha_audiencia_intermedia || null,
            cjData.estatus_carpeta_preliminar || null,
            cjData.reincidente || false,
            cjData.sustraido || false,
            cjData.fecha_sustraccion || null,
            cjData.medidas_proteccion || null,
            cjData.numero_toca_apelacion || null,
            cjData.numero_total_audiencias || 0,
            cjData.corporacion_ejecutora || null,
            cjData.representante_pp_nnya || null,
            cjData.tipo_representacion_pp_nnya || null,
            cjData.observaciones || null,
            cjData.observaciones_adicionales || null,
            cjData.domicilio_hechos_id || null
        ]);

        const cjId = cjResult.insertId;

        // 3. Crear la relación en proceso_carpeta
        await connection.execute(
            `INSERT INTO proceso_carpeta (id_proceso, cj_id) VALUES (?, ?)`,
            [procesoId, cjId]
        );

        return { procesoId, cjId };
    });

    // Obtener el proceso completo recién creado
    const procesoCompleto = await getProcesoCompleto(result.procesoId);

    return createdResponse(
        res,
        procesoCompleto,
        'Proceso y carpeta CJ creados exitosamente'
    );
};

/**
 * HELPER: Obtener proceso completo con todas sus relaciones
 */
const getProcesoCompleto = async (procesoId) => {
    const proceso = await procesoModel.getById(procesoId);
    const procesoCarpeta = await procesoCarpetaModel.getByProcesoId(procesoId);

    // Obtener CJ si existe
    let cj = null;
    if (procesoCarpeta.cj_id) {
        cj = await cjModel.getById(procesoCarpeta.cj_id);
    }

    return {
        proceso,
        carpetas: {
            cj,
            cjo: null,  // Aún no implementado
            cemci: null,  // Aún no implementado
            cems: null   // Aún no implementado
        }
    };
};

/**
 * OBTENER TODOS LOS PROCESOS
 */
const getAll = async (req, res) => {
    const { search, status_id } = req.query;

    const usePagination = req.query.page || req.query.limit;

    const filters = { search, status_id };

    if (usePagination) {
        const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

        const [procesos, total] = await Promise.all([
            procesoModel.getAll({ ...filters, limit, offset }),
            procesoModel.getCount(filters)
        ]);

        return paginatedResponse(
            res,
            procesos,
            page,
            limit,
            total,
            'Procesos obtenidos exitosamente'
        );
    } else {
        const procesos = await procesoModel.getAll(filters);

        return successResponse(
            res,
            procesos,
            'Procesos obtenidos exitosamente'
        );
    }
};

/**
 * OBTENER PROCESO POR ID (completo con carpetas)
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const procesoCompleto = await getProcesoCompleto(id);

    return successResponse(
        res,
        procesoCompleto,
        'Proceso obtenido exitosamente'
    );
};

/**
 * OBTENER PROCESO POR ADOLESCENTE ID
 */
const getByAdolescente = async (req, res) => {
    const { id } = req.params;

    const proceso = await procesoModel.getByAdolescenteId(id);

    if (!proceso) {
        return successResponse(
            res,
            null,
            'El adolescente no tiene proceso asignado'
        );
    }

    const procesoCompleto = await getProcesoCompleto(proceso.id_proceso);

    return successResponse(
        res,
        procesoCompleto,
        'Proceso del adolescente obtenido exitosamente'
    );
};

/**
 * ACTUALIZAR PROCESO
 * Solo actualiza datos del proceso, no de las carpetas
 */
const update = async (req, res) => {
    const { id } = req.params;
    const { status_id, observaciones } = req.body;

    const procesoActualizado = await procesoModel.update(id, {
        status_id,
        observaciones
    });

    return successResponse(
        res,
        procesoActualizado,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * ELIMINAR PROCESO
 * Solo si no tiene carpetas asociadas
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const proceso = await procesoModel.remove(id);

    return successResponse(
        res,
        proceso,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * OBTENER ESTADÍSTICAS DE PROCESOS
 */
const getStats = async (req, res) => {
    const total = await procesoModel.getCount();

    // Contar por status (si existen)
    const porStatus = await Promise.all([
        procesoModel.getCount({ status_id: 1 }),
        procesoModel.getCount({ status_id: 2 }),
        procesoModel.getCount({ status_id: 3 })
    ]);

    const stats = {
        total,
        por_status: {
            status_1: porStatus[0],
            status_2: porStatus[1],
            status_3: porStatus[2]
        }
    };

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
    getByAdolescente,
    update,
    remove,
    getStats,
    getProcesoCompleto  // Exportar para uso en otros módulos
};