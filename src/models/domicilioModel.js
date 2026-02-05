// src/models/domicilioModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError } = require('../utils/errorHandler');

/**
 * MODELO DE DOMICILIOS
 *
 * Maneja operaciones CRUD para la tabla domicilio
 */

/**
 * CREAR DOMICILIO
 */
const create = async (domicilioData) => {
    const { municipio, calle_numero, colonia, es_lugar_hechos } = domicilioData;

    const sql = `
        INSERT INTO domicilio (municipio, calle_numero, colonia, es_lugar_hechos)
        VALUES (?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
        municipio || null,
        calle_numero || null,
        colonia || null,
        es_lugar_hechos || false  // Por defecto es domicilio personal
    ]);

    return await getById(result.insertId);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `SELECT * FROM domicilio WHERE id_domicilio = ?`;
    const [domicilio] = await executeQuery(sql, [id]);

    if (!domicilio) {
        throw new NotFoundError('Domicilio no encontrado');
    }

    return domicilio;
};

/**
 * ACTUALIZAR DOMICILIO
 */
const update = async (id, domicilioData) => {
    // Verificar que existe
    await getById(id);

    const { municipio, calle_numero, colonia, es_lugar_hechos } = domicilioData;

    const sql = `
        UPDATE domicilio
        SET municipio = ?,
            calle_numero = ?,
            colonia = ?,
            es_lugar_hechos = ?
        WHERE id_domicilio = ?
    `;

    await executeQuery(sql, [
        municipio || null,
        calle_numero || null,
        colonia || null,
        es_lugar_hechos !== undefined ? es_lugar_hechos : false,
        id
    ]);

    return await getById(id);
};

/**
 * ELIMINAR DOMICILIO
 * Solo si no está siendo usado por ningún adolescente
 */
const remove = async (id) => {
    const domicilio = await getById(id);

    const sql = `DELETE FROM domicilio WHERE id_domicilio = ?`;
    await executeQuery(sql, [id]);

    return domicilio;
};

/**
 * VERIFICAR SI DOMICILIO ESTÁ EN USO
 */
const isInUse = async (id) => {
    const sql = `
        SELECT COUNT(*) as count
        FROM adolescente
        WHERE domicilio_id = ?
    `;

    const [result] = await executeQuery(sql, [id]);
    return result.count > 0;
};

/**
 * LISTAR TODOS LOS DOMICILIOS (con filtros)
 */
const getAll = async (filters = {}) => {
    const { es_lugar_hechos, search } = filters;

    let sql = `SELECT * FROM domicilio WHERE 1=1`;
    const params = [];

    // Filtrar por tipo
    if (es_lugar_hechos !== undefined) {
        sql += ` AND es_lugar_hechos = ?`;
        params.push(es_lugar_hechos);
    }

    // Búsqueda
    if (search) {
        sql += ` AND (municipio LIKE ? OR calle_numero LIKE ? OR colonia LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY id_domicilio DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER SOLO DOMICILIOS PERSONALES (adolescentes)
 */
const getDomiciliosPersonales = async () => {
    const sql = `SELECT * FROM domicilio WHERE es_lugar_hechos = FALSE`;
    return await executeQuery(sql);
};

/**
 * OBTENER SOLO LUGARES DE HECHOS
 */
const getLugaresHechos = async () => {
    const sql = `SELECT * FROM domicilio WHERE es_lugar_hechos = TRUE`;
    return await executeQuery(sql);
};

module.exports = {
    create,
    getById,
    update,
    remove,
    isInUse,
    getAll,
    getDomiciliosPersonales,
    getLugaresHechos
};