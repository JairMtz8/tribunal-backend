// src/models/procesoActorModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errorHandler');

/**
 * MODELO DE PROCESO_ACTOR_JURIDICO
 *
 * Tabla puente M:N entre proceso y actores jurídicos
 * IMPORTANTE: La asignación es por TIPO DE CARPETA (CJ, CJO, CEMCI, CEMS)
 *
 * Un proceso puede tener:
 * - Defensor para CJ
 * - Defensor diferente para CJO
 * - Fiscal para CJ
 * - Fiscal diferente para CEMCI
 * etc.
 */

/**
 * ASIGNAR ACTOR A PROCESO (por carpeta)
 */
const asignar = async (procesoId, tipoCarpeta, actorId) => {
    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [procesoId]);

    if (!proceso) {
        throw new NotFoundError('El proceso no existe');
    }

    // Verificar que el actor existe
    const actorCheck = `SELECT * FROM actor_juridico WHERE id_actor = ?`;
    const [actor] = await executeQuery(actorCheck, [actorId]);

    if (!actor) {
        throw new NotFoundError('El actor jurídico no existe');
    }

    // Verificar que no esté ya asignado
    const asignacionCheck = `
    SELECT * FROM proceso_actor_juridico 
    WHERE proceso_id = ? AND tipo_carpeta = ? AND actor_id = ?
  `;
    const [asignacion] = await executeQuery(asignacionCheck, [procesoId, tipoCarpeta, actorId]);

    if (asignacion) {
        throw new ConflictError(
            `El actor ya está asignado a este proceso en la carpeta ${tipoCarpeta}`
        );
    }

    // Crear asignación
    const sql = `
    INSERT INTO proceso_actor_juridico (proceso_id, tipo_carpeta, actor_id)
    VALUES (?, ?, ?)
  `;

    await executeQuery(sql, [procesoId, tipoCarpeta, actorId]);

    return { procesoId, tipoCarpeta, actorId, actor };
};

/**
 * DESASIGNAR ACTOR DE PROCESO
 */
const desasignar = async (procesoId, tipoCarpeta, actorId) => {
    // Verificar que existe la asignación
    const asignacionCheck = `
    SELECT * FROM proceso_actor_juridico 
    WHERE proceso_id = ? AND tipo_carpeta = ? AND actor_id = ?
  `;
    const [asignacion] = await executeQuery(asignacionCheck, [procesoId, tipoCarpeta, actorId]);

    if (!asignacion) {
        throw new NotFoundError(
            `El actor no está asignado a este proceso en la carpeta ${tipoCarpeta}`
        );
    }

    const sql = `
    DELETE FROM proceso_actor_juridico 
    WHERE proceso_id = ? AND tipo_carpeta = ? AND actor_id = ?
  `;

    await executeQuery(sql, [procesoId, tipoCarpeta, actorId]);

    return { procesoId, tipoCarpeta, actorId };
};

/**
 * OBTENER ACTORES DE UN PROCESO (todas las carpetas)
 */
const getActoresByProceso = async (procesoId) => {
    const sql = `
    SELECT 
      a.*,
      paj.tipo_carpeta
    FROM actor_juridico a
    INNER JOIN proceso_actor_juridico paj ON a.id_actor = paj.actor_id
    WHERE paj.proceso_id = ?
    ORDER BY paj.tipo_carpeta, a.tipo, a.nombre
  `;

    return await executeQuery(sql, [procesoId]);
};

/**
 * OBTENER ACTORES DE UN PROCESO POR CARPETA ESPECÍFICA
 */
const getActoresByProcesoCarpeta = async (procesoId, tipoCarpeta) => {
    const sql = `
    SELECT 
      a.*,
      paj.tipo_carpeta
    FROM actor_juridico a
    INNER JOIN proceso_actor_juridico paj ON a.id_actor = paj.actor_id
    WHERE paj.proceso_id = ? AND paj.tipo_carpeta = ?
    ORDER BY a.tipo, a.nombre
  `;

    return await executeQuery(sql, [procesoId, tipoCarpeta]);
};

/**
 * OBTENER ACTORES POR TIPO (ej: todos los defensores de un proceso)
 */
