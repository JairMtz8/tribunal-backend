// src/models/catalogoConductaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CONDUCTA (CATÁLOGO)
 *
 * Catálogo de delitos/conductas base
 * Ejemplos: Homicidio, Robo, Lesiones, etc.
 */

/**
 * CREAR CONDUCTA
 */
const create = async (conductaData) => {
    const { nombre, descripcion, fuero_default, activo } = conductaData;

    // Verificar que el nombre no exista
    const checkSql = `SELECT id_conducta FROM conducta WHERE nombre = ?`;
    const [existing] = await executeQuery(checkSql, [nombre]);

    if (existing) {
        throw new ConflictError(`La conducta "${nombre}" ya existe`);
    }

    const sql = `
    INSERT INTO conducta (nombre, descripcion, fuero_default, activo)
    VALUES (?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        nombre,
        descripcion || null,
        fuero_default || 'Común',
        activo !== undefined ? activo : true
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS CONDUCTAS
 */
const getAll = async (filters = {}) => {
    const { activo, fuero_default, search } = filters;

    let sql = `SELECT * FROM conducta WHERE 1=1`;
    const params = [];

    if (activo !== undefined) {
        sql += ` AND activo = ?`;
        params.push(activo);
    }

    if (fuero_default) {
        sql += ` AND fuero_default = ?`;
        params.push(fuero_default);
    }

    if (search) {
        sql += ` AND (nombre LIKE ? OR descripcion LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY nombre ASC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER SOLO ACTIVAS
 */
const getActivas = async () => {
    const sql = `
    SELECT * FROM conducta 
    WHERE activo = TRUE 
    ORDER BY nombre ASC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `SELECT * FROM conducta WHERE id_conducta = ?`;
    const [conducta] = await executeQuery(sql, [id]);

    if (!conducta) {
        throw new NotFoundError('Conducta no encontrada');
    }

    return conducta;
};

/**
 * OBTENER POR NOMBRE
 */
const getByNombre = async (nombre) => {
    const sql = `SELECT * FROM conducta WHERE nombre = ?`;
    const [conducta] = await executeQuery(sql, [nombre]);
    return conducta || null;
};

/**
 * ACTUALIZAR CONDUCTA
 */
const update = async (id, conductaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    if (conductaData.nombre !== undefined) {
        // Verificar que el nuevo nombre no exista
        const existing = await getByNombre(conductaData.nombre);
        if (existing && existing.id_conducta !== id) {
            throw new ConflictError(`La conducta "${conductaData.nombre}" ya existe`);
        }
        updates.push('nombre = ?');
        values.push(conductaData.nombre);
    }

    if (conductaData.descripcion !== undefined) {
        updates.push('descripcion = ?');
        values.push(conductaData.descripcion);
    }

    if (conductaData.fuero_default !== undefined) {
        updates.push('fuero_default = ?');
        values.push(conductaData.fuero_default);
    }

    if (conductaData.activo !== undefined) {
        updates.push('activo = ?');
        values.push(conductaData.activo);
    }

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE conducta 
    SET ${updates.join(', ')}
    WHERE id_conducta = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ACTIVAR/DESACTIVAR CONDUCTA
 */
const toggleActivo = async (id) => {
    const conducta = await getById(id);

    const sql = `
    UPDATE conducta 
    SET activo = ?
    WHERE id_conducta = ?
  `;

    await executeQuery(sql, [!conducta.activo, id]);
    return await getById(id);
};

/**
 * ELIMINAR CONDUCTA
 */
const remove = async (id) => {
    const conducta = await getById(id);

    // Verificar si está en uso
    const usageCheck = `
    SELECT COUNT(*) as count 
    FROM cj_conducta 
    WHERE conducta_id = ?
  `;
    const [usage] = await executeQuery(usageCheck, [id]);

    if (usage.count > 0) {
        throw new ConflictError(
            `No se puede eliminar la conducta porque está en uso en ${usage.count} caso(s). ` +
            `Puede desactivarla en su lugar.`
        );
    }

    const sql = `DELETE FROM conducta WHERE id_conducta = ?`;
    await executeQuery(sql, [id]);

    return conducta;
};

/**
 * CONTAR TOTAL
 */
const getCount = async (filters = {}) => {
    const { activo, fuero_default } = filters;

    let sql = `SELECT COUNT(*) as total FROM conducta WHERE 1=1`;
    const params = [];

    if (activo !== undefined) {
        sql += ` AND activo = ?`;
        params.push(activo);
    }

    if (fuero_default) {
        sql += ` AND fuero_default = ?`;
        params.push(fuero_default);
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
      c.id_conducta,
      c.nombre,
      c.fuero_default,
      c.activo,
      COUNT(cc.id_conducta) as total_casos
    FROM conducta c
    LEFT JOIN cj_conducta cc ON c.id_conducta = cc.conducta_id
    GROUP BY c.id_conducta, c.nombre, c.fuero_default, c.activo
    ORDER BY total_casos DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER POR FUERO
 */
const getByFuero = async (fuero) => {
    const sql = `
    SELECT * FROM conducta 
    WHERE fuero_default = ? AND activo = TRUE
    ORDER BY nombre ASC
  `;

    return await executeQuery(sql, [fuero]);
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
    getStatsUso,
    getByFuero
};