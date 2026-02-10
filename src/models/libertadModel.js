// src/models/libertadModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE LIBERTAD
 *
 * Datos de libertad con obligaciones del proceso
 * Relación 1:1 con proceso
 */

/**
 * CREAR LIBERTAD
 */
const create = async (libertadData) => {
    const {
        proceso_id,
        obligaciones,
        fecha_inicial_ejecucion,
        termino_obligaciones,
        fecha_cumplimiento,
        cumplida
    } = libertadData;

    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que no exista ya libertad para este proceso
    const libertadExistente = `SELECT id_libertad FROM libertad WHERE proceso_id = ?`;
    const [existe] = await executeQuery(libertadExistente, [proceso_id]);

    if (existe) {
        throw new ConflictError('Ya existe libertad para este proceso');
    }

    const sql = `
    INSERT INTO libertad (
      proceso_id,
      obligaciones,
      fecha_inicial_ejecucion,
      termino_obligaciones,
      fecha_cumplimiento,
      cumplida
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        proceso_id,
        obligaciones || null,
        fecha_inicial_ejecucion || null,
        termino_obligaciones || null,
        fecha_cumplimiento || null,
        cumplida || false
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS LIBERTADES
 */
const getAll = async (filters = {}) => {
    const { cumplida } = filters;

    let sql = `
    SELECT 
      l.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM libertad l
    INNER JOIN proceso p ON l.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE 1=1
  `;
    const params = [];

    if (cumplida !== undefined) {
        sql += ` AND l.cumplida = ?`;
        params.push(cumplida);
    }

    sql += ` ORDER BY l.fecha_inicial_ejecucion DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      l.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM libertad l
    INNER JOIN proceso p ON l.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE l.id_libertad = ?
  `;

    const [libertad] = await executeQuery(sql, [id]);

    if (!libertad) {
        throw new NotFoundError('Libertad no encontrada');
    }

    return libertad;
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT * FROM libertad WHERE proceso_id = ?
  `;

    const [libertad] = await executeQuery(sql, [procesoId]);
    return libertad || null;
};

/**
 * ACTUALIZAR LIBERTAD
 */
const update = async (id, libertadData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'obligaciones',
        'fecha_inicial_ejecucion',
        'termino_obligaciones',
        'fecha_cumplimiento',
        'cumplida'
    ];

    campos.forEach(campo => {
        if (libertadData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(libertadData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE libertad 
    SET ${updates.join(', ')}
    WHERE id_libertad = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * MARCAR COMO CUMPLIDA
 */
const marcarCumplida = async (id, fechaCumplimiento = null) => {
    const libertad = await getById(id);

    if (libertad.cumplida) {
        throw new ConflictError('La libertad ya está marcada como cumplida');
    }

    const sql = `
    UPDATE libertad 
    SET cumplida = TRUE,
        fecha_cumplimiento = ?
    WHERE id_libertad = ?
  `;

    await executeQuery(sql, [fechaCumplimiento || new Date(), id]);
    return await getById(id);
};

/**
 * ELIMINAR LIBERTAD
 */
const remove = async (id) => {
    const libertad = await getById(id);

    const sql = `DELETE FROM libertad WHERE id_libertad = ?`;
    await executeQuery(sql, [id]);

    return libertad;
};

/**
 * OBTENER LIBERTADES ACTIVAS (no cumplidas)
 */
const getActivas = async () => {
    const sql = `
    SELECT 
      l.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM libertad l
    INNER JOIN proceso p ON l.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE l.cumplida = FALSE
    ORDER BY l.fecha_inicial_ejecucion DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER LIBERTADES PRÓXIMAS A VENCER
 */
const getProximasVencer = async (dias = 30) => {
    const sql = `
    SELECT 
      l.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      DATEDIFF(l.termino_obligaciones, CURDATE()) as dias_restantes
    FROM libertad l
    INNER JOIN proceso p ON l.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE l.cumplida = FALSE
      AND l.termino_obligaciones IS NOT NULL
      AND l.termino_obligaciones BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY l.termino_obligaciones ASC
  `;

    return await executeQuery(sql, [dias]);
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
      COUNT(CASE WHEN termino_obligaciones < CURDATE() AND cumplida = FALSE THEN 1 END) as vencidas
    FROM libertad
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
    getActivas,
    getProximasVencer,
    getStats
};