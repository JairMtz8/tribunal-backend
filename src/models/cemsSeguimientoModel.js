// src/models/cemsSeguimientoModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CEMS_SEGUIMIENTO
 *
 * Tabla de seguimiento por proceso
 * Un CEMS puede tener múltiples seguimientos (uno por proceso)
 */

/**
 * CREAR SEGUIMIENTO
 */
const create = async (seguimientoData) => {
    const {
        cems_id,
        proceso_id,
        cumplimiento_anticipado,
        causa_ejecutoria,
        remision_postsancion,
        se_libra_orden,
        cumplimiento_orden,
        se_declaro_sustraido,
        obligaciones_suspendidos,
        obligaciones_sustraccion,
        obligaciones_externos
    } = seguimientoData;

    // Verificar que CEMS existe
    const cemsCheck = `SELECT id_cems FROM cems WHERE id_cems = ?`;
    const [cems] = await executeQuery(cemsCheck, [cems_id]);

    if (!cems) {
        throw new NotFoundError('La CEMS especificada no existe');
    }

    // Verificar que proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que no exista ya el seguimiento
    const existeCheck = `
    SELECT * FROM cems_seguimiento 
    WHERE cems_id = ? AND proceso_id = ?
  `;
    const [existe] = await executeQuery(existeCheck, [cems_id, proceso_id]);

    if (existe) {
        throw new ConflictError('Ya existe un seguimiento de CEMS para este proceso');
    }

    const sql = `
    INSERT INTO cems_seguimiento (
      cems_id, proceso_id,
      cumplimiento_anticipado,
      causa_ejecutoria,
      remision_postsancion,
      se_libra_orden,
      cumplimiento_orden,
      se_declaro_sustraido,
      obligaciones_suspendidos,
      obligaciones_sustraccion,
      obligaciones_externos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        cems_id,
        proceso_id,
        cumplimiento_anticipado || false,
        causa_ejecutoria || null,
        remision_postsancion || null,
        se_libra_orden || false,
        cumplimiento_orden || null,
        se_declaro_sustraido || null,
        obligaciones_suspendidos || null,
        obligaciones_sustraccion || null,
        obligaciones_externos || null
    ]);

    return result.insertId;
};

/**
 * OBTENER SEGUIMIENTOS DE UN CEMS
 */
const getByCemsId = async (cemsId) => {
    const sql = `
    SELECT 
      cs.*,
      p.id_proceso,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM cems_seguimiento cs
    INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE cs.cems_id = ?
    ORDER BY cs.cumplimiento_orden DESC
  `;

    return await executeQuery(sql, [cemsId]);
};

/**
 * OBTENER SEGUIMIENTO POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT 
      cs.*,
      ce.numero_cems
    FROM cems_seguimiento cs
    INNER JOIN cems ce ON cs.cems_id = ce.id_cems
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
      ce.numero_cems,
      p.id_proceso,
      a.nombre as adolescente_nombre
    FROM cems_seguimiento cs
    INNER JOIN cems ce ON cs.cems_id = ce.id_cems
    INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE cs.id_seguimiento = ?
  `;

    const [seguimiento] = await executeQuery(sql, [id]);

    if (!seguimiento) {
        throw new NotFoundError('Seguimiento de CEMS no encontrado');
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
        'cumplimiento_anticipado',
        'causa_ejecutoria',
        'remision_postsancion',
        'se_libra_orden',
        'cumplimiento_orden',
        'se_declaro_sustraido',
        'obligaciones_suspendidos',
        'obligaciones_sustraccion',
        'obligaciones_externos'
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
    UPDATE cems_seguimiento 
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

    const sql = `DELETE FROM cems_seguimiento WHERE id_seguimiento = ?`;
    await executeQuery(sql, [id]);

    return seguimiento;
};

/**
 * CONTAR SEGUIMIENTOS DE UN CEMS
 */
const countByCems = async (cemsId) => {
    const sql = `
    SELECT COUNT(*) as total 
    FROM cems_seguimiento 
    WHERE cems_id = ?
  `;

    const [result] = await executeQuery(sql, [cemsId]);
    return result.total;
};

/**
 * OBTENER SEGUIMIENTOS CON CUMPLIMIENTO ANTICIPADO
 */
const getCumplimientoAnticipado = async () => {
    const sql = `
    SELECT 
      cs.*,
      ce.numero_cems,
      a.nombre as adolescente_nombre
    FROM cems_seguimiento cs
    INNER JOIN cems ce ON cs.cems_id = ce.id_cems
    INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE cs.cumplimiento_anticipado = TRUE
    ORDER BY cs.cumplimiento_orden DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER SEGUIMIENTOS CON SUSTRAÍDOS
 */
const getSustraidos = async () => {
    const sql = `
    SELECT 
      cs.*,
      ce.numero_cems,
      a.nombre as adolescente_nombre
    FROM cems_seguimiento cs
    INNER JOIN cems ce ON cs.cems_id = ce.id_cems
    INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE cs.se_declaro_sustraido IS NOT NULL
    ORDER BY cs.se_declaro_sustraido DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER SEGUIMIENTOS CON ORDEN LIBRADA
 */
const getConOrdenLibrada = async () => {
    const sql = `
    SELECT 
      cs.*,
      ce.numero_cems,
      a.nombre as adolescente_nombre
    FROM cems_seguimiento cs
    INNER JOIN cems ce ON cs.cems_id = ce.id_cems
    INNER JOIN proceso p ON cs.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE cs.se_libra_orden = TRUE
    ORDER BY cs.cumplimiento_orden DESC
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
      COUNT(CASE WHEN cumplimiento_anticipado = TRUE THEN 1 END) as cumplimiento_anticipado,
      COUNT(CASE WHEN se_libra_orden = TRUE THEN 1 END) as con_orden_librada,
      COUNT(CASE WHEN se_declaro_sustraido IS NOT NULL THEN 1 END) as sustraidos
    FROM cems_seguimiento
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getByCemsId,
    getByProcesoId,
    getById,
    update,
    remove,
    countByCems,
    getCumplimientoAnticipado,
    getSustraidos,
    getConOrdenLibrada,
    getStats
};