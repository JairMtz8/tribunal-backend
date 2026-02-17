// src/models/catalogoModel.js

const {executeQuery} = require('../config/database');
const {NotFoundError, ConflictError} = require('../utils/errorHandler');

/**
 * MODELO DE CATÁLOGOS
 *
 * Maneja todas las operaciones CRUD para las tablas de catálogo:
 * - rol
 * - estado_procesal
 * - status
 * - tipo_medida_sancionadora
 * - tipo_medida_cautelar
 * - tipo_reparacion
 */

// =====================================================
// HELPER: Obtener configuración de tabla según tipo
// =====================================================
const getTableConfig = (tipo) => {
    const configs = {
        'roles': {
            table: 'rol',
            idField: 'id_rol',
            nameField: 'nombre',
            hasDescription: true,
            extraFields: []
        },
        'estados-procesales': {
            table: 'estado_procesal',
            idField: 'id_estado',
            nameField: 'nombre',
            hasDescription: false,
            extraFields: []
        },
        'status': {
            table: 'status',
            idField: 'id_status',
            nameField: 'nombre',
            hasDescription: false,
            extraFields: []
        },
        'tipos-medidas-sancionadoras': {
            table: 'tipo_medida_sancionadora',
            idField: 'id_tipo_medida_sancionadora',
            nameField: 'nombre',
            hasDescription: false,
            extraFields: ['es_privativa']
        },
        'tipos-medidas-cautelares': {
            table: 'tipo_medida_cautelar',
            idField: 'id_tipo_medida_cautelar',
            nameField: 'nombre',
            hasDescription: false,
            extraFields: ['genera_cemci']
        },
        'tipos-reparacion': {
            table: 'tipo_reparacion',
            idField: 'id_tipo_reparacion',
            nameField: 'nombre',
            hasDescription: false,
            extraFields: []
        }
    };

    const config = configs[tipo];
    if (!config) {
        throw new Error(`Tipo de catálogo no válido: ${tipo}`);
    }

    return config;
};

// =====================================================
// OBTENER TODOS (con filtros y paginación)
// =====================================================
const getAll = async (tipo, options = {}) => {
    const config = getTableConfig(tipo);
    const {search, limit, offset} = options;

    let sql = `SELECT *
               FROM ${config.table}`;
    const params = [];

    // Filtro de búsqueda
    if (search) {
        sql += ` WHERE ${config.nameField} LIKE ?`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY ${config.nameField} ASC`;

    if (limit) {
        const limitInt = parseInt(limit) || 10;
        const offsetInt = parseInt(offset) || 0;
        sql += ` LIMIT ${limitInt} OFFSET ${offsetInt}`;
    }

    const rows = await executeQuery(sql, params);
    return rows;
};

// =====================================================
// OBTENER TOTAL (para paginación)
// =====================================================
const getCount = async (tipo, search = null) => {
    const config = getTableConfig(tipo);

    let sql = `SELECT COUNT(*) as total
               FROM ${config.table}`;
    const params = [];

    if (search) {
        sql += ` WHERE ${config.nameField} LIKE ?`;
        params.push(`%${search}%`);
    }

    const [result] = await executeQuery(sql, params);
    return result.total;
};

// =====================================================
// OBTENER POR ID
// =====================================================
const getById = async (tipo, id) => {
    const config = getTableConfig(tipo);

    const sql = `SELECT *
                 FROM ${config.table}
                 WHERE ${config.idField} = ?`;
    const [row] = await executeQuery(sql, [id]);

    if (!row) {
        throw new NotFoundError(`Registro no encontrado en ${tipo}`);
    }

    return row;
};

// =====================================================
// CREAR
// =====================================================
const create = async (tipo, data) => {
    const config = getTableConfig(tipo);

    // Construir campos y valores dinámicamente
    const fields = [config.nameField];
    const values = [data.nombre];
    const placeholders = ['?'];

    // Descripción (si aplica)
    if (config.hasDescription && data.descripcion) {
        fields.push('descripcion');
        values.push(data.descripcion);
        placeholders.push('?');
    }

    // Campos extra (es_privativa, genera_cemci, etc.)
    config.extraFields.forEach(field => {
        if (data[field] !== undefined) {
            fields.push(field);
            values.push(data[field]);
            placeholders.push('?');
        }
    });

    const sql = `
        INSERT INTO ${config.table} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
    `;

    try {
        const result = await executeQuery(sql, values);

        // Obtener el registro recién creado
        return await getById(tipo, result.insertId);
    } catch (error) {
        // Manejar error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            throw new ConflictError(`Ya existe un registro con el nombre "${data.nombre}"`);
        }
        throw error;
    }
};

// =====================================================
// ACTUALIZAR
// =====================================================
const update = async (tipo, id, data) => {
    const config = getTableConfig(tipo);

    // Verificar que existe
    await getById(tipo, id);

    // Construir SET dinámicamente
    const updates = [];
    const values = [];

    if (data.nombre) {
        updates.push(`${config.nameField} = ?`);
        values.push(data.nombre);
    }

    if (config.hasDescription && data.descripcion !== undefined) {
        updates.push('descripcion = ?');
        values.push(data.descripcion);
    }

    config.extraFields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(data[field]);
        }
    });

    if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
    }

    values.push(id);

    const sql = `
        UPDATE ${config.table}
        SET ${updates.join(', ')}
        WHERE ${config.idField} = ?
    `;

    try {
        await executeQuery(sql, values);
        return await getById(tipo, id);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new ConflictError(`Ya existe un registro con el nombre "${data.nombre}"`);
        }
        throw error;
    }
};

// =====================================================
// ELIMINAR
// =====================================================
const remove = async (tipo, id) => {
    const config = getTableConfig(tipo);

    // Verificar que existe
    const record = await getById(tipo, id);

    const sql = `DELETE
                 FROM ${config.table}
                 WHERE ${config.idField} = ?`;

    try {
        await executeQuery(sql, [id]);
        return record;
    } catch (error) {
        // Si hay registros relacionados, lanzar error descriptivo
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new ConflictError(
                `No se puede eliminar: existen registros que usan este ${tipo.slice(0, -1)}`
            );
        }
        throw error;
    }
};

// =====================================================
// VERIFICAR SI EXISTE POR NOMBRE
// =====================================================
const existsByName = async (tipo, nombre, excludeId = null) => {
    const config = getTableConfig(tipo);

    let sql = `SELECT ${config.idField}
               FROM ${config.table}
               WHERE ${config.nameField} = ?`;
    const params = [nombre];

    if (excludeId) {
        sql += ` AND ${config.idField} != ?`;
        params.push(excludeId);
    }

    const [row] = await executeQuery(sql, params);
    return !!row;
};

module.exports = {
    getAll,
    getCount,
    getById,
    create,
    update,
    remove,
    existsByName,
    getTableConfig  // Exportar para uso en validaciones
};