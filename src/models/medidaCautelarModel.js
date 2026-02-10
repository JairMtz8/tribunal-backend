// src/models/medidaCautelarModel.js

const { executeQuery, executeTransaction } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE MEDIDA CAUTELAR
 *
 * LÓGICA ESPECIAL:
 * Si tipo_medida_cautelar.genera_cemci = true
 * → Auto-crear CEMCI para el proceso
 */

/**
 * CREAR MEDIDA CAUTELAR
 * Con lógica de auto-creación de CEMCI
 */
const create = async (medidaData) => {
    const {
        proceso_id,
        tipo_medida_cautelar_id,
        fecha_medida_cautelar,
        observaciones
    } = medidaData;

    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso no existe');
    }

    // Verificar que el tipo de medida existe y obtener si genera CEMCI
    const tipoCheck = `
    SELECT * FROM tipo_medida_cautelar 
    WHERE id_tipo_medida_cautelar = ?
  `;
    const [tipoMedida] = await executeQuery(tipoCheck, [tipo_medida_cautelar_id]);

    if (!tipoMedida) {
        throw new NotFoundError('El tipo de medida cautelar no existe');
    }

    // Verificar que el proceso tenga CJ (necesario para CEMCI)
    const cjCheck = `
    SELECT cj_id FROM proceso_carpeta 
    WHERE id_proceso = ?
  `;
    const [procesoCarpeta] = await executeQuery(cjCheck, [proceso_id]);

    if (!procesoCarpeta || !procesoCarpeta.cj_id) {
        throw new BadRequestError('El proceso debe tener una CJ antes de aplicar medidas cautelares');
    }

    const cj_id = procesoCarpeta.cj_id;

    // Ejecutar en transacción
    return await executeTransaction(async (connection) => {
        // 1. Crear la medida cautelar
        const medidaSql = `
      INSERT INTO medida_cautelar (
        proceso_id, 
        tipo_medida_cautelar_id, 
        fecha_medida_cautelar,
        observaciones
      ) VALUES (?, ?, ?, ?)
    `;

        const [medidaResult] = await connection.execute(medidaSql, [
            proceso_id,
            tipo_medida_cautelar_id,
            fecha_medida_cautelar,
            observaciones || null
        ]);

        const medida_id = medidaResult.insertId;

        // 2. Si el tipo genera CEMCI, crearlo automáticamente
        let cemci_id = null;
        if (tipoMedida.genera_cemci) {
            // Verificar si ya existe CEMCI para este proceso
            const cemciExistente = `
        SELECT cemci_id FROM proceso_carpeta 
        WHERE id_proceso = ?
      `;
            const [procesoCarpetaActual] = await connection.execute(cemciExistente, [proceso_id]);

            if (!procesoCarpetaActual.cemci_id) {
                // Generar número de CEMCI
                const numeroCemci = `CEMCI-${proceso_id}-${Date.now()}`;

                // Crear CEMCI
                const cemciSql = `
          INSERT INTO cemci (numero_cemci, cj_id)
          VALUES (?, ?)
        `;

                const [cemciResult] = await connection.execute(cemciSql, [
                    numeroCemci,
                    cj_id
                ]);

                cemci_id = cemciResult.insertId;

                // Actualizar proceso_carpeta con el CEMCI
                const updateProcesoCarpeta = `
          UPDATE proceso_carpeta 
          SET cemci_id = ?
          WHERE id_proceso = ?
        `;

                await connection.execute(updateProcesoCarpeta, [cemci_id, proceso_id]);
            } else {
                cemci_id = procesoCarpetaActual.cemci_id;
            }
        }

        return {
            medida_id,
            cemci_id,
            genera_cemci: tipoMedida.genera_cemci
        };
    });
};

/**
 * OBTENER TODAS LAS MEDIDAS DE UN PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT 
      mc.*,
      tmc.nombre as tipo_nombre,
      tmc.genera_cemci
    FROM medida_cautelar mc
    INNER JOIN tipo_medida_cautelar tmc 
      ON mc.tipo_medida_cautelar_id = tmc.id_tipo_medida_cautelar
    WHERE mc.proceso_id = ?
    ORDER BY mc.fecha_medida_cautelar DESC
  `;

    return await executeQuery(sql, [procesoId]);
};

/**
 * OBTENER MEDIDA POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      mc.*,
      tmc.nombre as tipo_nombre,
      tmc.genera_cemci
    FROM medida_cautelar mc
    INNER JOIN tipo_medida_cautelar tmc 
      ON mc.tipo_medida_cautelar_id = tmc.id_tipo_medida_cautelar
    WHERE mc.id_medida_cautelar = ?
  `;

    const [medida] = await executeQuery(sql, [id]);

    if (!medida) {
        throw new NotFoundError('Medida cautelar no encontrada');
    }

    return medida;
};

/**
 * ACTUALIZAR MEDIDA CAUTELAR
 */
