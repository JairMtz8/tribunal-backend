// src/models/procesoVictimaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errorHandler');

/**
 * MODELO DE PROCESO_VICTIMA
 *
 * Tabla puente M:N entre proceso y víctima
 * Un proceso puede tener múltiples víctimas
 * Una víctima puede estar en múltiples procesos
 */

/**
 * ASOCIAR VÍCTIMA A PROCESO
 */
const asociar = async (procesoId, victimaId) => {
    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [procesoId]);

    if (!proceso) {
        throw new NotFoundError('El proceso no existe');
    }

    // Verificar que la víctima existe
    const victimaCheck = `SELECT id_victima FROM victima WHERE id_victima = ?`;
    const [victima] = await executeQuery(victimaCheck, [victimaId]);

    if (!victima) {
        throw new NotFoundError('La víctima no existe');
    }

    // Verificar que no estén ya asociados
    const asociacionCheck = `
    SELECT * FROM proceso_victima 
    WHERE proceso_id = ? AND victima_id = ?
  `;
    const [asociacion] = await executeQuery(asociacionCheck, [procesoId, victimaId]);

    if (asociacion) {
        throw new ConflictError('La víctima ya está asociada a este proceso');
    }

    // Crear asociación
    const sql = `
    INSERT INTO proceso_victima (proceso_id, victima_id)
    VALUES (?, ?)
  `;

    await executeQuery(sql, [procesoId, victimaId]);

    return { procesoId, victimaId };
};

/**
 * DESASOCIAR VÍCTIMA DE PROCESO
 */
const desasociar = async (procesoId, victimaId) => {
    // Verificar que existe la asociación
    const asociacionCheck = `
    SELECT * FROM proceso_victima 
    WHERE proceso_id = ? AND victima_id = ?
  `;
    const [asociacion] = await executeQuery(asociacionCheck, [procesoId, victimaId]);

    if (!asociacion) {
        throw new NotFoundError('La víctima no está asociada a este proceso');
    }

    const sql = `
    DELETE FROM proceso_victima 
    WHERE proceso_id = ? AND victima_id = ?
  `;

    await executeQuery(sql, [procesoId, victimaId]);

    return { procesoId, victimaId };
};

/**
 * OBTENER VÍCTIMAS DE UN PROCESO
 */
const getVictimasByProceso = async (procesoId) => {
    const sql = `
    SELECT 
      v.*,
      pv.proceso_id
    FROM victima v
    INNER JOIN proceso_victima pv ON v.id_victima = pv.victima_id
    WHERE pv.proceso_id = ?
    ORDER BY v.nombre
  `;

    return await executeQuery(sql, [procesoId]);
};

/**
 * OBTENER PROCESOS DE UNA VÍCTIMA
 */
const getProcesosByVictima = async (victimaId) => {
    const sql = `
    SELECT 
      p.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM proceso p
    INNER JOIN proceso_victima pv ON p.id_proceso = pv.proceso_id
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE pv.victima_id = ?
    ORDER BY p.id_proceso DESC
  `;

    return await executeQuery(sql, [victimaId]);
};

/**
 * CONTAR VÍCTIMAS DE UN PROCESO
 */
const countVictimasByProceso = async (procesoId) => {
    const sql = `
    SELECT COUNT(*) as total 
    FROM proceso_victima 
    WHERE proceso_id = ?
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.total;
};

/**
 * VERIFICAR SI VÍCTIMA ESTÁ EN PROCESO
 */
const estaAsociada = async (procesoId, victimaId) => {
    const sql = `
    SELECT * FROM proceso_victima 
    WHERE proceso_id = ? AND victima_id = ?
  `;

    const [asociacion] = await executeQuery(sql, [procesoId, victimaId]);
    return !!asociacion;
};

/**
 * ASOCIAR MÚLTIPLES VÍCTIMAS A UN PROCESO
 */
const asociarMultiples = async (procesoId, victimasIds) => {
    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [procesoId]);

    if (!proceso) {
        throw new NotFoundError('El proceso no existe');
    }

    const resultados = [];

    for (const victimaId of victimasIds) {
        try {
            await asociar(procesoId, victimaId);
            resultados.push({ victimaId, status: 'asociada' });
        } catch (error) {
            resultados.push({
                victimaId,
                status: 'error',
                mensaje: error.message
            });
        }
    }

    return resultados;
};

module.exports = {
    asociar,
    desasociar,
    getVictimasByProceso,
    getProcesosByVictima,
    countVictimasByProceso,
    estaAsociada,
    asociarMultiples
};