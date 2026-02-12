// src/models/cemsExhortacionModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE CEMS_EXHORTACION
 *
 * Tabla de exhortaciones por proceso
 * Un CEMS puede tener múltiples exhortaciones (una por proceso)
 */

/**
 * CREAR EXHORTACIÓN
 */
const create = async (exhortacionData) => {
    const {
        cems_id,
        proceso_id,
        exhortacion_reparacion_dano,
        fecha_exhortacion_reparacion_dano,
        exhortacion_cumplimiento,
        fecha_exhortacion_cumplimiento,
        oficio_fiscal
    } = exhortacionData;

    // Verificar que CEMS existe
    const cemsCheck = `SELECT id_cems FROM cems WHERE id_cems = ?`;
    const [cems] = await executeQuery(cemsCheck, [cems_id]);

    if (!cems) {
        throw new NotFoundError('La CEMS especificada no existe');
    }

    // Verificar que proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que no exista ya la exhortación
    const existeCheck = `
    SELECT * FROM cems_exhortacion 
    WHERE cems_id = ? AND proceso_id = ?
  `;
    const [existe] = await executeQuery(existeCheck, [cems_id, proceso_id]);

    if (existe) {
        throw new ConflictError('Ya existe una exhortación de CEMS para este proceso');
    }

    const sql = `
    INSERT INTO cems_exhortacion (
      cems_id, proceso_id,
      exhortacion_reparacion_dano,
      fecha_exhortacion_reparacion_dano,
      exhortacion_cumplimiento,
      fecha_exhortacion_cumplimiento,
      oficio_fiscal
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        cems_id,
        proceso_id,
        exhortacion_reparacion_dano || false,
        fecha_exhortacion_reparacion_dano || null,
        exhortacion_cumplimiento || false,
        fecha_exhortacion_cumplimiento || null,
        oficio_fiscal || null
    ]);

    return result.insertId;
};

/**
 * OBTENER EXHORTACIONES DE UN CEMS
 */
const getByCemsId = async (cemsId) => {
    const sql = `
    SELECT 
      ce.*,
      p.id_proceso,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM cems_exhortacion ce
    INNER JOIN proceso p ON ce.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE ce.cems_id = ?
    ORDER BY ce.fecha_exhortacion_reparacion_dano DESC
  `;

    return await executeQuery(sql, [cemsId]);
};

/**
 * OBTENER EXHORTACIÓN POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT 
      ce.*,
      cs.numero_cems
    FROM cems_exhortacion ce
    INNER JOIN cems cs ON ce.cems_id = cs.id_cems
    WHERE ce.proceso_id = ?
  `;

    const [exhortacion] = await executeQuery(sql, [procesoId]);
    return exhortacion || null;
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      ce.*,
      cs.numero_cems,
      p.id_proceso,
      a.nombre as adolescente_nombre
    FROM cems_exhortacion ce
    INNER JOIN cems cs ON ce.cems_id = cs.id_cems
    INNER JOIN proceso p ON ce.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE ce.id_exhortacion = ?
  `;

    const [exhortacion] = await executeQuery(sql, [id]);

    if (!exhortacion) {
        throw new NotFoundError('Exhortación de CEMS no encontrada');
    }

    return exhortacion;
};

/**
 * ACTUALIZAR EXHORTACIÓN
 */
const update = async (id, exhortacionData) => {
    await getById(id);

    const updates = [];
    const values = [];

    const campos = [
        'exhortacion_reparacion_dano',
        'fecha_exhortacion_reparacion_dano',
        'exhortacion_cumplimiento',
        'fecha_exhortacion_cumplimiento',
        'oficio_fiscal'
    ];

    campos.forEach(campo => {
        if (exhortacionData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(exhortacionData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE cems_exhortacion 
    SET ${updates.join(', ')}
    WHERE id_exhortacion = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR EXHORTACIÓN
 */
const remove = async (id) => {
    const exhortacion = await getById(id);

    const sql = `DELETE FROM cems_exhortacion WHERE id_exhortacion = ?`;
    await executeQuery(sql, [id]);

    return exhortacion;
};

/**
 * CONTAR EXHORTACIONES DE UN CEMS
 */
const countByCems = async (cemsId) => {
    const sql = `
    SELECT COUNT(*) as total 
    FROM cems_exhortacion 
    WHERE cems_id = ?
  `;

    const [result] = await executeQuery(sql, [cemsId]);
    return result.total;
};

/**
 * ESTADÍSTICAS DE EXHORTACIONES
 */
const getStats = async () => {
    const sql = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN exhortacion_reparacion_dano = TRUE THEN 1 END) as reparacion_dano,
      COUNT(CASE WHEN exhortacion_cumplimiento = TRUE THEN 1 END) as cumplimiento
    FROM cems_exhortacion
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getByCemsId,
    getByProcesoId,
    getById,
    update,
    remove,
    countByCems,
    getStats
};