// src/models/audienciaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE AUDIENCIA
 *
 * Gestiona audiencias por proceso
 * Pueden estar asociadas a diferentes carpetas (CJ, CJO, CEMCI, CEMS)
 */

/**
 * CREAR AUDIENCIA
 */
const create = async (audienciaData) => {
    const {
        proceso_id,
        cj_id,
        cjo_id,
        cemci_id,
        cems_id,
        fecha_audiencia,
        tipo,
        observaciones
    } = audienciaData;

    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que al menos una carpeta está especificada
    if (!cj_id && !cjo_id && !cemci_id && !cems_id) {
        throw new BadRequestError(
            'Debe especificar al menos una carpeta (cj_id, cjo_id, cemci_id o cems_id)'
        );
    }

    const sql = `
    INSERT INTO audiencia (
      proceso_id, cj_id, cjo_id, cemci_id, cems_id,
      fecha_audiencia, tipo, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        proceso_id,
        cj_id || null,
        cjo_id || null,
        cemci_id || null,
        cems_id || null,
        fecha_audiencia,
        tipo || null,
        observaciones || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODAS LAS AUDIENCIAS
 */
const getAll = async (filters = {}) => {
    const { tipo, fecha_desde, fecha_hasta } = filters;

    let sql = `
    SELECT 
      aud.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM audiencia aud
    INNER JOIN proceso p ON aud.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE 1=1
  `;
    const params = [];

    if (tipo) {
        sql += ` AND aud.tipo LIKE ?`;
        params.push(`%${tipo}%`);
    }

    if (fecha_desde) {
        sql += ` AND aud.fecha_audiencia >= ?`;
        params.push(fecha_desde);
    }

    if (fecha_hasta) {
        sql += ` AND aud.fecha_audiencia <= ?`;
        params.push(fecha_hasta);
    }

    sql += ` ORDER BY aud.fecha_audiencia DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      aud.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      cj.numero_cj,
      cjo.numero_cjo,
      cemci.numero_cemci,
      cems.numero_cems
    FROM audiencia aud
    INNER JOIN proceso p ON aud.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN cj ON aud.cj_id = cj.id_cj
    LEFT JOIN cjo ON aud.cjo_id = cjo.id_cjo
    LEFT JOIN cemci ON aud.cemci_id = cemci.id_cemci
    LEFT JOIN cems ON aud.cems_id = cems.id_cems
    WHERE aud.id_audiencia = ?
  `;

    const [audiencia] = await executeQuery(sql, [id]);

    if (!audiencia) {
        throw new NotFoundError('Audiencia no encontrada');
    }

    return audiencia;
};

/**
 * OBTENER AUDIENCIAS POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT 
      aud.*,
      cj.numero_cj,
      cjo.numero_cjo,
      cemci.numero_cemci,
      cems.numero_cems
    FROM audiencia aud
    LEFT JOIN cj ON aud.cj_id = cj.id_cj
    LEFT JOIN cjo ON aud.cjo_id = cjo.id_cjo
    LEFT JOIN cemci ON aud.cemci_id = cemci.id_cemci
    LEFT JOIN cems ON aud.cems_id = cems.id_cems
    WHERE aud.proceso_id = ?
    ORDER BY aud.fecha_audiencia DESC
  `;

    return await executeQuery(sql, [procesoId]);
};

/**
 * OBTENER AUDIENCIAS POR CARPETA
 */
const getByCarpeta = async (tipoCarpeta, carpetaId) => {
    const campoMap = {
        'CJ': 'cj_id',
        'CJO': 'cjo_id',
        'CEMCI': 'cemci_id',
        'CEMS': 'cems_id'
    };

    const campo = campoMap[tipoCarpeta];

    if (!campo) {
        throw new BadRequestError('Tipo de carpeta inválido. Debe ser CJ, CJO, CEMCI o CEMS');
    }

    const sql = `
    SELECT 
      aud.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM audiencia aud
    INNER JOIN proceso p ON aud.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE aud.${campo} = ?
    ORDER BY aud.fecha_audiencia DESC
  `;

    return await executeQuery(sql, [carpetaId]);
};

