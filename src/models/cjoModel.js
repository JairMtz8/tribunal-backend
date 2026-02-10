// src/models/cjoModel.js

const { executeQuery, executeTransaction } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CJO (CARPETA JUICIO ORAL)
 *
 * Relación: 1:1 con CJ
 * Se crea cuando el proceso va a juicio oral
 */

/**
 * CREAR CJO
 * Valida que exista CJ y que no exista CJO ya
 */
const create = async (cjoData) => {
    const {
        numero_cjo,
        cj_id,
        fuero,
        fecha_ingreso,
        fecha_auto_apertura,
        sentencia,
        fecha_sentencia,
        monto_reparacion_dano,
        fecha_causo_estado,
        toca_apelacion,
        fecha_sentencia_enviada_ejecucion,
        juez_envia,
        juez_recibe,
        compurga_totalidad,
        representante_pp_nnya,
        tipo_representacion_pp_nnya
    } = cjoData;

    // Verificar que la CJ existe
    const cjCheck = `SELECT id_cj FROM cj WHERE id_cj = ?`;
    const [cj] = await executeQuery(cjCheck, [cj_id]);

    if (!cj) {
        throw new NotFoundError('La CJ especificada no existe');
    }

    // Verificar que no exista CJO para esta CJ
    const cjoExistente = `SELECT id_cjo FROM cjo WHERE cj_id = ?`;
    const [existe] = await executeQuery(cjoExistente, [cj_id]);

    if (existe) {
        throw new ConflictError('Ya existe una CJO para esta CJ');
    }

    // Ejecutar en transacción
    return await executeTransaction(async (connection) => {
        // 1. Crear CJO
        const sql = `
            INSERT INTO cjo (
                numero_cjo, cj_id, fuero, fecha_ingreso, fecha_auto_apertura,
                sentencia, fecha_sentencia, monto_reparacion_dano, fecha_causo_estado,
                toca_apelacion, fecha_sentencia_enviada_ejecucion,
                juez_envia, juez_recibe, compurga_totalidad,
                representante_pp_nnya, tipo_representacion_pp_nnya
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(sql, [
            numero_cjo,
            cj_id,
            fuero || null,
            fecha_ingreso || null,
            fecha_auto_apertura || null,
            sentencia || null,
            fecha_sentencia || null,
            monto_reparacion_dano || null,
            fecha_causo_estado || null,
            toca_apelacion || null,
            fecha_sentencia_enviada_ejecucion || null,
            juez_envia || null,
            juez_recibe || null,
            compurga_totalidad || false,
            representante_pp_nnya || null,
            tipo_representacion_pp_nnya || null
        ]);

        const cjo_id = result.insertId;

        // 2. Obtener proceso_id desde proceso_carpeta
        const procesoSql = `
            SELECT id_proceso FROM proceso_carpeta WHERE cj_id = ?
        `;
        const [procesoCarpeta] = await connection.execute(procesoSql, [cj_id]);

        if (!procesoCarpeta) {
            throw new Error('No se encontró el proceso asociado a la CJ');
        }

        // 3. Actualizar proceso_carpeta con CJO
        const updateSql = `
            UPDATE proceso_carpeta
            SET cjo_id = ?
            WHERE id_proceso = ?
        `;

        await connection.execute(updateSql, [cjo_id, procesoCarpeta.id_proceso]);

        // 4. Si la sentencia es CONDENATORIA o MIXTA, crear CEMS
        let cems_id = null;
        if (sentencia &&
            (sentencia.toLowerCase().includes('condenatoria') ||
                sentencia.toLowerCase().includes('mixta'))) {
            // Generar número de CEMS
            const numeroCems = `CEMS-${procesoCarpeta.id_proceso}-${Date.now()}`;

            const cemsSql = `
                INSERT INTO cems (numero_cems, cj_id, cjo_id)
                VALUES (?, ?, ?)
            `;

            const [cemsResult] = await connection.execute(cemsSql, [
                numeroCems,
                cj_id,
                cjo_id
            ]);

            cems_id = cemsResult.insertId;

            // Actualizar proceso_carpeta con CEMS
            await connection.execute(
                `UPDATE proceso_carpeta SET cems_id = ? WHERE id_proceso = ?`,
                [cems_id, procesoCarpeta.id_proceso]
            );
        }

        return {
            cjo_id,
            cems_creado: !!cems_id,
            cems_id
        };
    });
};

/**
 * OBTENER TODAS LAS CJO
 */
const getAll = async (filters = {}) => {
    const { fuero, sentencia } = filters;

    let sql = `
        SELECT
            cjo.*,
            cj.numero_cj
        FROM cjo
                 INNER JOIN cj ON cjo.cj_id = cj.id_cj
        WHERE 1=1
    `;
    const params = [];

    if (fuero) {
        sql += ` AND cjo.fuero = ?`;
        params.push(fuero);
    }

    if (sentencia) {
        sql += ` AND cjo.sentencia LIKE ?`;
        params.push(`%${sentencia}%`);
    }

    sql += ` ORDER BY cjo.fecha_ingreso DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
        SELECT
            cjo.*,
            cj.numero_cj,
            cj.tipo_fuero as cj_fuero
        FROM cjo
                 INNER JOIN cj ON cjo.cj_id = cj.id_cj
        WHERE cjo.id_cjo = ?
    `;

    const [cjo] = await executeQuery(sql, [id]);

    if (!cjo) {
        throw new NotFoundError('CJO no encontrada');
    }

    return cjo;
};

/**
 * OBTENER POR CJ_ID
 */
const getByCjId = async (cjId) => {
    const sql = `
        SELECT * FROM cjo WHERE cj_id = ?
    `;

    const [cjo] = await executeQuery(sql, [cjId]);
    return cjo || null;
};

/**
 * ACTUALIZAR CJO
 */
const update = async (id, cjoData) => {
    const cjoActual = await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'numero_cjo', 'fuero', 'fecha_ingreso', 'fecha_auto_apertura',
        'sentencia', 'fecha_sentencia', 'monto_reparacion_dano', 'fecha_causo_estado',
        'toca_apelacion', 'fecha_sentencia_enviada_ejecucion',
        'juez_envia', 'juez_recibe', 'compurga_totalidad',
        'representante_pp_nnya', 'tipo_representacion_pp_nnya'
    ];

    campos.forEach(campo => {
        if (cjoData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(cjoData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    // Si se está actualizando la sentencia a CONDENATORIA, crear CEMS
    return await executeTransaction(async (connection) => {
        // Actualizar CJO
        const sql = `UPDATE cjo SET ${updates.join(', ')} WHERE id_cjo = ?`;
        await connection.execute(sql, values);

        let cems_id = null;

        // Si la sentencia cambió a CONDENATORIA o MIXTA
        if (cjoData.sentencia &&
            (cjoData.sentencia.toLowerCase().includes('condenatoria') ||
                cjoData.sentencia.toLowerCase().includes('mixta')) &&
            (!cjoActual.sentencia ||
                (!cjoActual.sentencia.toLowerCase().includes('condenatoria') &&
                    !cjoActual.sentencia.toLowerCase().includes('mixta')))) {

            // Verificar si ya existe CEMS
            const cemsCheck = `
                SELECT cems_id FROM proceso_carpeta pc
                                        INNER JOIN cjo ON pc.cjo_id = cjo.id_cjo
                WHERE cjo.id_cjo = ?
            `;
            const [pc] = await connection.execute(cemsCheck, [id]);

            if (!pc.cems_id) {
                // Crear CEMS
                const procesoSql = `
                    SELECT id_proceso FROM proceso_carpeta WHERE cjo_id = ?
                `;
                const [proceso] = await connection.execute(procesoSql, [id]);

                const numeroCems = `CEMS-${proceso.id_proceso}-${Date.now()}`;

                const cemsSql = `
                    INSERT INTO cems (numero_cems, cj_id, cjo_id)
                    VALUES (?, ?, ?)
                `;

                const [cemsResult] = await connection.execute(cemsSql, [
                    numeroCems,
                    cjoActual.cj_id,
                    id
                ]);

                cems_id = cemsResult.insertId;

                // Actualizar proceso_carpeta
                await connection.execute(
                    `UPDATE proceso_carpeta SET cems_id = ? WHERE id_proceso = ?`,
                    [cems_id, proceso.id_proceso]
                );
            }
        }

        return {
            cjo: await getById(id),
            cems_creado: !!cems_id,
            cems_id
        };
    });
};

/**
 * ELIMINAR CJO
 */
const remove = async (id) => {
    const cjo = await getById(id);

    const sql = `DELETE FROM cjo WHERE id_cjo = ?`;
    await executeQuery(sql, [id]);

    return cjo;
};

/**
 * CONTAR CJO
 */
const getCount = async (filters = {}) => {
    const { fuero } = filters;

    let sql = `SELECT COUNT(*) as total FROM cjo WHERE 1=1`;
    const params = [];

    if (fuero) {
        sql += ` AND fuero = ?`;
        params.push(fuero);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

/**
 * ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN sentencia LIKE '%condenatoria%' THEN 1 ELSE 0 END) as condenatorias,
            SUM(CASE WHEN sentencia LIKE '%mixta%' THEN 1 ELSE 0 END) as mixtas,
            SUM(CASE WHEN sentencia LIKE '%absolutoria%' THEN 1 ELSE 0 END) as absolutorias,
            SUM(CASE WHEN sentencia IS NULL THEN 1 ELSE 0 END) as sin_sentencia,
            SUM(CASE WHEN sentencia LIKE '%condenatori%' OR sentencia LIKE '%mixta%' THEN 1 ELSE 0 END) as generan_cems,
            AVG(monto_reparacion_dano) as promedio_reparacion
        FROM cjo
    `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getAll,
    getById,
    getByCjId,
    update,
    remove,
    getCount,
    getStats
};