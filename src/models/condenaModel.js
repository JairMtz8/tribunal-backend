// src/models/condenaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CONDENA
 *
 * Datos de la condena del proceso
 * Relación 1:1 con proceso
 */

/**
 * CREAR CONDENA
 */
const create = async (condenaData) => {
    const {
        proceso_id,
        tipo_reparacion_id,
        inicio_computo_sancion,
        compurga,
        cumplida
    } = condenaData;

    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que no exista ya una condena para este proceso
    const condenaExistente = `SELECT id_condena FROM condena WHERE proceso_id = ?`;
    const [existe] = await executeQuery(condenaExistente, [proceso_id]);

    if (existe) {
        throw new ConflictError('Ya existe una condena para este proceso');
    }

    const sql = `
    INSERT INTO condena (
      proceso_id,
      tipo_reparacion_id,
      inicio_computo_sancion,
      compurga,
      cumplida
    ) VALUES (?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        proceso_id,
        tipo_reparacion_id || null,
        inicio_computo_sancion || null,
        compurga || null,
        cumplida || false
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS CONDENAS
 */
const getAll = async (filters = {}) => {
    const { cumplida } = filters;

    let sql = `
    SELECT 
      c.*,
      tr.nombre as tipo_reparacion_nombre,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM condena c
    INNER JOIN proceso p ON c.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN tipo_reparacion tr ON c.tipo_reparacion_id = tr.id_tipo_reparacion
    WHERE 1=1
  `;
    const params = [];

    if (cumplida !== undefined) {
        sql += ` AND c.cumplida = ?`;
        params.push(cumplida);
    }

    sql += ` ORDER BY c.inicio_computo_sancion DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      c.*,
      tr.nombre as tipo_reparacion_nombre,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM condena c
    INNER JOIN proceso p ON c.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN tipo_reparacion tr ON c.tipo_reparacion_id = tr.id_tipo_reparacion
    WHERE c.id_condena = ?
  `;

    const [condena] = await executeQuery(sql, [id]);

    if (!condena) {
        throw new NotFoundError('Condena no encontrada');
    }

    return condena;
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT 
      c.*,
      tr.nombre as tipo_reparacion_nombre
    FROM condena c
    LEFT JOIN tipo_reparacion tr ON c.tipo_reparacion_id = tr.id_tipo_reparacion
    WHERE c.proceso_id = ?
  `;

    const [condena] = await executeQuery(sql, [procesoId]);
    return condena || null;
};

/**
 * ACTUALIZAR CONDENA
 */
const update = async (id, condenaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'tipo_reparacion_id',
        'inicio_computo_sancion',
        'compurga',
        'cumplida'
    ];

    campos.forEach(campo => {
        if (condenaData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(condenaData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE condena 
    SET ${updates.join(', ')}
    WHERE id_condena = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * MARCAR COMO CUMPLIDA
 */
const marcarCumplida = async (id) => {
    const condena = await getById(id);

    if (condena.cumplida) {
        throw new ConflictError('La condena ya está marcada como cumplida');
    }

    const sql = `
    UPDATE condena 
    SET cumplida = TRUE
    WHERE id_condena = ?
  `;

    await executeQuery(sql, [id]);
    return await getById(id);
};

/**
 * ELIMINAR CONDENA
 */
const remove = async (id) => {
    const condena = await getById(id);

    const sql = `DELETE FROM condena WHERE id_condena = ?`;
    await executeQuery(sql, [id]);

    return condena;
};

/**
 * ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN cumplida = TRUE THEN 1 END) as cumplidas,
      COUNT(CASE WHEN cumplida = FALSE THEN 1 END) as activas,
      COUNT(CASE WHEN tipo_reparacion_id IS NOT NULL THEN 1 END) as con_reparacion
    FROM condena
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getAll,
    getById,
    getByProcesoId,
    update,
    marcarCumplida,
    remove,
    getStats
};