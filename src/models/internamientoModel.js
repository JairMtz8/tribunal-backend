// src/models/internamientoModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE INTERNAMIENTO
 *
 * Datos de internamiento del proceso
 * Relación 1:1 con proceso
 */

/**
 * CREAR INTERNAMIENTO
 */
const create = async (internamientoData) => {
    const {
        proceso_id,
        fecha_cumplimiento
    } = internamientoData;

    // Verificar que el proceso existe
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE id_proceso = ?`;
    const [proceso] = await executeQuery(procesoCheck, [proceso_id]);

    if (!proceso) {
        throw new NotFoundError('El proceso especificado no existe');
    }

    // Verificar que no exista ya internamiento para este proceso
    const internamientoExistente = `SELECT id_internamiento FROM internamiento WHERE proceso_id = ?`;
    const [existe] = await executeQuery(internamientoExistente, [proceso_id]);

    if (existe) {
        throw new ConflictError('Ya existe internamiento para este proceso');
    }

    const sql = `
    INSERT INTO internamiento (
      proceso_id,
      fecha_cumplimiento
    ) VALUES (?, ?)
  `;

    const result = await executeQuery(sql, [
        proceso_id,
        fecha_cumplimiento || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODOS LOS INTERNAMIENTOS
 */
const getAll = async () => {
    const sql = `
    SELECT 
      i.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM internamiento i
    INNER JOIN proceso p ON i.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    ORDER BY i.fecha_cumplimiento DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER POR ID
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      i.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM internamiento i
    INNER JOIN proceso p ON i.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE i.id_internamiento = ?
  `;

    const [internamiento] = await executeQuery(sql, [id]);

    if (!internamiento) {
        throw new NotFoundError('Internamiento no encontrado');
    }

    return internamiento;
};

/**
 * OBTENER POR PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
    SELECT * FROM internamiento WHERE proceso_id = ?
  `;

    const [internamiento] = await executeQuery(sql, [procesoId]);
    return internamiento || null;
};

/**
 * ACTUALIZAR INTERNAMIENTO
 */
const update = async (id, internamientoData) => {
    await getById(id);

    const { fecha_cumplimiento } = internamientoData;

    if (fecha_cumplimiento === undefined) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    const sql = `
    UPDATE internamiento 
    SET fecha_cumplimiento = ?
    WHERE id_internamiento = ?
  `;

    await executeQuery(sql, [fecha_cumplimiento, id]);
    return await getById(id);
};

/**
 * ELIMINAR INTERNAMIENTO
 */
const remove = async (id) => {
    const internamiento = await getById(id);

    const sql = `DELETE FROM internamiento WHERE id_internamiento = ?`;
    await executeQuery(sql, [id]);

    return internamiento;
};

/**
 * OBTENER INTERNAMIENTOS CUMPLIDOS
 */
const getCumplidos = async () => {
    const sql = `
    SELECT 
      i.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM internamiento i
    INNER JOIN proceso p ON i.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE i.fecha_cumplimiento IS NOT NULL
      AND i.fecha_cumplimiento <= CURDATE()
    ORDER BY i.fecha_cumplimiento DESC
  `;

    return await executeQuery(sql);
};

/**
 * OBTENER INTERNAMIENTOS ACTIVOS (sin cumplir)
 */
const getActivos = async () => {
    const sql = `
    SELECT 
      i.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales
    FROM internamiento i
    INNER JOIN proceso p ON i.proceso_id = p.id_proceso
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    WHERE i.fecha_cumplimiento IS NULL
       OR i.fecha_cumplimiento > CURDATE()
    ORDER BY i.fecha_cumplimiento ASC
  `;

    return await executeQuery(sql);
};

/**
 * ESTADÍSTICAS
 */
const getStats = async () => {
    const sql = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN fecha_cumplimiento IS NOT NULL AND fecha_cumplimiento <= CURDATE() THEN 1 END) as cumplidos,
      COUNT(CASE WHEN fecha_cumplimiento IS NULL OR fecha_cumplimiento > CURDATE() THEN 1 END) as activos
    FROM internamiento
  `;

    const [stats] = await executeQuery(sql);
    return stats;
};

module.exports = {
    create,
    getAll,
    getById,
    getByProcesoId,
    update,
    remove,
    getCumplidos,
    getActivos,
    getStats
};