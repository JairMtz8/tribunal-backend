// src/models/cjConductaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CJ_CONDUCTA
 *
 * Gestiona las conductas/delitos del adolescente en una CJ
 * Una CJ puede tener MÚLTIPLES conductas
 * Ahora incluye calificativas del delito
 */

/**
 * CREAR CONDUCTA DEL ADOLESCENTE
 */
const create = async (conductaData) => {
    const {
        cj_id,
        conducta_id,
        calificativa_id,
        especificacion_adicional,
        fecha_conducta
    } = conductaData;

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

    // Verificar que la calificativa existe
    if (calificativa_id) {
        const calificativaCheck = `
            SELECT id_calificativa, nombre 
            FROM calificativa_delito 
            WHERE id_calificativa = ?
        `;
        const [calificativa] = await executeQuery(calificativaCheck, [calificativa_id]);

        if (!calificativa) {
            throw new NotFoundError('La calificativa del catálogo no existe');
        }

        // Si calificativa es "Otro" (id: 8), validar que haya especificacion_adicional
        if (calificativa.nombre.toLowerCase() === 'otro' && !especificacion_adicional) {
            throw new BadRequestError(
                'Cuando la calificativa es "Otro", debe proporcionar especificacion_adicional'
            );
        }
    }

    const sql = `
        INSERT INTO cj_conducta (
            cj_id,
            conducta_id,
            calificativa_id,
            especificacion_adicional,
            fecha_conducta
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
        cj_id,
        conducta_id || null,
        calificativa_id || null,
        especificacion_adicional || null,
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
            c.fuero_default as conducta_fuero_default,
            c.descripcion as conducta_descripcion,
            cal.nombre as calificativa_nombre
        FROM cj_conducta cc
                 LEFT JOIN conducta c ON cc.conducta_id = c.id_conducta
                 LEFT JOIN calificativa_delito cal ON cc.calificativa_id = cal.id_calificativa
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
            calificativa_id: conducta.calificativa_id,
            especificacion_adicional: conducta.especificacion_adicional,
            fecha_conducta: conducta.fecha_conducta
        };

        // Si tiene conducta del catálogo, agregarla
        if (conducta.conducta_id) {
            result.conducta = {
                id: conducta.conducta_id,
                nombre: conducta.conducta_nombre,
                fuero_default: conducta.conducta_fuero_default,
                descripcion: conducta.conducta_descripcion
            };
        }

        // Si tiene calificativa, agregarla
        if (conducta.calificativa_id) {
            result.calificativa = {
                id: conducta.calificativa_id,
                nombre: conducta.calificativa_nombre
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
            c.fuero_default as conducta_fuero_default,
            c.descripcion as conducta_descripcion,
            cal.nombre as calificativa_nombre
        FROM cj_conducta cc
                 LEFT JOIN conducta c ON cc.conducta_id = c.id_conducta
                 LEFT JOIN calificativa_delito cal ON cc.calificativa_id = cal.id_calificativa
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
        calificativa_id: conducta.calificativa_id,
        especificacion_adicional: conducta.especificacion_adicional,
        fecha_conducta: conducta.fecha_conducta
    };

    if (conducta.conducta_id) {
        result.conducta = {
            id: conducta.conducta_id,
            nombre: conducta.conducta_nombre,
            fuero_default: conducta.conducta_fuero_default,
            descripcion: conducta.conducta_descripcion
        };
    }

    if (conducta.calificativa_id) {
        result.calificativa = {
            id: conducta.calificativa_id,
            nombre: conducta.calificativa_nombre
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

    if (conductaData.calificativa_id !== undefined) {
        // Verificar que la calificativa existe
        if (conductaData.calificativa_id) {
            const calificativaCheck = `
                SELECT id_calificativa, nombre 
                FROM calificativa_delito 
                WHERE id_calificativa = ?
            `;
            const [calificativa] = await executeQuery(calificativaCheck, [conductaData.calificativa_id]);

            if (!calificativa) {
                throw new NotFoundError('La calificativa del catálogo no existe');
            }

            // Si es "Otro", validar especificacion_adicional
            if (calificativa.nombre.toLowerCase() === 'otro' && !conductaData.especificacion_adicional) {
                throw new BadRequestError(
                    'Cuando la calificativa es "Otro", debe proporcionar especificacion_adicional'
                );
            }
        }
        updates.push('calificativa_id = ?');
        values.push(conductaData.calificativa_id);
    }

    if (conductaData.especificacion_adicional !== undefined) {
        updates.push('especificacion_adicional = ?');
        values.push(conductaData.especificacion_adicional);
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
 * OBTENER ESTADÍSTICAS DE CONDUCTAS POR CALIFICATIVA
 */
const getStats = async () => {
    const sql = `
        SELECT
            cal.nombre as calificativa,
            COUNT(*) as total
        FROM cj_conducta cc
                 INNER JOIN calificativa_delito cal ON cc.calificativa_id = cal.id_calificativa
        WHERE cc.calificativa_id IS NOT NULL
        GROUP BY cal.id_calificativa, cal.nombre
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
            COUNT(cc.id_conducta) as total_casos
        FROM cj_conducta cc
                 INNER JOIN conducta c ON cc.conducta_id = c.id_conducta
        GROUP BY c.id_conducta, c.nombre
        ORDER BY total_casos DESC
            LIMIT ?
    `;

    return await executeQuery(sql, [limit]);
};

/**
 * OBTENER ESTADÍSTICAS POR DELITO Y CALIFICATIVA
 */
const getStatsByDelitoCalificativa = async () => {
    const sql = `
        SELECT 
            c.nombre as delito,
            cal.nombre as calificativa,
            COUNT(*) as total
        FROM cj_conducta cc
        INNER JOIN conducta c ON cc.conducta_id = c.id_conducta
        INNER JOIN calificativa_delito cal ON cc.calificativa_id = cal.id_calificativa
        GROUP BY c.id_conducta, c.nombre, cal.id_calificativa, cal.nombre
        ORDER BY total DESC
        LIMIT 20
    `;

    return await executeQuery(sql);
};

module.exports = {
    create,
    getByCjId,
    getById,
    update,
    remove,
    countByCjId,
    getStats,
    getMasFrecuentes,
    getStatsByDelitoCalificativa
};