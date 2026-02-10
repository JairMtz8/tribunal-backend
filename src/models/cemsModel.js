// src/models/cemsModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CEMS
 *
 * CEMS = Carpeta de Ejecución de Medidas Sancionadoras
 * Se crea automáticamente cuando la sentencia es CONDENATORIA o MIXTA
 */

/**
 * CREAR CEMS (Manual - aunque normalmente se auto-crea)
 */
const create = async (cemsData) => {
    const {
        numero_cems,
        cj_id,
        cjo_id,
        cemci_id,
        fecha_recepcion,
        estado_procesal_id,
        status,
        jto,
        cmva,
        ceip,
        plan_actividad_fecha_inicio,
        declinacion_comperencia,
        estado_declina,
        estado_recibe,
        adolescentes_orden_comparencia,
        observaciones
    } = cemsData;

    // Verificar que la CJ existe
    const cjCheck = `SELECT id_cj FROM cj WHERE id_cj = ?`;
    const [cj] = await executeQuery(cjCheck, [cj_id]);

    if (!cj) {
        throw new NotFoundError('La CJ especificada no existe');
    }

    // Verificar que la CJO existe
    const cjoCheck = `SELECT id_cjo FROM cjo WHERE id_cjo = ?`;
    const [cjo] = await executeQuery(cjoCheck, [cjo_id]);

    if (!cjo) {
        throw new NotFoundError('La CJO especificada no existe');
    }

    // Verificar CEMCI si se proporciona
    if (cemci_id) {
        const cemciCheck = `SELECT id_cemci FROM cemci WHERE id_cemci = ?`;
        const [cemci] = await executeQuery(cemciCheck, [cemci_id]);

        if (!cemci) {
            throw new NotFoundError('La CEMCI especificada no existe');
        }
    }

    const sql = `
    INSERT INTO cems (
      numero_cems, cj_id, cjo_id, cemci_id,
      fecha_recepcion, estado_procesal_id, status,
      jto, cmva, ceip, plan_actividad_fecha_inicio,
      declinacion_comperencia, estado_declina, estado_recibe,
      adolescentes_orden_comparencia, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        numero_cems,
        cj_id,
        cjo_id,
        cemci_id || null,
        fecha_recepcion || null,
        estado_procesal_id || null,
        status !== undefined ? status : null,
        jto || null,
        cmva || null,
        ceip || null,
        plan_actividad_fecha_inicio || null,
        declinacion_comperencia || false,
        estado_declina || null,
        estado_recibe || null,
        adolescentes_orden_comparencia || null,
        observaciones || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS CEMS
 */
const getAll = async (filters = {}) => {
    const { estado_procesal_id, status } = filters;

    let sql = `
    SELECT 
      cs.*,
      cj.numero_cj,
      cjo.numero_cjo,
      ep.nombre as estado_procesal_nombre
    FROM cems cs
    INNER JOIN cj ON cs.cj_id = cj.id_cj
    INNER JOIN cjo ON cs.cjo_id = cjo.id_cjo
    LEFT JOIN estado_procesal ep ON cs.estado_procesal_id = ep.id_estado
    WHERE 1=1
  `;
    const params = [];

    if (estado_procesal_id) {
        sql += ` AND cs.estado_procesal_id = ?`;
        params.push(estado_procesal_id);
    }

    if (status !== undefined) {
        sql += ` AND cs.status = ?`;
        params.push(status);
    }

    sql += ` ORDER BY cs.fecha_recepcion DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      cs.*,
      cj.numero_cj,
      cjo.numero_cjo,
      cemci.numero_cemci,
      ep.nombre as estado_procesal_nombre
    FROM cems cs
    INNER JOIN cj ON cs.cj_id = cj.id_cj
    INNER JOIN cjo ON cs.cjo_id = cjo.id_cjo
    LEFT JOIN cemci ON cs.cemci_id = cemci.id_cemci
    LEFT JOIN estado_procesal ep ON cs.estado_procesal_id = ep.id_estado
    WHERE cs.id_cems = ?
  `;

    const [cems] = await executeQuery(sql, [id]);

    if (!cems) {
        throw new NotFoundError('CEMS no encontrada');
    }

    return cems;
};

/**
 * OBTENER POR CJO_ID
 */
const getByCjoId = async (cjoId) => {
    const sql = `
    SELECT 
      cs.*,
      cj.numero_cj,
      cjo.numero_cjo,
      ep.nombre as estado_procesal_nombre
    FROM cems cs
    INNER JOIN cj ON cs.cj_id = cj.id_cj
    INNER JOIN cjo ON cs.cjo_id = cjo.id_cjo
    LEFT JOIN estado_procesal ep ON cs.estado_procesal_id = ep.id_estado
    WHERE cs.cjo_id = ?
  `;

    const [cems] = await executeQuery(sql, [cjoId]);
    return cems || null;
};

/**
 * ACTUALIZAR CEMS
 */
const update = async (id, cemsData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'numero_cems', 'cemci_id', 'fecha_recepcion', 'estado_procesal_id',
        'status', 'jto', 'cmva', 'ceip', 'plan_actividad_fecha_inicio',
        'declinacion_comperencia', 'estado_declina', 'estado_recibe',
        'adolescentes_orden_comparencia', 'observaciones'
    ];

    campos.forEach(campo => {
        if (cemsData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(cemsData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE cems 
    SET ${updates.join(', ')}
    WHERE id_cems = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR CEMS
 */
const remove = async (id) => {
    const cems = await getById(id);

    const sql = `DELETE FROM cems WHERE id_cems = ?`;
    await executeQuery(sql, [id]);

    return cems;
};

/**
 * CONTAR CEMS
 */
const getCount = async (filters = {}) => {
    const { estado_procesal_id } = filters;

    let sql = `SELECT COUNT(*) as total FROM cems WHERE 1=1`;
    const params = [];

    if (estado_procesal_id) {
        sql += ` AND estado_procesal_id = ?`;
        params.push(estado_procesal_id);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

/**
 * ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN cemci_id IS NOT NULL THEN 1 END) as con_cemci,
      COUNT(CASE WHEN cemci_id IS NULL THEN 1 END) as sin_cemci,
      COUNT(CASE WHEN status = TRUE THEN 1 END) as activos,
      COUNT(CASE WHEN status = FALSE THEN 1 END) as inactivos,
      COUNT(CASE WHEN declinacion_comperencia = TRUE THEN 1 END) as con_declinacion
    FROM cems
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

/**
 * VERIFICAR SI PROCESO TIENE CEMS
 */
const tieneCems = async (procesoId) => {
    const sql = `
    SELECT cems_id 
    FROM proceso_carpeta 
    WHERE id_proceso = ?
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result && result.cems_id ? true : false;
};

module.exports = {
    create,
    getAll,
    getById,
    getByCjoId,
    update,
    remove,
    getCount,
    getStats,
    tieneCems
};