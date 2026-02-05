// src/models/procesoModel.js

const { executeQuery, executeTransaction } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');

/**
 * MODELO DE PROCESO
 *
 * El proceso es la entidad central del sistema.
 * Relación 1:1 con adolescente (un adolescente solo puede tener un proceso)
 */

/**
 * CREAR PROCESO
 * Solo puede haber un proceso por adolescente
 */
const create = async (procesoData) => {
    const { adolescente_id, status_id, observaciones } = procesoData;

    // Verificar que el adolescente existe
    const adolescenteCheck = `SELECT id_adolescente FROM adolescente WHERE id_adolescente = ?`;
    const [adolescente] = await executeQuery(adolescenteCheck, [adolescente_id]);

    if (!adolescente) {
        throw new NotFoundError('El adolescente especificado no existe');
    }

    // Verificar que el adolescente NO tenga ya un proceso
    const procesoCheck = `SELECT id_proceso FROM proceso WHERE adolescente_id = ?`;
    const [procesoExistente] = await executeQuery(procesoCheck, [adolescente_id]);

    if (procesoExistente) {
        throw new ConflictError(
            `El adolescente ya tiene un proceso asignado (ID: ${procesoExistente.id_proceso}). ` +
            `Un adolescente solo puede tener un proceso.`
        );
    }

    // Crear el proceso
    const sql = `
    INSERT INTO proceso (adolescente_id, status_id, observaciones)
    VALUES (?, ?, ?)
  `;

    const result = await executeQuery(sql, [
        adolescente_id,
        status_id || null,
        observaciones || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODOS (con información de adolescente)
 */
const getAll = async (filters = {}) => {
    const { status_id, search } = filters;

    let sql = `
    SELECT 
      p.*,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      a.fecha_nacimiento as adolescente_fecha_nacimiento,
      s.nombre as status_nombre
    FROM proceso p
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN status s ON p.status_id = s.id_status
    WHERE 1=1
  `;

    const params = [];

    // Filtrar por status
    if (status_id) {
        sql += ` AND p.status_id = ?`;
        params.push(status_id);
    }

    // Búsqueda por nombre de adolescente
    if (search) {
        sql += ` AND (a.nombre LIKE ? OR a.iniciales LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.id_proceso DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID (con toda la información relacionada)
 */
const getById = async (id) => {
    const sql = `
    SELECT 
      p.*,
      a.id_adolescente,
      a.nombre as adolescente_nombre,
      a.iniciales as adolescente_iniciales,
      a.sexo as adolescente_sexo,
      a.fecha_nacimiento as adolescente_fecha_nacimiento,
      s.nombre as status_nombre
    FROM proceso p
    INNER JOIN adolescente a ON p.adolescente_id = a.id_adolescente
    LEFT JOIN status s ON p.status_id = s.id_status
    WHERE p.id_proceso = ?
  `;

    const [proceso] = await executeQuery(sql, [id]);

    if (!proceso) {
        throw new NotFoundError('Proceso no encontrado');
    }

    return proceso;
};

/**
 * OBTENER POR ADOLESCENTE ID
 */
const getByAdolescenteId = async (adolescenteId) => {
    const sql = `
    SELECT 
      p.*,
      s.nombre as status_nombre
    FROM proceso p
    LEFT JOIN status s ON p.status_id = s.id_status
    WHERE p.adolescente_id = ?
  `;

    const [proceso] = await executeQuery(sql, [adolescenteId]);
    return proceso || null;
};

/**
 * ACTUALIZAR PROCESO
 */
const update = async (id, procesoData) => {
    // Verificar que existe
    await getById(id);

    const updates = [];
    const values = [];

    if (procesoData.status_id !== undefined) {
        updates.push('status_id = ?');
        values.push(procesoData.status_id);
    }

    if (procesoData.observaciones !== undefined) {
        updates.push('observaciones = ?');
        values.push(procesoData.observaciones);
    }

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
    UPDATE proceso 
    SET ${updates.join(', ')}
    WHERE id_proceso = ?
  `;

    await executeQuery(sql, values);
    return await getById(id);
};

/**
 * ELIMINAR PROCESO
 * Solo si no tiene carpetas asociadas
 */
const remove = async (id) => {
    const proceso = await getById(id);

    // Verificar si tiene carpetas en proceso_carpeta
    const carpetaCheck = `SELECT * FROM proceso_carpeta WHERE id_proceso = ?`;
    const [carpeta] = await executeQuery(carpetaCheck, [id]);

    if (carpeta) {
        throw new ConflictError(
            'No se puede eliminar el proceso porque tiene carpetas asociadas (CJ, CJO, CEMCI o CEMS). ' +
            'Primero debe eliminar las carpetas.'
        );
    }

    const sql = `DELETE FROM proceso WHERE id_proceso = ?`;
    await executeQuery(sql, [id]);

    return proceso;
};

/**
 * VERIFICAR SI TIENE CARPETAS
 */
const tieneCarpetas = async (id) => {
    const sql = `SELECT COUNT(*) as count FROM proceso_carpeta WHERE id_proceso = ?`;
    const [result] = await executeQuery(sql, [id]);
    return result.count > 0;
};

/**
 * CONTAR TOTAL DE PROCESOS
 */
const getCount = async (filters = {}) => {
    const { status_id } = filters;

    let sql = `SELECT COUNT(*) as total FROM proceso WHERE 1=1`;
    const params = [];

    if (status_id) {
        sql += ` AND status_id = ?`;
        params.push(status_id);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

module.exports = {
    create,
    getAll,
    getById,
    getByAdolescenteId,
    update,
    remove,
    tieneCarpetas,
    getCount
};