const getActoresByProcesoTipo = async (procesoId, tipoActor) => {
    const sql = `
    SELECT 
      a.*,
      paj.tipo_carpeta
    FROM actor_juridico a
    INNER JOIN proceso_actor_juridico paj ON a.id_actor = paj.actor_id
    WHERE paj.proceso_id = ? AND a.tipo = ?
    ORDER BY paj.tipo_carpeta, a.nombre
  `;

    return await executeQuery(sql, [procesoId, tipoActor]);
};

/**
 * OBTENER PROCESOS DE UN ACTOR
 */
const getProcesosByActor = async (actorId) => {
    const sql = `
    SELECT 
      p.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      paj.tipo_carpeta
    FROM proceso p
    INNER JOIN proceso_actor_juridico paj ON p.id_proceso = paj.proceso_id
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE paj.actor_id = ?
    ORDER BY p.id_proceso DESC, paj.tipo_carpeta
  `;

    return await executeQuery(sql, [actorId]);
};

/**
 * VERIFICAR SI ACTOR ESTÁ EN PROCESO/CARPETA
 */
const estaAsignado = async (procesoId, tipoCarpeta, actorId) => {
    const sql = `
    SELECT * FROM proceso_actor_juridico 
    WHERE proceso_id = ? AND tipo_carpeta = ? AND actor_id = ?
  `;

    const [asignacion] = await executeQuery(sql, [procesoId, tipoCarpeta, actorId]);
    return !!asignacion;
};

/**
 * CONTAR ACTORES DE UN PROCESO
 */
const countActoresByProceso = async (procesoId) => {
    const sql = `
    SELECT COUNT(*) as total 
    FROM proceso_actor_juridico 
    WHERE proceso_id = ?
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.total;
};

/**
 * OBTENER ACTORES AGRUPADOS POR CARPETA
 */
const getActoresAgrupadosPorCarpeta = async (procesoId) => {
    const sql = `
    SELECT 
      paj.tipo_carpeta,
      a.id_actor,
      a.nombre,
      a.tipo
    FROM proceso_actor_juridico paj
    INNER JOIN actor_juridico a ON paj.actor_id = a.id_actor
    WHERE paj.proceso_id = ?
    ORDER BY paj.tipo_carpeta, a.tipo, a.nombre
  `;

    const actores = await executeQuery(sql, [procesoId]);

    // Agrupar por carpeta
    const agrupados = {
        CJ: [],
        CJO: [],
        CEMCI: [],
        CEMS: []
    };

    actores.forEach(actor => {
        agrupados[actor.tipo_carpeta].push({
            id_actor: actor.id_actor,
            nombre: actor.nombre,
            tipo: actor.tipo
        });
    });

    return agrupados;
};

/**
 * REASIGNAR ACTOR (cambiar de carpeta o reemplazar)
 */
const reasignar = async (procesoId, tipoCarpetaOrigen, actorIdOrigen, tipoCarpetaDestino, actorIdDestino) => {
    // Desasignar del origen
    await desasignar(procesoId, tipoCarpetaOrigen, actorIdOrigen);

    // Asignar al destino
    return await asignar(procesoId, tipoCarpetaDestino, actorIdDestino);
};

/**
 * ASIGNAR MÚLTIPLES ACTORES A UNA CARPETA
 */
const asignarMultiples = async (procesoId, tipoCarpeta, actoresIds) => {
    const resultados = [];

    for (const actorId of actoresIds) {
        try {
            const resultado = await asignar(procesoId, tipoCarpeta, actorId);
            resultados.push({
                actorId,
                status: 'asignado',
                actor: resultado.actor
            });
        } catch (error) {
            resultados.push({
                actorId,
                status: 'error',
                mensaje: error.message
            });
        }
    }

    return resultados;
};

module.exports = {
    asignar,
    desasignar,
    getActoresByProceso,
    getActoresByProcesoCarpeta,
    getActoresByProcesoTipo,
    getProcesosByActor,
    estaAsignado,
    countActoresByProceso,
    getActoresAgrupadosPorCarpeta,
    reasignar,
    asignarMultiples
};