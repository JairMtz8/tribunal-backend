// src/models/victimaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE VÍCTIMA
 *
 * Gestiona las víctimas del delito
 */

/**
 * CREAR VÍCTIMA
 */
const create = async (victimaData) => {
    const { nombre, iniciales, sexo, edad, es_menor } = victimaData;

    const sql = `
    INSERT INTO victima (nombre, iniciales, sexo, edad, es_menor)
    VALUES (?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        nombre,
        iniciales || null,
        sexo || 'N/A',
        edad || null,
        es_menor !== undefined ? es_menor : false
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS VÍCTIMAS
 */
const getAll = async (filters = {}) => {
    const { sexo, es_menor, search } = filters;

    let sql = `SELECT * FROM victima WHERE 1=1`;
    const params = [];

    if (sexo) {
        sql += ` AND sexo = ?`;
        params.push(sexo);
    }

    if (es_menor !== undefined) {
        sql += ` AND es_menor = ?`;
        params.push(es_menor);
    }

    if (search) {
        sql += ` AND (nombre LIKE ? OR iniciales LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY nombre`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `SELECT * FROM victima WHERE id_victima = ?`;
    const [victima] = await executeQuery(sql, [id]);

    if (!victima) {
        throw new NotFoundError('Víctima no encontrada');
    }

    return victima;
};

/**
 * ACTUALIZAR VÍCTIMA
 */
const update = async (id, victimaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = ['nombre', 'iniciales', 'sexo', 'edad', 'es_menor'];

    campos.forEach(campo => {
        if (victimaData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(victimaData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE victima 
    SET ${updates.join(', ')}
    WHERE id_victima = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR VÍCTIMA
 * Solo si no está asociada a ningún proceso
 */
const remove = async (id) => {
    const victima = await getById(id);

    // Verificar si está asociada a algún proceso
    const procesoCheck = `SELECT COUNT(*) as count FROM proceso_victima WHERE victima_id = ?`;
    const [result] = await executeQuery(procesoCheck, [id]);

    if (result.count > 0) {
        throw new ConflictError(
            `No se puede eliminar la víctima porque está asociada a ${result.count} proceso(s). ` +
            `Primero debe desasociarla de los procesos.`
        );
    }

    const sql = `DELETE FROM victima WHERE id_victima = ?`;
    await executeQuery(sql, [id]);

    return victima;
};

/**
 * VERIFICAR SI ESTÁ EN USO
 */
const isInUse = async (id) => {
    const sql = `SELECT COUNT(*) as count FROM proceso_victima WHERE victima_id = ?`;
    const [result] = await executeQuery(sql, [id]);
    return result.count > 0;
};

/**
 * CONTAR TOTAL DE VÍCTIMAS
 */
const getCount = async (filters = {}) => {
    const { sexo, es_menor } = filters;

    let sql = `SELECT COUNT(*) as total FROM victima WHERE 1=1`;
    const params = [];

    if (sexo) {
        sql += ` AND sexo = ?`;
        params.push(sexo);
    }

    if (es_menor !== undefined) {
        sql += ` AND es_menor = ?`;
        params.push(es_menor);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

/**
 * OBTENER ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN sexo = 'Hombre' THEN 1 ELSE 0 END) as hombres,
      SUM(CASE WHEN sexo = 'Mujer' THEN 1 ELSE 0 END) as mujeres,
      SUM(CASE WHEN es_menor = TRUE THEN 1 ELSE 0 END) as menores,
      SUM(CASE WHEN es_menor = FALSE THEN 1 ELSE 0 END) as mayores
    FROM victima
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    isInUse,
    getCount,
    getStats
};