const update = async (id, medidaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'tipo_medida_cautelar_id',
        'fecha_medida_cautelar',
        'revocacion_medida',
        'fecha_revocacion_medida',
        'observaciones'
    ];

    campos.forEach(campo => {
        if (medidaData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(medidaData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE medida_cautelar 
    SET ${updates.join(', ')}
    WHERE id_medida_cautelar = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * REVOCAR MEDIDA CAUTELAR
 */
const revocar = async (id, fechaRevocacion) => {
    const medida = await getById(id);

    if (medida.revocacion_medida) {
        throw new ConflictError('La medida ya está revocada');
    }

    const sql = `
    UPDATE medida_cautelar 
    SET revocacion_medida = TRUE,
        fecha_revocacion_medida = ?
    WHERE id_medida_cautelar = ?
  `;

    await executeQuery(sql, [fechaRevocacion || new Date(), id]);
    return await getById(id);
};

/**
 * ELIMINAR MEDIDA CAUTELAR
 */
const remove = async (id) => {
    const medida = await getById(id);

    const sql = `DELETE FROM medida_cautelar WHERE id_medida_cautelar = ?`;
    await executeQuery(sql, [id]);

    return medida;
};

/**
 * VERIFICAR SI PROCESO TIENE MEDIDAS PRIVATIVAS
 */
const tieneMedidasPrivativas = async (procesoId) => {
    const sql = `
    SELECT COUNT(*) as count
    FROM medida_cautelar mc
    INNER JOIN tipo_medida_cautelar tmc 
      ON mc.tipo_medida_cautelar_id = tmc.id_tipo_medida_cautelar
    WHERE mc.proceso_id = ?
      AND tmc.genera_cemci = TRUE
      AND mc.revocacion_medida = FALSE
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.count > 0;
};

/**
 * CONTAR MEDIDAS DE UN PROCESO
 */
const countByProceso = async (procesoId) => {
    const sql = `
    SELECT COUNT(*) as total 
    FROM medida_cautelar 
    WHERE proceso_id = ?
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.total;
};

/**
 * OBTENER MEDIDAS ACTIVAS (NO REVOCADAS)
 */
const getMedidasActivas = async (procesoId) => {
    const sql = `
    SELECT 
      mc.*,
      tmc.nombre as tipo_nombre,
      tmc.genera_cemci
    FROM medida_cautelar mc
    INNER JOIN tipo_medida_cautelar tmc 
      ON mc.tipo_medida_cautelar_id = tmc.id_tipo_medida_cautelar
    WHERE mc.proceso_id = ?
      AND mc.revocacion_medida = FALSE
    ORDER BY mc.fecha_medida_cautelar DESC
  `;

    return await executeQuery(sql, [procesoId]);
};

/**
 * OBTENER ESTADÍSTICAS GENERALES
 */
const getStats = async () => {
    const sql = `
    SELECT 
      tmc.nombre as tipo,
      COUNT(*) as total,
      SUM(CASE WHEN mc.revocacion_medida = FALSE THEN 1 ELSE 0 END) as activas,
      SUM(CASE WHEN mc.revocacion_medida = TRUE THEN 1 ELSE 0 END) as revocadas,
      SUM(CASE WHEN tmc.genera_cemci = TRUE THEN 1 ELSE 0 END) as privativas
    FROM medida_cautelar mc
    INNER JOIN tipo_medida_cautelar tmc 
      ON mc.tipo_medida_cautelar_id = tmc.id_tipo_medida_cautelar
    GROUP BY tmc.nombre
    ORDER BY total DESC
  `;

    return await executeQuery(sql);
};

module.exports = {
    create,
    getByProcesoId,
    getById,
    update,
    revocar,
    remove,
    tieneMedidasPrivativas,
    countByProceso,
    getMedidasActivas,
    getStats
};