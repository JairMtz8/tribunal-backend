// src/models/authModel.js

const { executeQuery } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errorHandler');
const bcrypt = require('bcrypt');

/**
 * MODELO DE AUTENTICACIÓN
 *
 * Maneja todas las operaciones relacionadas con usuarios
 */

// Número de rondas para bcrypt (10 es un buen balance seguridad/velocidad)
const SALT_ROUNDS = 10;

/**
 * BUSCAR USUARIO POR USERNAME
 * Incluye información del rol
 */
const findByUsername = async (username) => {
    const sql = `
    SELECT 
      u.id_usuario,
      u.rol_id,
      u.nombre,
      u.usuario,
      u.correo,
      u.contrasena_hash,
      u.activo,
      r.nombre as rol_nombre,
      r.descripcion as rol_descripcion
    FROM usuario u
    LEFT JOIN rol r ON u.rol_id = r.id_rol
    WHERE u.usuario = ?
  `;

    const [user] = await executeQuery(sql, [username]);
    return user || null;
};

/**
 * BUSCAR USUARIO POR ID
 */
const findById = async (id) => {
    const sql = `
    SELECT 
      u.id_usuario,
      u.rol_id,
      u.nombre,
      u.usuario,
      u.correo,
      u.activo,
      r.nombre as rol_nombre,
      r.descripcion as rol_descripcion
    FROM usuario u
    LEFT JOIN rol r ON u.rol_id = r.id_rol
    WHERE u.id_usuario = ?
  `;

    const [user] = await executeQuery(sql, [id]);

    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    return user;
};

/**
 * BUSCAR USUARIO POR EMAIL
 */
const findByEmail = async (email) => {
    const sql = `
    SELECT 
      u.id_usuario,
      u.rol_id,
      u.nombre,
      u.usuario,
      u.correo,
      u.contrasena_hash,
      u.activo,
      r.nombre as rol_nombre
    FROM usuario u
    LEFT JOIN rol r ON u.rol_id = r.id_rol
    WHERE u.correo = ?
  `;

    const [user] = await executeQuery(sql, [email]);
    return user || null;
};

/**
 * CREAR USUARIO
 */
const create = async (userData) => {
    const { nombre, usuario, correo, contrasena, rol_id } = userData;

    // Verificar que no exista el username
    const existingUser = await findByUsername(usuario);
    if (existingUser) {
        throw new ConflictError('El nombre de usuario ya está en uso');
    }

    // Verificar que no exista el email
    if (correo) {
        const existingEmail = await findByEmail(correo);
        if (existingEmail) {
            throw new ConflictError('El correo electrónico ya está registrado');
        }
    }

    // Hash de la contraseña
    const contrasena_hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    // Insertar usuario
    const sql = `
    INSERT INTO usuario (rol_id, nombre, usuario, correo, contrasena_hash, activo)
    VALUES (?, ?, ?, ?, ?, TRUE)
  `;

    const result = await executeQuery(sql, [
        rol_id,
        nombre,
        usuario,
        correo || null,
        contrasena_hash
    ]);

    // Obtener el usuario recién creado (sin contraseña)
    return await findById(result.insertId);
};

/**
 * VERIFICAR CONTRASEÑA
 * Compara la contraseña en texto plano con el hash
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * ACTUALIZAR CONTRASEÑA
 */
const updatePassword = async (userId, newPassword) => {
    const contrasena_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const sql = `
    UPDATE usuario 
    SET contrasena_hash = ?
    WHERE id_usuario = ?
  `;

    await executeQuery(sql, [contrasena_hash, userId]);
    return true;
};

/**
 * ACTUALIZAR INFORMACIÓN DEL USUARIO
 */
const update = async (userId, data) => {
    const updates = [];
    const values = [];

    if (data.nombre) {
        updates.push('nombre = ?');
        values.push(data.nombre);
    }

    if (data.correo !== undefined) {
        // Verificar que el email no esté en uso por otro usuario
        if (data.correo) {
            const existing = await findByEmail(data.correo);
            if (existing && existing.id_usuario !== userId) {
                throw new ConflictError('El correo electrónico ya está registrado');
            }
        }
        updates.push('correo = ?');
        values.push(data.correo || null);
    }

    if (data.activo !== undefined) {
        updates.push('activo = ?');
        values.push(data.activo);
    }

    if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
    }

    values.push(userId);

    const sql = `
    UPDATE usuario 
    SET ${updates.join(', ')}
    WHERE id_usuario = ?
  `;

    await executeQuery(sql, values);
    return await findById(userId);
};

/**
 * DESACTIVAR USUARIO
 */
const deactivate = async (userId) => {
    const sql = `UPDATE usuario SET activo = FALSE WHERE id_usuario = ?`;
    await executeQuery(sql, [userId]);
    return await findById(userId);
};

/**
 * ACTIVAR USUARIO
 */
const activate = async (userId) => {
    const sql = `UPDATE usuario SET activo = TRUE WHERE id_usuario = ?`;
    await executeQuery(sql, [userId]);
    return await findById(userId);
};

/**
 * LISTAR TODOS LOS USUARIOS
 */
const getAll = async (filters = {}) => {
    let sql = `
    SELECT 
      u.id_usuario,
      u.rol_id,
      u.nombre,
      u.usuario,
      u.correo,
      u.activo,
      r.nombre as rol_nombre,
      r.descripcion as rol_descripcion
    FROM usuario u
    LEFT JOIN rol r ON u.rol_id = r.id_rol
  `;

    const conditions = [];
    const params = [];

    // Filtro por rol
    if (filters.rol_id) {
        conditions.push('u.rol_id = ?');
        params.push(filters.rol_id);
    }

    // Filtro por estado activo
    if (filters.activo !== undefined) {
        conditions.push('u.activo = ?');
        params.push(filters.activo);
    }

    // Búsqueda por nombre o usuario
    if (filters.search) {
        conditions.push('(u.nombre LIKE ? OR u.usuario LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY u.nombre ASC';

    return await executeQuery(sql, params);
};

/**
 * ELIMINAR USUARIO
 */
const remove = async (userId) => {
    const user = await findById(userId);

    const sql = `DELETE FROM usuario WHERE id_usuario = ?`;
    await executeQuery(sql, [userId]);

    return user;
};

module.exports = {
    findByUsername,
    findById,
    findByEmail,
    create,
    verifyPassword,
    updatePassword,
    update,
    deactivate,
    activate,
    getAll,
    remove
};