/**
 * ACTUALIZAR AUDIENCIA
 */
const update = async (id, audienciaData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'cj_id', 'cjo_id', 'cemci_id', 'cems_id',
        'fecha_audiencia', 'tipo', 'observaciones'
    ];

    campos.forEach(campo => {
        if (audienciaData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(audienciaData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE audiencia 
    SET ${updates.join(', ')}
    WHERE id_audiencia = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR AUDIENCIA
 */
const remove = async (id) => {
    const audiencia = await getById(id);

    const sql = `DELETE FROM audiencia WHERE id_audiencia = ?`;
    await executeQuery(sql, [id]);

    return audiencia;
};

/**
 * CONTAR AUDIENCIAS DE UN PROCESO
 */
const countByProceso = async (procesoId) => {
    const sql = `
    SELECT COUNT(*) as total 
    FROM audiencia 
    WHERE proceso_id = ?
  `;

    const [result] = await executeQuery(sql, [procesoId]);
    return result.total;
};

/**
 * OBTENER AUDIENCIAS PRÓXIMAS (siguientes 30 días)
 */
const getProximas = async (dias = 30) => {
    const sql = `
    SELECT 
      aud.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      cj.numero_cj,
      cjo.numero_cjo,
      cemci.numero_cemci,
      cems.numero_cems
    FROM audiencia aud
    INNER JOIN proceso p ON aud.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN cj ON aud.cj_id = cj.id_cj
    LEFT JOIN cjo ON aud.cjo_id = cjo.id_cjo
    LEFT JOIN cemci ON aud.cemci_id = cemci.id_cemci
    LEFT JOIN cems ON aud.cems_id = cems.id_cems
    WHERE aud.fecha_audiencia BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY aud.fecha_audiencia ASC
  `;

    return await executeQuery(sql, [dias]);
};

/**
 * OBTENER AUDIENCIAS DEL DÍA
 */
const getDelDia = async (fecha = null) => {
    const fechaBusqueda = fecha || new Date().toISOString().split('T')[0];

    const sql = `
    SELECT 
      aud.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      cj.numero_cj,
      cjo.numero_cjo,
      cemci.numero_cemci,
      cems.numero_cems
    FROM audiencia aud
    INNER JOIN proceso p ON aud.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN cj ON aud.cj_id = cj.id_cj
    LEFT JOIN cjo ON aud.cjo_id = cjo.id_cjo
    LEFT JOIN cemci ON aud.cemci_id = cemci.id_cemci
    LEFT JOIN cems ON aud.cems_id = cems.id_cems
    WHERE DATE(aud.fecha_audiencia) = ?
    ORDER BY aud.fecha_audiencia ASC
  `;

    return await executeQuery(sql, [fechaBusqueda]);
};

/**
 * ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN cj_id IS NOT NULL THEN 1 END) as audiencias_cj,
      COUNT(CASE WHEN cjo_id IS NOT NULL THEN 1 END) as audiencias_cjo,
      COUNT(CASE WHEN cemci_id IS NOT NULL THEN 1 END) as audiencias_cemci,
      COUNT(CASE WHEN cems_id IS NOT NULL THEN 1 END) as audiencias_cems,
      COUNT(CASE WHEN fecha_audiencia >= CURDATE() THEN 1 END) as proximas,
      COUNT(CASE WHEN fecha_audiencia < CURDATE() THEN 1 END) as pasadas
    FROM audiencia
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

/**
 * ESTADÍSTICAS POR TIPO
 */
const getStatsByTipo = async () => {
    const sql = `
    SELECT 
      tipo,
      COUNT(*) as total
    FROM audiencia
    WHERE tipo IS NOT NULL
    GROUP BY tipo
    ORDER BY total DESC
  `;

    return await executeQuery(sql);
};

module.exports = {
    create,
    getAll,
    getById,
    getByProcesoId,
    getByCarpeta,
    update,
    remove,
    countByProceso,
    getProximas,
    getDelDia,
    getStats,
    getStatsByTipo
};