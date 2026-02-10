// src/models/actorJuridicoModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE ACTOR JURÍDICO
 *
 * Gestiona defensores, fiscales, jueces, asesores, etc.
 */

/**
 * CREAR ACTOR JURÍDICO
 */
const create = async (actorData) => {
    const { nombre, tipo } = actorData;

    // Verificar que no exista la combinación nombre + tipo
    const existente = await getByNombreYTipo(nombre, tipo);
    if (existente) {
        throw new ConflictError(
            `Ya existe un actor con nombre "${nombre}" y tipo "${tipo}"`
        );
    }

    const sql = `
    INSERT INTO actor_juridico (nombre, tipo)
    VALUES (?, ?)
  `;

    const result = await executeQuery(sql, [nombre, tipo]);

    return result.insertId;
};

/**
 * OBTENER TODOS LOS ACTORES
 */
const getAll = async (filters = {}) => {
    const { tipo, search } = filters;

    let sql = `SELECT * FROM actor_juridico WHERE 1=1`;
    const params = [];

    if (tipo) {
        sql += ` AND tipo = ?`;
        params.push(tipo);
    }

    if (search) {
        sql += ` AND nombre LIKE ?`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY tipo, nombre`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `SELECT * FROM actor_juridico WHERE id_actor = ?`;
    const [actor] = await executeQuery(sql, [id]);

    if (!actor) {
        throw new NotFoundError('Actor jurídico no encontrado');
    }

    return actor;
};

/**
 * OBTENER POR NOMBRE Y TIPO
 */
const getByNombreYTipo = async (nombre, tipo) => {
    const sql = `
    SELECT * FROM actor_juridico 
    WHERE nombre = ? AND tipo = ?
  `;
    const [actor] = await executeQuery(sql, [nombre, tipo]);
    return actor || null;
};

/**
 * ACTUALIZAR ACTOR
 */
const update = async (id, actorData) => {
    await getById(id);

    const updates = [];
    const values = [];

    if (actorData.nombre !== undefined) {
        updates.push('nombre = ?');
        values.push(actorData.nombre);
    }

    if (actorData.tipo !== undefined) {
        updates.push('tipo = ?');
        values.push(actorData.tipo);
    }

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    // Si se actualiza nombre o tipo, verificar que no exista ya
    if (actorData.nombre || actorData.tipo) {
        const nombreFinal = actorData.nombre || (await getById(id)).nombre;
        const tipoFinal = actorData.tipo || (await getById(id)).tipo;

        const existente = await getByNombreYTipo(nombreFinal, tipoFinal);
        if (existente && existente.id_actor !== id) {
            throw new ConflictError(
                `Ya existe un actor con nombre "${nombreFinal}" y tipo "${tipoFinal}"`
            );
        }
    }

    values.push(id);

    const sql = `
    UPDATE actor_juridico 
    SET ${updates.join(', ')}
    WHERE id_actor = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR ACTOR
 * Solo si no está asignado a ningún proceso
 */
const remove = async (id) => {
    const actor = await getById(id);

    // Verificar si está asignado a algún proceso
    const asignacionCheck = `
    SELECT COUNT(*) as count 
    FROM proceso_actor_juridico 
    WHERE actor_id = ?
  `;
    const [result] = await executeQuery(asignacionCheck, [id]);

    if (result.count > 0) {
        throw new ConflictError(
            `No se puede eliminar el actor porque está asignado a ${result.count} proceso(s). ` +
            `Primero debe desasignarlo de los procesos.`
        );
    }

    const sql = `DELETE FROM actor_juridico WHERE id_actor = ?`;
    await executeQuery(sql, [id]);

    return actor;
};

/**
 * VERIFICAR SI ESTÁ EN USO
 */
const isInUse = async (id) => {
    const sql = `
    SELECT COUNT(*) as count 
    FROM proceso_actor_juridico 
    WHERE actor_id = ?
  `;
    const [result] = await executeQuery(sql, [id]);
    return result.count > 0;
};

/**
 * CONTAR TOTAL
 */
const getCount = async (filters = {}) => {
    const { tipo } = filters;

    let sql = `SELECT COUNT(*) as total FROM actor_juridico WHERE 1=1`;
    const params = [];

    if (tipo) {
        sql += ` AND tipo = ?`;
        params.push(tipo);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

/**
 * OBTENER ESTADÍSTICAS POR TIPO
 */
const getStats = async () => {
    const sql = `
    SELECT 
      tipo,
      COUNT(*) as total
    FROM actor_juridico
    GROUP BY tipo
    ORDER BY total DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER ACTORES POR TIPO
 */
const getByTipo = async (tipo) => {
    const sql = `
    SELECT * FROM actor_juridico 
    WHERE tipo = ?
    ORDER BY nombre
  `;

    return await executeQuery(sql, [tipo]);
};

module.exports = {
    create,
    getAll,
    getById,
    getByNombreYTipo,
    update,
    remove,
    isInUse,
    getCount,
    getStats,
    getByTipo
};