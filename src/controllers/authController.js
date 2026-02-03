// src/controllers/authController.js

const authModel = require('../models/authModel');
const { generateToken } = require('../utils/jwt');
const { successResponse, createdResponse } = require('../utils/response');
const {
    UnauthorizedError,
    BadRequestError,
    validateRequiredFields
} = require('../utils/errorHandler');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE AUTENTICACIÓN
 */

/**
 * REGISTRO DE USUARIO
 * Solo Admin puede crear usuarios
 */
const register = async (req, res) => {
    const { nombre, usuario, correo, contrasena, rol_id } = req.body;

    // Validar campos requeridos
    validateRequiredFields(req.body, ['nombre', 'usuario', 'contrasena', 'rol_id']);

    // Validar longitud de contraseña
    if (contrasena.length < 6) {
        throw new BadRequestError('La contraseña debe tener al menos 6 caracteres');
    }

    // Crear usuario
    const newUser = await authModel.create({
        nombre,
        usuario,
        correo,
        contrasena,
        rol_id
    });

    // Generar token para el nuevo usuario
    const token = generateToken(newUser);

    return createdResponse(res, {
        usuario: newUser,
        token
    }, 'Usuario creado exitosamente');
};

/**
 * LOGIN
 * Autenticar usuario y retornar JWT
 */
const login = async (req, res) => {
    const { usuario, contrasena } = req.body;

    // Validar campos requeridos
    validateRequiredFields(req.body, ['usuario', 'contrasena']);

    // Buscar usuario por username
    const user = await authModel.findByUsername(usuario);

    if (!user) {
        throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar que esté activo
    if (!user.activo) {
        throw new UnauthorizedError('Usuario desactivado. Contacta al administrador');
    }

    // Verificar contraseña
    const isPasswordValid = await authModel.verifyPassword(contrasena, user.contrasena_hash);

    if (!isPasswordValid) {
        throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token
    const token = generateToken(user);

    // Remover contraseña del objeto antes de enviar
    delete user.contrasena_hash;

    return successResponse(res, {
        usuario: user,
        token
    }, 'Login exitoso');
};

/**
 * OBTENER PERFIL DEL USUARIO ACTUAL
 * Requiere autenticación (req.user viene del authMiddleware)
 */
const getProfile = async (req, res) => {
    // req.user ya viene del authMiddleware
    const user = req.user;

    return successResponse(res, user, 'Perfil obtenido exitosamente');
};

/**
 * ACTUALIZAR PERFIL
 * Un usuario puede actualizar su propia información
 */
const updateProfile = async (req, res) => {
    const userId = req.user.id_usuario;
    const { nombre, correo } = req.body;

    const updatedUser = await authModel.update(userId, {
        nombre,
        correo
    });

    return successResponse(res, updatedUser, SUCCESS_MESSAGES.UPDATED);
};

/**
 * CAMBIAR CONTRASEÑA
 */
const changePassword = async (req, res) => {
    const userId = req.user.id_usuario;
    const { contrasena_actual, contrasena_nueva } = req.body;

    // Validar campos requeridos
    validateRequiredFields(req.body, ['contrasena_actual', 'contrasena_nueva']);

    // Validar longitud de nueva contraseña
    if (contrasena_nueva.length < 6) {
        throw new BadRequestError('La nueva contraseña debe tener al menos 6 caracteres');
    }

    // Obtener usuario con contraseña
    const user = await authModel.findByUsername(req.user.usuario);

    // Verificar contraseña actual
    const isPasswordValid = await authModel.verifyPassword(
        contrasena_actual,
        user.contrasena_hash
    );

    if (!isPasswordValid) {
        throw new UnauthorizedError('Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    await authModel.updatePassword(userId, contrasena_nueva);

    return successResponse(res, null, 'Contraseña actualizada exitosamente');
};

/**
 * LISTAR USUARIOS (Solo Admin)
 */
const listUsers = async (req, res) => {
    const { rol_id, activo, search } = req.query;

    const filters = {};

    if (rol_id) filters.rol_id = parseInt(rol_id);
    if (activo !== undefined) filters.activo = activo === 'true';
    if (search) filters.search = search;

    const users = await authModel.getAll(filters);

    return successResponse(res, users, 'Usuarios obtenidos exitosamente');
};

/**
 * OBTENER USUARIO POR ID (Solo Admin)
 */
const getUserById = async (req, res) => {
    const { id } = req.params;
    const user = await authModel.findById(id);

    return successResponse(res, user, 'Usuario obtenido exitosamente');
};

/**
 * ACTUALIZAR USUARIO (Solo Admin)
 */
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, activo } = req.body;

    const updatedUser = await authModel.update(id, {
        nombre,
        correo,
        activo
    });

    return successResponse(res, updatedUser, SUCCESS_MESSAGES.UPDATED);
};

/**
 * DESACTIVAR USUARIO (Solo Admin)
 */
const deactivateUser = async (req, res) => {
    const { id } = req.params;

    // No permitir que se desactive a sí mismo
    if (parseInt(id) === req.user.id_usuario) {
        throw new BadRequestError('No puedes desactivarte a ti mismo');
    }

    const user = await authModel.deactivate(id);

    return successResponse(res, user, 'Usuario desactivado exitosamente');
};

/**
 * ACTIVAR USUARIO (Solo Admin)
 */
const activateUser = async (req, res) => {
    const { id } = req.params;
    const user = await authModel.activate(id);

    return successResponse(res, user, 'Usuario activado exitosamente');
};

/**
 * ELIMINAR USUARIO (Solo Admin)
 */
const deleteUser = async (req, res) => {
    const { id } = req.params;

    // No permitir que se elimine a sí mismo
    if (parseInt(id) === req.user.id_usuario) {
        throw new BadRequestError('No puedes eliminarte a ti mismo');
    }

    const user = await authModel.remove(id);

    return successResponse(res, user, SUCCESS_MESSAGES.DELETED);
};

/**
 * LOGOUT
 * En JWT stateless, el logout se maneja en el cliente eliminando el token
 * Esta es una ruta opcional para mantener consistencia
 */
const logout = async (req, res) => {
    // En un sistema JWT puro, no hay nada que hacer en el servidor
    // El cliente debe eliminar el token

    // Si en el futuro quieres implementar blacklist de tokens, aquí lo harías

    return successResponse(res, null, 'Logout exitoso. Token eliminado del cliente');
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    listUsers,
    getUserById,
    updateUser,
    deactivateUser,
    activateUser,
    deleteUser,
    logout
};