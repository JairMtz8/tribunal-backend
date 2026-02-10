// src/models/cjConductaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CJ_CONDUCTA
 *
 * Gestiona las conductas/delitos del adolescente en una CJ
 * Una CJ puede tener MÚLTIPLES conductas
 */

/**
 * CREAR CONDUCTA DEL ADOLESCENTE
 */
const create = async (conductaData) => {
    const { cj_id, conducta_id, texto_conducta, fecha_conducta } = conductaData;

    // Verificar que la CJ existe
    const cjCheck = `SELECT id_cj FROM cj WHERE id_cj = ?`;
    const [cj] = await executeQuery(cjCheck, [cj_id]);

    if (!cj) {
        throw new NotFoundError('La CJ especificada no existe');
    }

    // Verificar que la conducta del catálogo existe
    if (conducta_id) {
        const conductaCheck = `SELECT id_conducta FROM conducta WHERE id_conducta = ?`;
        const [conducta] = await executeQuery(conductaCheck, [conducta_id]);

        if (!conducta) {
            throw new NotFoundError('La conducta del catálogo no existe');
        }
    }

    const sql = `
    INSERT INTO cj_conducta (cj_id, conducta_id, texto_conducta, fecha_conducta)
    VALUES (?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        cj_id,
        conducta_id || null,
        texto_conducta || null,
        fecha_conducta || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS CONDUCTAS DE UNA CJ
 */
const getByCjId = async (cjId) => {
    const sql = `
    SELECT 
      cc.*,
      c.nombre as conducta_nombre,
      c.tipo_conducta,
      c.fuero_default as conducta_fuero_default,
      c.descripcion as conducta_descripcion
    FROM cj_conducta cc
    LEFT JOIN conducta c ON cc.conducta_id = c.id_conducta
    WHERE cc.cj_id = ?
    ORDER BY cc.fecha_conducta DESC, cc.id_conducta DESC
  `;

    const conductas = await executeQuery(sql, [cjId]);

    // Estructurar la respuesta
    return conductas.map(conducta => {
        const result = {
            id_conducta: conducta.id_conducta,
            cj_id: conducta.cj_id,
            conducta_id: conducta.conducta_id,
            texto_conducta: conducta.texto_conducta,
            fecha_conducta: conducta.fecha_conducta
        };

        // Si tiene conducta del catálogo, agregarla
        if (conducta.conducta_id) {
            result.conducta = {
                id: conducta.conducta_id,
                nombre: conducta.conducta_nombre,
                tipo: conducta.tipo_conducta,
                fuero_default: conducta.conducta_fuero_default,
                descripcion: conducta.conducta_descripcion
            };
        }

        return result;
    });
};

/**
 * OBTENER CONDUCTA POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      cc.*,
      c.nombre as conducta_nombre,
      c.tipo_conducta,
      c.fuero_default as conducta_fuero_default,
      c.descripcion as conducta_descripcion
    FROM cj_conducta cc
    LEFT JOIN conducta c ON cc.conducta_id = c.id_conducta
    WHERE cc.id_conducta = ?
  `;

    const [conducta] = await executeQuery(sql, [id]);

    if (!conducta) {
        throw new NotFoundError('Conducta del adolescente no encontrada');
    }

    const result = {
        id_conducta: conducta.id_conducta,
        cj_id: conducta.cj_id,
        conducta_id: conducta.conducta_id,
        texto_conducta: conducta.texto_conducta,
        fecha_conducta: conducta.fecha_conducta
    };

    if (conducta.conducta_id) {
        result.conducta = {
            id: conducta.conducta_id,
            nombre: conducta.conducta_nombre,
            tipo: conducta.tipo_conducta,
            fuero_default: conducta.conducta_fuero_default,
            descripcion: conducta.conducta_descripcion
        };
    }

    return result;
};

/**
 * ACTUALIZAR CONDUCTA
 */
const update = async (id, conductaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    if (conductaData.conducta_id !== undefined) {
        // Verificar que la conducta existe
        if (conductaData.conducta_id) {
            const conductaCheck = `SELECT id_conducta FROM conducta WHERE id_conducta = ?`;
            const [conducta] = await executeQuery(conductaCheck, [conductaData.conducta_id]);

            if (!conducta) {
                throw new NotFoundError('La conducta del catálogo no existe');
            }
        }
        updates.push('conducta_id = ?');
        values.push(conductaData.conducta_id);
    }

    if (conductaData.texto_conducta !== undefined) {
        updates.push('texto_conducta = ?');
        values.push(conductaData.texto_conducta);
    }

    if (conductaData.fecha_conducta !== undefined) {
        updates.push('fecha_conducta = ?');
        values.push(conductaData.fecha_conducta);
    }

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE cj_conducta 
    SET ${updates.join(', ')}
    WHERE id_conducta = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR CONDUCTA
 */
const remove = async (id) => {
    const conducta = await getById(id);

    const sql = `DELETE FROM cj_conducta WHERE id_conducta = ?`;
    await executeQuery(sql, [id]);

    return conducta;
};

/**
 * CONTAR CONDUCTAS DE UNA CJ
 */
const countByCjId = async (cjId) => {
    const sql = `SELECT COUNT(*) as total FROM cj_conducta WHERE cj_id = ?`;
    const [result] = await executeQuery(sql, [cjId]);
    return result.total;
};

/**
 * OBTENER ESTADÍSTICAS DE CONDUCTAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      c.tipo_conducta,
      COUNT(*) as total
    FROM cj_conducta cc
    INNER JOIN conducta c ON cc.conducta_id = c.id_conducta
    WHERE cc.conducta_id IS NOT NULL
    GROUP BY c.tipo_conducta
    ORDER BY total DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER CONDUCTAS MÁS FRECUENTES
 */
const getMasFrecuentes = async (limit = 10) => {
    const sql = `
    SELECT 
      c.id_conducta,
      c.nombre,
      c.tipo_conducta,
      COUNT(cc.id_conducta) as total_casos
    FROM cj_conducta cc
    INNER JOIN conducta c ON cc.conducta_id = c.id_conducta
    GROUP BY c.id_conducta, c.nombre, c.tipo_conducta
    ORDER BY total_casos DESC
    LIMIT ?
  `;

    return await executeQuery(sql, [limit]);
};

module.exports = {
    create,
    getByCjId,
    getById,
    update,
    remove,
    countByCjId,
    getStats,
    getMasFrecuentes
};