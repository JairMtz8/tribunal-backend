// src/models/medidaSancionadoraModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE MEDIDA SANCIONADORA
 *
 * Gestiona las medidas sancionadoras aplicadas al adolescente
 * Relación 1:N con proceso (un proceso puede tener múltiples medidas)
 */

/**
 * CREAR MEDIDA SANCIONADORA
 */
const create = async (medidaData) => {
    const {
        proceso_id,
        tipo_medida_sancionadora_id,
        plazo_anios,
        plazo_meses,
        plazo_dias
    } = medidaData;

    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que el tipo de medida existe
    const tipoCheck = `
        SELECT * FROM tipo_medida_sancionadora
        WHERE id_tipo_medida_sancionadora = ?
    `;
    const [tipo] = await executeQuery(tipoCheck, [tipo_medida_sancionadora_id]);

    if (!tipo) {
        throw new NotFoundError('El tipo de medida sancionadora no existe');
    }

    const sql = `
        INSERT INTO medida_sancionadora (
            proceso_id,
            tipo_medida_sancionadora_id,
            plazo_anios,
            plazo_meses,
            plazo_dias
        ) VALUES (?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
        proceso_id,
        tipo_medida_sancionadora_id,
        plazo_anios || 0,
        plazo_meses || 0,
        plazo_dias || 0
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS MEDIDAS DE UN PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
        SELECT
            ms.*,
            tms.nombre as tipo_nombre,
            tms.es_privativa
        FROM medida_sancionadora ms
                 INNER JOIN tipo_medida_sancionadora tms
                            ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
        WHERE ms.proceso_id = ?
        ORDER BY ms.id_medida DESC
    `;

    return await executeQuery(sql, [procesoId]);
};

/**
 * OBTENER MEDIDA POR ID
 */
const getById = async (id) => {
    const sql = `
        SELECT
            ms.*,
            tms.nombre as tipo_nombre,
            tms.es_privativa
        FROM medida_sancionadora ms
                 INNER JOIN tipo_medida_sancionadora tms
                            ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
        WHERE ms.id_medida = ?
    `;

    const [medida] = await executeQuery(sql, [id]);

    if (!medida) {
        throw new NotFoundError('Medida sancionadora no encontrada');
    }

    return medida;
};

/**
 * ACTUALIZAR MEDIDA SANCIONADORA
 */
const update = async (id, medidaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'tipo_medida_sancionadora_id',
        'plazo_anios',
        'plazo_meses',
        'plazo_dias'
    ];

    campos.forEach(campo => {
        if (medidaData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(medidaData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
        UPDATE medida_sancionadora
        SET ${updates.join(', ')}
        WHERE id_medida = ?
    `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR MEDIDA SANCIONADORA
 */
const remove = async (id) => {
    const medida = await getById(id);

    const sql = `DELETE FROM medida_sancionadora WHERE id_medida = ?`;
    await executeQuery(sql, [id]);

    return medida;
};

/**
 * CONTAR MEDIDAS DE UN PROCESO
 */
const countByProceso = async (procesoId) => {
    const sql = `
        SELECT COUNT(*) as total
        FROM medida_sancionadora
        WHERE proceso_id = ?
    `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.total;
};

/**
 * OBTENER MEDIDAS PRIVATIVAS
 */
const getPrivativas = async () => {
    const sql = `
        SELECT
            ms.*,
            tms.nombre as tipo_nombre,
            a.nombre as adolescente_nombre,
            a.iniciales as adolescente_iniciales
        FROM medida_sancionadora ms
                 INNER JOIN tipo_medida_sancionadora tms
                            ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
                 INNER JOIN proceso p ON ms.proceso_id = p.id_proceso
                 INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
        WHERE tms.es_privativa = TRUE
        ORDER BY ms.id_medida DESC
    `;

    return await executeQuery(sql);
};

/**
 * OBTENER MEDIDAS NO PRIVATIVAS
 */
const getNoPrivativas = async () => {
    const sql = `
        SELECT
            ms.*,
            tms.nombre as tipo_nombre,
            a.nombre as adolescente_nombre,
            a.iniciales as adolescente_iniciales
        FROM medida_sancionadora ms
                 INNER JOIN tipo_medida_sancionadora tms
                            ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
                 INNER JOIN proceso p ON ms.proceso_id = p.id_proceso
                 INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
        WHERE tms.es_privativa = FALSE
        ORDER BY ms.id_medida DESC
    `;

    return await executeQuery(sql);
};

/**
 * VERIFICAR SI PROCESO TIENE MEDIDAS PRIVATIVAS
 */
const tieneMedidasPrivativas = async (procesoId) => {
    const sql = `
        SELECT COUNT(*) as count
        FROM medida_sancionadora ms
            INNER JOIN tipo_medida_sancionadora tms
        ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
        WHERE ms.proceso_id = ?
          AND tms.es_privativa = TRUE
    `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.count > 0;
};

/**
 * CALCULAR PLAZO TOTAL EN DÍAS
 */
const calcularPlazoTotalDias = (plazo_anios, plazo_meses, plazo_dias) => {
    const diasPorAnio = 365;
    const diasPorMes = 30;

    return (plazo_anios * diasPorAnio) + (plazo_meses * diasPorMes) + plazo_dias;
};

/**
 * ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
        SELECT
            tms.nombre as tipo,
            tms.es_privativa,
            COUNT(*) as total,
            AVG(ms.plazo_anios) as promedio_anios,
            AVG(ms.plazo_meses) as promedio_meses,
            AVG(ms.plazo_dias) as promedio_dias
        FROM medida_sancionadora ms
                 INNER JOIN tipo_medida_sancionadora tms
                            ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
        GROUP BY tms.nombre, tms.es_privativa
        ORDER BY total DESC
    `;

    return await executeQuery(sql);
};

/**
 * ESTADÍSTICAS GENERALES
 */
const getStatsGenerales = async () => {
    const sql = `
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN tms.es_privativa = TRUE THEN 1 END) as privativas,
            COUNT(CASE WHEN tms.es_privativa = FALSE THEN 1 END) as no_privativas,
            AVG(ms.plazo_anios * 365 + ms.plazo_meses * 30 + ms.plazo_dias) as promedio_dias_total
        FROM medida_sancionadora ms
                 INNER JOIN tipo_medida_sancionadora tms
                            ON ms.tipo_medida_sancionadora_id = tms.id_tipo_medida_sancionadora
    `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getByProcesoId,
    getById,
    update,
    remove,
    countByProceso,
    getPrivativas,
    getNoPrivativas,
    tieneMedidasPrivativas,
    calcularPlazoTotalDias,
    getStats,
    getStatsGenerales
};