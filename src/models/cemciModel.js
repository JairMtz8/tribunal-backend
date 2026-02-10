// src/models/cemciModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CEMCI
 *
 * CEMCI = Carpeta de Ejecución de Medida Cautelar de Internamiento
 * Se crea automáticamente cuando se aplica medida cautelar privativa
 */

/**
 * CREAR CEMCI (Manual - aunque normalmente se auto-crea)
 */
const create = async (cemciData) => {
    const {
        numero_cemci,
        cj_id,
        cjo_id,
        fecha_recepcion_cemci,
        estado_procesal_id,
        concluido,
        observaciones
    } = cemciData;

    // Verificar que la CJ existe
    const cjCheck = `SELECT id_cj FROM cj WHERE id_cj = ?`;
    const [cj] = await executeQuery(cjCheck, [cj_id]);

    if (!cj) {
        throw new NotFoundError('La CJ especificada no existe');
    }

    // Verificar CJO si se proporciona
    if (cjo_id) {
        const cjoCheck = `SELECT id_cjo FROM cjo WHERE id_cjo = ?`;
        const [cjo] = await executeQuery(cjoCheck, [cjo_id]);

        if (!cjo) {
            throw new NotFoundError('La CJO especificada no existe');
        }
    }

    const sql = `
    INSERT INTO cemci (
      numero_cemci, cj_id, cjo_id, fecha_recepcion_cemci,
      estado_procesal_id, concluido, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        numero_cemci,
        cj_id,
        cjo_id || null,
        fecha_recepcion_cemci || null,
        estado_procesal_id || null,
        concluido || null,
        observaciones || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS CEMCI
 */
const getAll = async (filters = {}) => {
    const { estado_procesal_id, concluido } = filters;

    let sql = `
    SELECT 
      c.*,
      cj.numero_cj,
      cjo.numero_cjo,
      ep.nombre as estado_procesal_nombre
    FROM cemci c
    INNER JOIN cj ON c.cj_id = cj.id_cj
    LEFT JOIN cjo ON c.cjo_id = cjo.id_cjo
    LEFT JOIN estado_procesal ep ON c.estado_procesal_id = ep.id_estado
    WHERE 1=1
  `;
    const params = [];

    if (estado_procesal_id) {
        sql += ` AND c.estado_procesal_id = ?`;
        params.push(estado_procesal_id);
    }

    if (concluido !== undefined) {
        sql += ` AND c.concluido = ?`;
        params.push(concluido);
    }

    sql += ` ORDER BY c.fecha_recepcion_cemci DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      c.*,
      cj.numero_cj,
      cjo.numero_cjo,
      ep.nombre as estado_procesal_nombre
    FROM cemci c
    INNER JOIN cj ON c.cj_id = cj.id_cj
    LEFT JOIN cjo ON c.cjo_id = cjo.id_cjo
    LEFT JOIN estado_procesal ep ON c.estado_procesal_id = ep.id_estado
    WHERE c.id_cemci = ?
  `;

    const [cemci] = await executeQuery(sql, [id]);

    if (!cemci) {
        throw new NotFoundError('CEMCI no encontrada');
    }

    return cemci;
};

/**
 * OBTENER POR CJ_ID
 */
const getByCjId = async (cjId) => {
    const sql = `
    SELECT 
      c.*,
      cj.numero_cj,
      ep.nombre as estado_procesal_nombre
    FROM cemci c
    INNER JOIN cj ON c.cj_id = cj.id_cj
    LEFT JOIN estado_procesal ep ON c.estado_procesal_id = ep.id_estado
    WHERE c.cj_id = ?
  `;

    const [cemci] = await executeQuery(sql, [cjId]);
    return cemci || null;
};

/**
 * ACTUALIZAR CEMCI
 */
const update = async (id, cemciData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'numero_cemci', 'cjo_id', 'fecha_recepcion_cemci',
        'estado_procesal_id', 'concluido', 'observaciones'
    ];

    campos.forEach(campo => {
        if (cemciData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(cemciData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE cemci 
    SET ${updates.join(', ')}
    WHERE id_cemci = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR CEMCI
 */
const remove = async (id) => {
    const cemci = await getById(id);

    const sql = `DELETE FROM cemci WHERE id_cemci = ?`;
    await executeQuery(sql, [id]);

    return cemci;
};

/**
 * CONTAR CEMCI
 */
const getCount = async (filters = {}) => {
    const { estado_procesal_id } = filters;

    let sql = `SELECT COUNT(*) as total FROM cemci WHERE 1=1`;
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
      COUNT(CASE WHEN cjo_id IS NOT NULL THEN 1 END) as con_cjo,
      COUNT(CASE WHEN cjo_id IS NULL THEN 1 END) as sin_cjo,
      COUNT(CASE WHEN concluido IS NOT NULL THEN 1 END) as concluidas,
      COUNT(CASE WHEN concluido IS NULL THEN 1 END) as activas
    FROM cemci
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

/**
 * VERIFICAR SI PROCESO TIENE CEMCI
 */
const tieneCemci = async (procesoId) => {
    const sql = `
    SELECT cemci_id 
    FROM proceso_carpeta 
    WHERE id_proceso = ?
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result && result.cemci_id ? true : false;
};

module.exports = {
    create,
    getAll,
    getById,
    getByCjId,
    update,
    remove,
    getCount,
    getStats,
    tieneCemci
};