// src/models/procesoCarpetaModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errorHandler');

/**
 * MODELO DE PROCESO_CARPETA
 *
 * Tabla puente que relaciona un proceso con sus carpetas (CJ, CJO, CEMCI, CEMS)
 * Un proceso tiene máximo una de cada carpeta
 */

/**
 * CREAR RELACIÓN PROCESO-CARPETA
 * Se crea cuando se crea el proceso con CJ
 */
const create = async (procesoCarpetaData) => {
    const { id_proceso, cj_id, cjo_id, cemci_id, cems_id } = procesoCarpetaData;

    // Verificar que no exista ya una relación para este proceso
    const checkSql = `SELECT id_proceso FROM proceso_carpeta WHERE id_proceso = ?`;
    const [existing] = await executeQuery(checkSql, [id_proceso]);

    if (existing) {
        throw new ConflictError('Ya existe una relación de carpetas para este proceso');
    }

    const sql = `
        INSERT INTO proceso_carpeta (id_proceso, cj_id, cjo_id, cemci_id, cems_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    await executeQuery(sql, [
        id_proceso,
        cj_id,
        cjo_id || null,
        cemci_id || null,
        cems_id || null
    ]);

    return await getByProcesoId(id_proceso);
};

/**
 * OBTENER POR ID DE PROCESO
 */
const getByProcesoId = async (procesoId) => {
    const sql = `
        SELECT
            pc.*,
            cj.numero_cj,
            cj.fecha_ingreso as cj_fecha_ingreso,
            cjo.numero_cjo,
            cjo.fecha_ingreso as cjo_fecha_ingreso,
            cemci.numero_cemci,
            cemci.fecha_recepcion_cemci,
            cems.numero_cems,
            cems.fecha_recepcion as cems_fecha_recepcion
        FROM proceso_carpeta pc
                 LEFT JOIN cj ON pc.cj_id = cj.id_cj
                 LEFT JOIN cjo ON pc.cjo_id = cjo.id_cjo
                 LEFT JOIN cemci ON pc.cemci_id = cemci.id_cemci
                 LEFT JOIN cems ON pc.cems_id = cems.id_cems
        WHERE pc.id_proceso = ?
    `;

    const [procesoCarpeta] = await executeQuery(sql, [procesoId]);

    if (!procesoCarpeta) {
        throw new NotFoundError('No se encontró relación de carpetas para este proceso');
    }

    return procesoCarpeta;
};

/**
 * ACTUALIZAR CARPETAS DEL PROCESO
 * Se usa cuando se agrega CJO, CEMCI o CEMS
 */
const update = async (procesoId, carpetaData) => {
    // Verificar que existe
    await getByProcesoId(procesoId);

    const updates = [];
    const values = [];

    if (carpetaData.cjo_id !== undefined) {
        updates.push('cjo_id = ?');
        values.push(carpetaData.cjo_id);
    }

    if (carpetaData.cemci_id !== undefined) {
        updates.push('cemci_id = ?');
        values.push(carpetaData.cemci_id);
    }

    if (carpetaData.cems_id !== undefined) {
        updates.push('cems_id = ?');
        values.push(carpetaData.cems_id);
    }

    if (updates.length === 0) {
        throw new Error('No hay carpetas para actualizar');
    }

    values.push(procesoId);

    const sql = `
        UPDATE proceso_carpeta
        SET ${updates.join(', ')}
        WHERE id_proceso = ?
    `;

    await executeQuery(sql, values);
    return await getByProcesoId(procesoId);
};

/**
 * AGREGAR CJO AL PROCESO
 */
const agregarCJO = async (procesoId, cjoId) => {
    const procesoCarpeta = await getByProcesoId(procesoId);

    if (procesoCarpeta.cjo_id) {
        throw new ConflictError('Este proceso ya tiene una carpeta CJO asignada');
    }

    return await update(procesoId, { cjo_id: cjoId });
};

/**
 * AGREGAR CEMCI AL PROCESO
 */
const agregarCEMCI = async (procesoId, cemciId) => {
    const procesoCarpeta = await getByProcesoId(procesoId);

    if (procesoCarpeta.cemci_id) {
        throw new ConflictError('Este proceso ya tiene una carpeta CEMCI asignada');
    }

    return await update(procesoId, { cemci_id: cemciId });
};

/**
 * AGREGAR CEMS AL PROCESO
 */
const agregarCEMS = async (procesoId, cemsId) => {
    const procesoCarpeta = await getByProcesoId(procesoId);

    if (procesoCarpeta.cems_id) {
        throw new ConflictError('Este proceso ya tiene una carpeta CEMS asignada');
    }

    return await update(procesoId, { cems_id: cemsId });
};

/**
 * VERIFICAR SI PROCESO TIENE CJ
 */
const tieneCJ = async (procesoId) => {
    const sql = `SELECT cj_id FROM proceso_carpeta WHERE id_proceso = ?`;
    const [result] = await executeQuery(sql, [procesoId]);
    return result && result.cj_id !== null;
};

/**
 * VERIFICAR SI PROCESO TIENE CJO
 */
const tieneCJO = async (procesoId) => {
    const sql = `SELECT cjo_id FROM proceso_carpeta WHERE id_proceso = ?`;
    const [result] = await executeQuery(sql, [procesoId]);
    return result && result.cjo_id !== null;
};

/**
 * VERIFICAR SI PROCESO TIENE CEMCI
 */
const tieneCEMCI = async (procesoId) => {
    const sql = `SELECT cemci_id FROM proceso_carpeta WHERE id_proceso = ?`;
    const [result] = await executeQuery(sql, [procesoId]);
    return result && result.cemci_id !== null;
};

/**
 * VERIFICAR SI PROCESO TIENE CEMS
 */
const tieneCEMS = async (procesoId) => {
    const sql = `SELECT cems_id FROM proceso_carpeta WHERE id_proceso = ?`;
    const [result] = await executeQuery(sql, [procesoId]);
    return result && result.cems_id !== null;
};

/**
 * ELIMINAR RELACIÓN
 * Solo se usa cuando se elimina el proceso completo
 */
const remove = async (procesoId) => {
    const procesoCarpeta = await getByProcesoId(procesoId);

    const sql = `DELETE FROM proceso_carpeta WHERE id_proceso = ?`;
    await executeQuery(sql, [procesoId]);

    return procesoCarpeta;
};

module.exports = {
    create,
    getByProcesoId,
    update,
    agregarCJO,
    agregarCEMCI,
    agregarCEMS,
    tieneCJ,
    tieneCJO,
    tieneCEMCI,
    tieneCEMS,
    remove
};