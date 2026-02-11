// src/models/calificativaDelitoModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CALIFICATIVA_DELITO
 *
 * Catálogo de calificativas para los delitos
 * Ejemplos: Simple, Calificado, Culposo, Doloso, Otro, etc.
 */

/**
 * CREAR CALIFICATIVA
 */
const create = async (calificativaData) => {
    const { nombre, activo } = calificativaData;

    // Verificar que el nombre no exista
    const checkSql = `SELECT id_calificativa FROM calificativa_delito WHERE nombre = ?`;
    const [existing] = await executeQuery(checkSql, [nombre]);

    if (existing) {
        throw new ConflictError(`La calificativa "${nombre}" ya existe`);
    }

    const sql = `
    INSERT INTO calificativa_delito (nombre, activo)
    VALUES (?, ?)
  `;

    const result = await executeQuery(sql, [
        nombre,
        activo !== undefined ? activo : true
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS CALIFICATIVAS
 */
const getAll = async (filters = {}) => {
    const { activo, search } = filters;

    let sql = `SELECT * FROM calificativa_delito WHERE 1=1`;
    const params = [];

    if (activo !== undefined) {
        sql += ` AND activo = ?`;
        params.push(activo);
    }

    if (search) {
        sql += ` AND nombre LIKE ?`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY nombre ASC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER SOLO ACTIVAS
 */
const getActivas = async () => {
    const sql = `
    SELECT * FROM calificativa_delito 
    WHERE activo = TRUE 
    ORDER BY nombre ASC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `SELECT * FROM calificativa_delito WHERE id_calificativa = ?`;
    const [calificativa] = await executeQuery(sql, [id]);

    if (!calificativa) {
        throw new NotFoundError('Calificativa no encontrada');
    }

    return calificativa;
};

/**
 * OBTENER POR NOMBRE
 */
const getByNombre = async (nombre) => {
    const sql = `SELECT * FROM calificativa_delito WHERE nombre = ?`;
    const [calificativa] = await executeQuery(sql, [nombre]);
    return calificativa || null;
};

/**
 * ACTUALIZAR CALIFICATIVA
 */
const update = async (id, calificativaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    if (calificativaData.nombre !== undefined) {
        // Verificar que el nuevo nombre no exista
        const existing = await getByNombre(calificativaData.nombre);
        if (existing && existing.id_calificativa !== id) {
            throw new ConflictError(`La calificativa "${calificativaData.nombre}" ya existe`);
        }
        updates.push('nombre = ?');
        values.push(calificativaData.nombre);
    }

    if (calificativaData.activo !== undefined) {
        updates.push('activo = ?');
        values.push(calificativaData.activo);
    }

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE calificativa_delito 
    SET ${updates.join(', ')}
    WHERE id_calificativa = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ACTIVAR/DESACTIVAR CALIFICATIVA
 */
const toggleActivo = async (id) => {
    const calificativa = await getById(id);

    const sql = `
    UPDATE calificativa_delito 
    SET activo = ?
    WHERE id_calificativa = ?
  `;

    await executeQuery(sql, [!calificativa.activo, id]);
    return await getById(id);
};

/**
 * ELIMINAR CALIFICATIVA
 */
const remove = async (id) => {
    const calificativa = await getById(id);

    // Verificar si está en uso
    const usageCheck = `
    SELECT COUNT(*) as count 
    FROM cj_conducta 
    WHERE calificativa_id = ?
  `;
    const [usage] = await executeQuery(usageCheck, [id]);

    if (usage.count > 0) {
        throw new ConflictError(
            `No se puede eliminar la calificativa porque está en uso en ${usage.count} conducta(s). ` +
            `Puede desactivarla en su lugar.`
        );
    }

    const sql = `DELETE FROM calificativa_delito WHERE id_calificativa = ?`;
    await executeQuery(sql, [id]);

    return calificativa;
};

/**
 * CONTAR TOTAL
 */
const getCount = async (filters = {}) => {
    const { activo } = filters;

    let sql = `SELECT COUNT(*) as total FROM calificativa_delito WHERE 1=1`;
    const params = [];

    if (activo !== undefined) {
        sql += ` AND activo = ?`;
        params.push(activo);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

/**
 * ESTADÍSTICAS DE USO
 */
const getStatsUso = async () => {
    const sql = `
    SELECT 
      cal.id_calificativa,
      cal.nombre,
      cal.activo,
      COUNT(cc.id_conducta) as total_usos
    FROM calificativa_delito cal
    LEFT JOIN cj_conducta cc ON cal.id_calificativa = cc.calificativa_id
    GROUP BY cal.id_calificativa, cal.nombre, cal.activo
    ORDER BY total_usos DESC
  `;

    return await executeQuery(sql);
};

module.exports = {
    create,
    getAll,
    getActivas,
    getById,
    getByNombre,
    update,
    toggleActivo,
    remove,
    getCount,
    getStatsUso
};