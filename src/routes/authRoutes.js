// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { authMiddleware } = require('../middlewares/auth');
const { adminOnly, checkOwnUser } = require('../middlewares/checkRole');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');

/**
 * RUTAS DE AUTENTICACIÓN
 */

// =====================================================
// RUTAS PÚBLICAS (sin autenticación)
// =====================================================

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @body    { usuario, contrasena }
 * @access  Public
 */
router.post(
    '/login',
    [
        body('usuario')
            .trim()
            .notEmpty()
            .withMessage('El usuario es obligatorio'),
        body('contrasena')
            .notEmpty()
            .withMessage('La contraseña es obligatoria'),
        validate
    ],
    asyncHandler(authController.login)
);

// =====================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// =====================================================

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get(
    '/me',
    authMiddleware,
    asyncHandler(authController.getProfile)
);

/**
 * @route   PUT /api/auth/me
 * @desc    Actualizar perfil del usuario actual
 * @body    { nombre?, correo? }
 * @access  Private
 */
router.put(
    '/me',
    authMiddleware,
    [
        body('nombre')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('El nombre no puede estar vacío')
            .isLength({ max: 150 })
            .withMessage('El nombre no puede tener más de 150 caracteres'),
        body('correo')
            .optional()
            .trim()
            .isEmail()
            .withMessage('El correo debe ser válido')
            .normalizeEmail(),
        validate
    ],
    asyncHandler(authController.updateProfile)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario actual
 * @body    { contrasena_actual, contrasena_nueva }
 * @access  Private
 */
router.post(
    '/change-password',
    authMiddleware,
    [
        body('contrasena_actual')
            .notEmpty()
            .withMessage('La contraseña actual es obligatoria'),
        body('contrasena_nueva')
            .notEmpty()
            .withMessage('La nueva contraseña es obligatoria')
            .isLength({ min: 6 })
            .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
        validate
    ],
    asyncHandler(authController.changePassword)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (eliminar token del cliente)
 * @access  Private
 */
router.post(
    '/logout',
    authMiddleware,
    asyncHandler(authController.logout)
);

// =====================================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// =====================================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @body    { nombre, usuario, correo?, contrasena, rol_id }
 * @access  Private (Solo Admin)
 */
router.post(
    '/register',
    authMiddleware,
    adminOnly,
    [
        body('nombre')
            .trim()
            .notEmpty()
            .withMessage('El nombre es obligatorio')
            .isLength({ max: 150 })
            .withMessage('El nombre no puede tener más de 150 caracteres'),
        body('usuario')
            .trim()
            .notEmpty()
            .withMessage('El usuario es obligatorio')
            .isLength({ min: 3, max: 50 })
            .withMessage('El usuario debe tener entre 3 y 50 caracteres')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('El usuario solo puede contener letras, números y guiones bajos'),
        body('correo')
            .optional()
            .trim()
            .isEmail()
            .withMessage('El correo debe ser válido')
            .normalizeEmail(),
        body('contrasena')
            .notEmpty()
            .withMessage('La contraseña es obligatoria')
            .isLength({ min: 6 })
            .withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('rol_id')
            .isInt({ min: 1 })
            .withMessage('El rol_id debe ser un número entero positivo'),
        validate
    ],
    asyncHandler(authController.register)
);

/**
 * @route   GET /api/auth/users
 * @desc    Listar todos los usuarios
 * @query   rol_id?, activo?, search?
 * @access  Private (Solo Admin)
 */
router.get(
    '/users',
    authMiddleware,
    adminOnly,
    asyncHandler(authController.listUsers)
);

/**
 * @route   GET /api/auth/users/:id
 * @desc    Obtener usuario por ID
 * @access  Private (Solo Admin)
 */
router.get(
    '/users/:id',
    authMiddleware,
    adminOnly,
    asyncHandler(authController.getUserById)
);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Actualizar usuario
 * @body    { nombre?, correo?, activo? }
 * @access  Private (Solo Admin)
 */
router.put(
    '/users/:id',
    authMiddleware,
    adminOnly,
    [
        body('nombre')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('El nombre no puede estar vacío')
            .isLength({ max: 150 })
            .withMessage('El nombre no puede tener más de 150 caracteres'),
        body('correo')
            .optional()
            .trim()
            .isEmail()
            .withMessage('El correo debe ser válido')
            .normalizeEmail(),
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('activo debe ser true o false'),
        validate
    ],
    asyncHandler(authController.updateUser)
);

/**
 * @route   POST /api/auth/users/:id/deactivate
 * @desc    Desactivar usuario
 * @access  Private (Solo Admin)
 */
router.post(
    '/users/:id/deactivate',
    authMiddleware,
    adminOnly,
    asyncHandler(authController.deactivateUser)
);

/**
 * @route   POST /api/auth/users/:id/activate
 * @desc    Activar usuario
 * @access  Private (Solo Admin)
 */
router.post(
    '/users/:id/activate',
    authMiddleware,
    adminOnly,
    asyncHandler(authController.activateUser)
);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Eliminar usuario
 * @access  Private (Solo Admin)
 */
router.delete(
    '/users/:id',
    authMiddleware,
    adminOnly,
    asyncHandler(authController.deleteUser)
);

module.exports = router;