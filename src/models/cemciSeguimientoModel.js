// src/models/cemciSeguimientoModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CEMCI_SEGUIMIENTO
 *
 * Tabla de seguimiento por proceso
 * Un CEMCI puede tener múltiples seguimientos (uno por proceso)
 */

/**
 * CREAR SEGUIMIENTO
 */
const create = async (seguimientoData) => {
    const {
        cemci_id,
        proceso_id,
        fecha_aprobacion_plan_actividades,
        fecha_recepcion_plan_actividades,
        obligaciones_plan_actividades,
        ultimo_informe,
        fecha_audiencia_inicial_cemci,
        fecha_radicacion,
        fecha_suspension,
        motivo_suspension
    } = seguimientoData;

    // Verificar que CEMCI existe
    const cemciCheck = `SELECT id_cemci FROM cemci WHERE id_cemci = ?`;
    const [cemci] = await executeQuery(cemciCheck, [cemci_id]);

    if (!cemci) {
        throw new NotFoundError('La CEMCI especificada no existe');
    }

    // Verificar que proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que no exista ya el seguimiento
    const existeCheck = `
        SELECT * FROM cemci_seguimiento
        WHERE cemci_id = ? AND proceso_id = ?
    `;
    const [existe] = await executeQuery(existeCheck, [cemci_id, proceso_id]);

    if (existe) {
        throw new ConflictError('Ya existe un seguimiento de CEMCI para este proceso');
    }

    const sql = `
        INSERT INTO cemci_seguimiento (
            cemci_id, proceso_id,
            fecha_aprobacion_plan_actividades,
            fecha_recepcion_plan_actividades,
            obligaciones_plan_actividades,
            ultimo_informe,
            fecha_audiencia_inicial_cemci,
            fecha_radicacion,
            fecha_suspension,
            motivo_suspension
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
        cemci_id,
        proceso_id,
        fecha_aprobacion_plan_actividades || null,
        fecha_recepcion_plan_actividades || null,
        obligaciones_plan_actividades || null,
        ultimo_informe || null,
        fecha_audiencia_inicial_cemci || null,
        fecha_radicacion || null,
        fecha_suspension || null,
        motivo_suspension || null
    ]);

    return result.insertId;
};

/**
 * OBTENER SEGUIMIENTOS DE UN CEMCI
 */
const getByCemciId = async (cemciId) => {
    const sql = `
        SELECT
            cs.*,
            p.id_proceso,
            a.nombre as adolescente_nombre,
            a.iniciales as adolescente_iniciales
        FROM cemci_seguimiento cs
                 INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
                 INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
        WHERE cs.cemci_id = ?
        ORDER BY cs.fecha_radicacion DESC
    `;

    return await executeQuery(sql, [cemciId]);
};

/**
 * OBTENER SEGUIMIENTO POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
        SELECT
            cs.*,
            c.numero_cemci,
            c.fecha_recepcion_cemci
        FROM cemci_seguimiento cs
                 INNER JOIN cemci c ON cs.cemci_id = c.id_cemci
        WHERE cs.proceso_id = ?
    `;

    const [seguimiento] = await executeQuery(sql, [procesoId]);
    return seguimiento || null;
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
        SELECT
            cs.*,
            c.numero_cemci,
            p.id_proceso,
            a.nombre as adolescente_nombre
        FROM cemci_seguimiento cs
                 INNER JOIN cemci c ON cs.cemci_id = c.id_cemci
                 INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
                 INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
        WHERE cs.id_seguimiento = ?
    `;

    const [seguimiento] = await executeQuery(sql, [id]);

    if (!seguimiento) {
        throw new NotFoundError('Seguimiento de CEMCI no encontrado');
    }

    return seguimiento;
};

/**
 * ACTUALIZAR SEGUIMIENTO
 */
const update = async (id, seguimientoData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'fecha_aprobacion_plan_actividades',
        'fecha_recepcion_plan_actividades',
        'obligaciones_plan_actividades',
        'ultimo_informe',
        'fecha_audiencia_inicial_cemci',
        'fecha_radicacion',
        'fecha_suspension',
        'motivo_suspension'
    ];

    campos.forEach(campo => {
        if (seguimientoData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(seguimientoData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
        UPDATE cemci_seguimiento
        SET ${updates.join(', ')}
        WHERE id_seguimiento = ?
    `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR SEGUIMIENTO
 */
const remove = async (id) => {
    const seguimiento = await getById(id);

    const sql = `DELETE FROM cemci_seguimiento WHERE id_seguimiento = ?`;
    await executeQuery(sql, [id]);

    return seguimiento;
};

/**
 * CONTAR SEGUIMIENTOS DE UN CEMCI
 */
const countByCemci = async (cemciId) => {
    const sql = `
        SELECT COUNT(*) as total
        FROM cemci_seguimiento
        WHERE cemci_id = ?
    `;

    const [result] = await executeQuery(sql, [cemciId]);
    return result.total;
};

/**
 * VERIFICAR SI PROCESO TIENE SEGUIMIENTO
 */
const tieneSeguimiento = async (procesoId) => {
    const seguimiento = await getByProcesoId(procesoId);
    return !!seguimiento;
};

/**
 * OBTENER SEGUIMIENTOS CON SUSPENSIONES
 */
const getSuspendidos = async () => {
    const sql = `
        SELECT
            cs.*,
            c.numero_cemci,
            a.nombre as adolescente_nombre
        FROM cemci_seguimiento cs
                 INNER JOIN cemci c ON cs.cemci_id = c.id_cemci
                 INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
                 INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
        WHERE cs.fecha_suspension IS NOT NULL
        ORDER BY cs.fecha_suspension DESC
    `;

    return await executeQuery(sql);
};

/**
 * ESTADÍSTICAS DE SEGUIMIENTOS
 */
const getStats = async () => {
    const sql = `
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN fecha_suspension IS NOT NULL THEN 1 END) as suspendidos,
            COUNT(CASE WHEN fecha_radicacion IS NOT NULL THEN 1 END) as radicados,
            COUNT(CASE WHEN fecha_aprobacion_plan_actividades IS NOT NULL THEN 1 END) as con_plan_aprobado
        FROM cemci_seguimiento
    `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getByCemciId,
    getByProcesoId,
    getById,
    update,
    remove,
    countByCemci,
    tieneSeguimiento,
    getSuspendidos,
    getStats
};