// src/models/adolescenteModel.js

const { executeQuery, executeTransaction } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errorHandler');
const domicilioModel = require('./domicilioModel');

/**
 * MODELO DE ADOLESCENTES
 *
 * Maneja operaciones CRUD para la tabla adolescente
 * Incluye manejo de domicilio (relación 1:1)
 */

/**
 * HELPER: Calcular edad desde fecha de nacimiento
 */
const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    return edad;
};

/**
 * HELPER: Validar edad entre 12 y 17 años
 */
const validarEdadAdolescente = (fechaNacimiento) => {
    if (!fechaNacimiento) {
        throw new BadRequestError('La fecha de nacimiento es obligatoria');
    }

    const edad = calcularEdad(fechaNacimiento);

    if (edad < 12 || edad > 17) {
        throw new BadRequestError(
            `La edad debe estar entre 12 y 17 años. Edad calculada: ${edad} años`
        );
    }

    return edad;
};

/**
 * CREAR ADOLESCENTE (con domicilio opcional)
 */
const create = async (adolescenteData) => {
    // Validar edad
    validarEdadAdolescente(adolescenteData.fecha_nacimiento);

    return await executeTransaction(async (connection) => {
        let domicilioId = null;

        // Crear domicilio si se proporcionó
        if (adolescenteData.domicilio) {
            const domicilioSql = `
                INSERT INTO domicilio (municipio, calle_numero, colonia, es_lugar_hechos)
                VALUES (?, ?, ?, FALSE)
            `;

            const [domicilioResult] = await connection.execute(domicilioSql, [
                adolescenteData.domicilio.municipio || null,
                adolescenteData.domicilio.calle_numero || null,
                adolescenteData.domicilio.colonia || null
            ]);

            domicilioId = domicilioResult.insertId;
        }

        // Crear adolescente
        const sql = `
            INSERT INTO adolescente (
                nombre, iniciales, sexo, fecha_nacimiento, nacionalidad, idioma,
                otro_idioma_lengua, escolaridad, ocupacion, estado_civil,
                lugar_nacimiento_municipio, lugar_nacimiento_estado,
                fuma_cigarro, consume_alcohol, consume_drogas, tipo_droga,
                telefono, correo, domicilio_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(sql, [
            adolescenteData.nombre,
            adolescenteData.iniciales || null,
            adolescenteData.sexo || null,
            adolescenteData.fecha_nacimiento,
            adolescenteData.nacionalidad || 'Mexicana',
            adolescenteData.idioma || 'Español',
            adolescenteData.otro_idioma_lengua || null,
            adolescenteData.escolaridad || null,
            adolescenteData.ocupacion || null,
            adolescenteData.estado_civil || null,
            adolescenteData.lugar_nacimiento_municipio || null,
            adolescenteData.lugar_nacimiento_estado || null,
            adolescenteData.fuma_cigarro || false,
            adolescenteData.consume_alcohol || false,
            adolescenteData.consume_drogas || false,
            adolescenteData.tipo_droga || null,
            adolescenteData.telefono || null,
            adolescenteData.correo || null,
            domicilioId
        ]);

        return result.insertId;
    });
};

/**
 * OBTENER TODOS (con paginación y filtros)
 */
const getAll = async (options = {}) => {
    const { search, sexo, edad_min, edad_max, limit, offset } = options;

    let sql = `
        SELECT
            a.*,
            d.municipio as domicilio_municipio,
            d.calle_numero as domicilio_calle,
            d.colonia as domicilio_colonia
        FROM adolescente a
                 LEFT JOIN domicilio d ON a.domicilio_id = d.id_domicilio
        WHERE 1=1
    `;

    const params = [];

    // Búsqueda por nombre o iniciales
    if (search) {
        sql += ` AND (a.nombre LIKE ? OR a.iniciales LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    // Filtro por sexo
    if (sexo) {
        sql += ` AND a.sexo = ?`;
        params.push(sexo);
    }

    // Filtro por edad (usando fecha de nacimiento)
    if (edad_min) {
        const fechaMax = new Date();
        fechaMax.setFullYear(fechaMax.getFullYear() - edad_min);
        sql += ` AND a.fecha_nacimiento <= ?`;
        params.push(fechaMax.toISOString().split('T')[0]);
    }

    if (edad_max) {
        const fechaMin = new Date();
        fechaMin.setFullYear(fechaMin.getFullYear() - edad_max - 1);
        sql += ` AND a.fecha_nacimiento > ?`;
        params.push(fechaMin.toISOString().split('T')[0]);
    }

    sql += ` ORDER BY a.nombre ASC`;

    // Paginación
    if (limit) {
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset || 0);
    }

    const adolescentes = await executeQuery(sql, params);

    // Agregar edad calculada a cada adolescente
    return adolescentes.map(a => ({
        ...a,
        edad: calcularEdad(a.fecha_nacimiento)
    }));
};

/**
 * CONTAR TOTAL (para paginación)
 */
const getCount = async (filters = {}) => {
    const { search, sexo, edad_min, edad_max } = filters;

    let sql = `SELECT COUNT(*) as total FROM adolescente WHERE 1=1`;
    const params = [];

    if (search) {
        sql += ` AND (nombre LIKE ? OR iniciales LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    if (sexo) {
        sql += ` AND sexo = ?`;
        params.push(sexo);
    }

    if (edad_min) {
        const fechaMax = new Date();
        fechaMax.setFullYear(fechaMax.getFullYear() - edad_min);
        sql += ` AND fecha_nacimiento <= ?`;
        params.push(fechaMax.toISOString().split('T')[0]);
    }

    if (edad_max) {
        const fechaMin = new Date();
        fechaMin.setFullYear(fechaMin.getFullYear() - edad_max - 1);
        sql += ` AND fecha_nacimiento > ?`;
        params.push(fechaMin.toISOString().split('T')[0]);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

/**
 * OBTENER POR ID (con domicilio)
 */
const getById = async (id) => {
    const sql = `
        SELECT
            a.*,
            d.id_domicilio,
            d.municipio as domicilio_municipio,
            d.calle_numero as domicilio_calle,
            d.colonia as domicilio_colonia
        FROM adolescente a
                 LEFT JOIN domicilio d ON a.domicilio_id = d.id_domicilio
        WHERE a.id_adolescente = ?
    `;

    const [adolescente] = await executeQuery(sql, [id]);

    if (!adolescente) {
        throw new NotFoundError('Adolescente no encontrado');
    }

    // Agregar edad calculada
    adolescente.edad = calcularEdad(adolescente.fecha_nacimiento);

    // Estructurar domicilio como objeto separado
    if (adolescente.id_domicilio) {
        adolescente.domicilio = {
            id_domicilio: adolescente.id_domicilio,
            municipio: adolescente.domicilio_municipio,
            calle_numero: adolescente.domicilio_calle,
            colonia: adolescente.domicilio_colonia
        };
    }

    // Limpiar campos duplicados
    delete adolescente.id_domicilio;
    delete adolescente.domicilio_municipio;
    delete adolescente.domicilio_calle;
    delete adolescente.domicilio_colonia;

    return adolescente;
};

/**
 * ACTUALIZAR ADOLESCENTE (con domicilio)
 */
const update = async (id, adolescenteData) => {
    // Verificar que existe
    const adolescenteActual = await getById(id);

    // Validar edad si se actualiza fecha de nacimiento
    if (adolescenteData.fecha_nacimiento) {
        validarEdadAdolescente(adolescenteData.fecha_nacimiento);
    }

    return await executeTransaction(async (connection) => {
        // Actualizar domicilio si se proporcionó
        if (adolescenteData.domicilio) {
            if (adolescenteActual.domicilio_id) {
                // Actualizar domicilio existente
                const domicilioSql = `
                    UPDATE domicilio
                    SET municipio = ?, calle_numero = ?, colonia = ?
                    WHERE id_domicilio = ?
                `;

                await connection.execute(domicilioSql, [
                    adolescenteData.domicilio.municipio || null,
                    adolescenteData.domicilio.calle_numero || null,
                    adolescenteData.domicilio.colonia || null,
                    adolescenteActual.domicilio_id
                ]);
            } else {
                // Crear nuevo domicilio
                const domicilioSql = `
                    INSERT INTO domicilio (municipio, calle_numero, colonia, es_lugar_hechos)
                    VALUES (?, ?, ?, FALSE)
                `;

                const [domicilioResult] = await connection.execute(domicilioSql, [
                    adolescenteData.domicilio.municipio || null,
                    adolescenteData.domicilio.calle_numero || null,
                    adolescenteData.domicilio.colonia || null
                ]);

                adolescenteData.domicilio_id = domicilioResult.insertId;
            }
        }

        // Construir UPDATE dinámicamente
        const updates = [];
        const values = [];

        const campos = [
            'nombre', 'iniciales', 'sexo', 'fecha_nacimiento', 'nacionalidad', 'idioma',
            'otro_idioma_lengua', 'escolaridad', 'ocupacion', 'estado_civil',
            'lugar_nacimiento_municipio', 'lugar_nacimiento_estado',
            'fuma_cigarro', 'consume_alcohol', 'consume_drogas', 'tipo_droga',
            'telefono', 'correo', 'domicilio_id'
        ];

        campos.forEach(campo => {
            if (adolescenteData[campo] !== undefined) {
                updates.push(`${campo} = ?`);
                values.push(adolescenteData[campo]);
            }
        });

        if (updates.length === 0) {
            return id;
        }

        values.push(id);

        const sql = `
            UPDATE adolescente
            SET ${updates.join(', ')}
            WHERE id_adolescente = ?
        `;

        await connection.execute(sql, values);

        return id;
    });
};

/**
 * ELIMINAR ADOLESCENTE
 * Solo si no tiene proceso asignado
 */
const remove = async (id) => {
    const adolescente = await getById(id);

    // Verificar que no tenga proceso
    const procesoCheck = `
        SELECT id_proceso
        FROM proceso
        WHERE adolescente_id = ?
    `;

    const [proceso] = await executeQuery(procesoCheck, [id]);

    if (proceso) {
        throw new ConflictError(
            'No se puede eliminar el adolescente porque tiene un proceso asignado. ' +
            'Primero debe eliminarse el proceso.'
        );
    }

    return await executeTransaction(async (connection) => {
        // Eliminar adolescente
        const sql = `DELETE FROM adolescente WHERE id_adolescente = ?`;
        await connection.execute(sql, [id]);

        // Eliminar domicilio si existe y no está en uso
        if (adolescente.domicilio_id) {
            const domicilioSql = `DELETE FROM domicilio WHERE id_domicilio = ?`;
            await connection.execute(domicilioSql, [adolescente.domicilio_id]);
        }

        return adolescente;
    });
};

/**
 * VERIFICAR SI TIENE PROCESO
 */
const tieneProceso = async (id) => {
    const sql = `
        SELECT COUNT(*) as count
        FROM proceso
        WHERE adolescente_id = ?
    `;

    const [result] = await executeQuery(sql, [id]);
    return result.count > 0;
};

module.exports = {
    create,
    getAll,
    getCount,
    getById,
    update,
    remove,
    tieneProceso,
    calcularEdad,
    validarEdadAdolescente
};