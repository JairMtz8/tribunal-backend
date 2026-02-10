// src/models/conductaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CONDUCTA (Catálogo de Delitos)
 */

/**
 * OBTENER TODAS LAS CONDUCTAS
 */
const getAll = async (filters = {}) => {
    const { tipo_conducta, fuero_default, activo, search } = filters;

    let sql = `SELECT * FROM conducta WHERE 1=1`;
    const params = [];

    if (tipo_conducta) {
        sql += ` AND tipo_conducta = ?`;
        params.push(tipo_conducta);
    }

    if (fuero_default) {
        sql += ` AND fuero_default = ?`;
        params.push(fuero_default);
    }

    if (activo !== undefined) {
        sql += ` AND activo = ?`;
        params.push(activo);
    }

    if (search) {
        sql += ` AND (nombre LIKE ? OR descripcion LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY tipo_conducta, nombre`;

    return await executeQuery(sql, params);
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
 * CREAR CONDUCTA
 */
const create = async (conductaData) => {
    const { nombre, descripcion, tipo_conducta, fuero_default } = conductaData;

    // Verificar que no exista
    const existente = await getByNombre(nombre);
    if (existente) {
        throw new ConflictError(`La conducta "${nombre}" ya existe`);
    }

    const sql = `
    INSERT INTO conducta (nombre, descripcion, tipo_conducta, fuero_default)
    VALUES (?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        nombre,
        descripcion || null,
        tipo_conducta || 'Otras',
        fuero_default || 'Común'
    ]);

    return result.insertId;
};

/**
 * ACTUALIZAR CONDUCTA
 */
const update = async (id, conductaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = ['nombre', 'descripcion', 'tipo_conducta', 'fuero_default', 'activo'];

    campos.forEach(campo => {
        if (conductaData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(conductaData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `UPDATE conducta SET ${updates.join(', ')} WHERE id_conducta = ?`;
    await executeQuery(sql, values);

    return await getById(id);
};

/**
 * ELIMINAR (soft delete - marcar como inactivo)
 */
const remove = async (id) => {
    const conducta = await getById(id);

    // Verificar si está en uso
    const enUso = await isInUse(id);
    if (enUso) {
        throw new ConflictError(
            'No se puede eliminar la conducta porque está siendo utilizada en carpetas judiciales. ' +
            'Puede desactivarla en su lugar.'
        );
    }

    // Soft delete
    await executeQuery(`UPDATE conducta SET activo = FALSE WHERE id_conducta = ?`, [id]);

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
 * VERIFICAR SI ESTÁ EN USO
 */
const isInUse = async (id) => {
    const sql = `SELECT COUNT(*) as count FROM cj WHERE conducta_id = ?`;
    const [result] = await executeQuery(sql, [id]);
    return result.count > 0;
};

/**
 * OBTENER ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      tipo_conducta,
      COUNT(*) as total,
      SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activas,
      SUM(CASE WHEN fuero_default = 'Federal' THEN 1 ELSE 0 END) as federales,
      SUM(CASE WHEN fuero_default = 'Común' THEN 1 ELSE 0 END) as comunes
    FROM conducta
    GROUP BY tipo_conducta
  `;

    return await executeQuery(sql);
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getByNombre,
    isInUse,
    getStats
};