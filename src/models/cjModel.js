// src/models/cjModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError, validateDateSequence } = require('../utils/errorHandler');

/**
 * MODELO DE CJ (Carpeta Judicial)
 *
 * La CJ es el origen de todo proceso judicial
 */

/**
 * CREAR CJ
 */
const create = async (cjData) => {
    const {
        numero_cj,
        fecha_ingreso,
        tipo_fuero,
        numero_ampea,
        tipo_narcotico_asegurado,
        peso_narcotico_gramos,
        control,
        lesiones,
        fecha_control,
        fecha_formulacion,
        vinculacion,
        fecha_vinculacion,
        conducta_vinculacion,
        declaro,
        suspension_condicional_proceso_prueba,
        plazo_suspension,
        fecha_suspension,
        fecha_terminacion_suspension,
        audiencia_intermedia,
        fecha_audiencia_intermedia,
        estatus_carpeta_preliminar,
        reincidente,
        sustraido,
        fecha_sustraccion,
        medidas_proteccion,
        numero_toca_apelacion,
        numero_total_audiencias,
        corporacion_ejecutora,
        representante_pp_nnya,
        tipo_representacion_pp_nnya,
        observaciones,
        observaciones_adicionales,
        domicilio_hechos_id
    } = cjData;

    // Verificar que el número de CJ no exista
    const checkSql = `SELECT id_cj FROM cj WHERE numero_cj = ?`;
    const [existing] = await executeQuery(checkSql, [numero_cj]);

    if (existing) {
        throw new ConflictError(`El número de CJ "${numero_cj}" ya existe`);
    }

    // Validar fechas secuenciales si existen
    if (fecha_ingreso && fecha_control) {
        validateDateSequence(fecha_ingreso, fecha_control,
            'fecha_control debe ser posterior a fecha_ingreso');
    }

    if (fecha_control && fecha_vinculacion) {
        validateDateSequence(fecha_control, fecha_vinculacion,
            'fecha_vinculacion debe ser posterior a fecha_control');
    }

    if (fecha_suspension && fecha_terminacion_suspension) {
        validateDateSequence(fecha_suspension, fecha_terminacion_suspension,
            'fecha_terminacion_suspension debe ser posterior a fecha_suspension');
    }

    const sql = `
        INSERT INTO cj (
            numero_cj, fecha_ingreso, tipo_fuero, numero_ampea,
            tipo_narcotico_asegurado, peso_narcotico_gramos,
            control, lesiones, fecha_control, fecha_formulacion,
            vinculacion, fecha_vinculacion, conducta_vinculacion, declaro,
            suspension_condicional_proceso_prueba, plazo_suspension,
            fecha_suspension, fecha_terminacion_suspension,
            audiencia_intermedia, fecha_audiencia_intermedia,
            estatus_carpeta_preliminar, reincidente, sustraido, fecha_sustraccion,
            medidas_proteccion, numero_toca_apelacion, numero_total_audiencias,
            corporacion_ejecutora, representante_pp_nnya, tipo_representacion_pp_nnya,
            observaciones, observaciones_adicionales, domicilio_hechos_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
        numero_cj,
        fecha_ingreso || null,
        tipo_fuero || null,
        numero_ampea || null,
        tipo_narcotico_asegurado || null,
        peso_narcotico_gramos || null,
        control || false,
        lesiones || false,
        fecha_control || null,
        fecha_formulacion || null,
        vinculacion || false,
        fecha_vinculacion || null,
        conducta_vinculacion || null,
        declaro || null,
        suspension_condicional_proceso_prueba || false,
        plazo_suspension || null,
        fecha_suspension || null,
        fecha_terminacion_suspension || null,
        audiencia_intermedia || false,
        fecha_audiencia_intermedia || null,
        estatus_carpeta_preliminar || null,
        reincidente || false,
        sustraido || false,
        fecha_sustraccion || null,
        medidas_proteccion || null,
        numero_toca_apelacion || null,
        numero_total_audiencias || 0,
        corporacion_ejecutora || null,
        representante_pp_nnya || null,
        tipo_representacion_pp_nnya || null,
        observaciones || null,
        observaciones_adicionales || null,
        domicilio_hechos_id || null
    ]);

    return result.insertId;
};

/**
 * OBTENER TODOS
 */
const getAll = async (filters = {}) => {
    const { search, tipo_fuero, vinculacion, reincidente } = filters;

    let sql = `
        SELECT
            c.*,
            d.municipio as domicilio_hechos_municipio,
            d.calle_numero as domicilio_hechos_calle,
            d.colonia as domicilio_hechos_colonia
        FROM cj c
                 LEFT JOIN domicilio d ON c.domicilio_hechos_id = d.id_domicilio
        WHERE 1=1
    `;

    const params = [];

    if (search) {
        sql += ` AND (c.numero_cj LIKE ? OR c.numero_ampea LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    if (tipo_fuero) {
        sql += ` AND c.tipo_fuero = ?`;
        params.push(tipo_fuero);
    }

    if (vinculacion !== undefined) {
        sql += ` AND c.vinculacion = ?`;
        params.push(vinculacion);
    }

    if (reincidente !== undefined) {
        sql += ` AND c.reincidente = ?`;
        params.push(reincidente);
    }

    sql += ` ORDER BY c.fecha_ingreso DESC, c.id_cj DESC`;

    return await executeQuery(sql, params);
};

/**
 * OBTENER POR ID (con domicilio de hechos)
 */
const getById = async (id) => {
    const sql = `
        SELECT
            c.*,
            d.id_domicilio as domicilio_hechos_id,
            d.municipio as domicilio_hechos_municipio,
            d.calle_numero as domicilio_hechos_calle,
            d.colonia as domicilio_hechos_colonia
        FROM cj c
                 LEFT JOIN domicilio d ON c.domicilio_hechos_id = d.id_domicilio
        WHERE c.id_cj = ?
    `;

    const [cj] = await executeQuery(sql, [id]);

    if (!cj) {
        throw new NotFoundError('Carpeta Judicial (CJ) no encontrada');
    }

    // Estructurar domicilio como objeto separado
    if (cj.domicilio_hechos_id) {
        cj.domicilio_hechos = {
            id_domicilio: cj.domicilio_hechos_id,
            municipio: cj.domicilio_hechos_municipio,
            calle_numero: cj.domicilio_hechos_calle,
            colonia: cj.domicilio_hechos_colonia
        };
    }

    // Limpiar campos duplicados
    delete cj.domicilio_hechos_municipio;
    delete cj.domicilio_hechos_calle;
    delete cj.domicilio_hechos_colonia;

    return cj;
};

/**
 * OBTENER POR NÚMERO DE CJ
 */
const getByNumero = async (numeroCj) => {
    const sql = `SELECT * FROM cj WHERE numero_cj = ?`;
    const [cj] = await executeQuery(sql, [numeroCj]);
    return cj || null;
};

/**
 * ACTUALIZAR CJ
 */
const update = async (id, cjData) => {
    // Verificar que existe
    await getById(id);

    // Si se actualiza numero_cj, verificar que no exista
    if (cjData.numero_cj) {
        const existing = await getByNumero(cjData.numero_cj);
        if (existing && existing.id_cj !== id) {
            throw new ConflictError(`El número de CJ "${cjData.numero_cj}" ya existe`);
        }
    }

    // Construir UPDATE dinámicamente
    const updates = [];
    const values = [];

    const campos = [
        'numero_cj', 'fecha_ingreso', 'tipo_fuero', 'numero_ampea',
        'tipo_narcotico_asegurado', 'peso_narcotico_gramos',
        'control', 'lesiones', 'fecha_control', 'fecha_formulacion',
        'vinculacion', 'fecha_vinculacion', 'conducta_vinculacion', 'declaro',
        'suspension_condicional_proceso_prueba', 'plazo_suspension',
        'fecha_suspension', 'fecha_terminacion_suspension',
        'audiencia_intermedia', 'fecha_audiencia_intermedia',
        'estatus_carpeta_preliminar', 'reincidente', 'sustraido', 'fecha_sustraccion',
        'medidas_proteccion', 'numero_toca_apelacion', 'numero_total_audiencias',
        'corporacion_ejecutora', 'representante_pp_nnya', 'tipo_representacion_pp_nnya',
        'observaciones', 'observaciones_adicionales', 'domicilio_hechos_id'
    ];

    campos.forEach(campo => {
        if (cjData[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(cjData[campo]);
        }
    });

    if (updates.length === 0) {
        throw new BadRequestError('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
        UPDATE cj
        SET ${updates.join(', ')}
        WHERE id_cj = ?
    `;

    await executeQuery(sql, values);

    // Si se actualizó tipo_fuero, propagarlo a CJO si existe
    if (cjData.tipo_fuero !== undefined) {
        const updateCjoFuero = `
            UPDATE cjo
            SET fuero = ?
            WHERE cj_id = ?
        `;
        await executeQuery(updateCjoFuero, [cjData.tipo_fuero, id]);
    }

    return await getById(id);
};

/**
 * ELIMINAR CJ
 */
const remove = async (id) => {
    const cj = await getById(id);

    // Verificar si tiene CJO asociado
    const cjoCheck = `SELECT id_cjo FROM cjo WHERE cj_id = ?`;
    const [cjo] = await executeQuery(cjoCheck, [id]);

    if (cjo) {
        throw new ConflictError(
            'No se puede eliminar la CJ porque tiene una carpeta CJO asociada. ' +
            'Primero debe eliminar el CJO.'
        );
    }

    const sql = `DELETE FROM cj WHERE id_cj = ?`;
    await executeQuery(sql, [id]);

    return cj;
};

/**
 * CONTAR TOTAL
 */
const getCount = async (filters = {}) => {
    const { tipo_fuero, vinculacion, reincidente } = filters;

    let sql = `SELECT COUNT(*) as total FROM cj WHERE 1=1`;
    const params = [];

    if (tipo_fuero) {
        sql += ` AND tipo_fuero = ?`;
        params.push(tipo_fuero);
    }

    if (vinculacion !== undefined) {
        sql += ` AND vinculacion = ?`;
        params.push(vinculacion);
    }

    if (reincidente !== undefined) {
        sql += ` AND reincidente = ?`;
        params.push(reincidente);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

module.exports = {
    create,
    getAll,
    getById,
    getByNumero,
    update,
    remove,
    getCount
};