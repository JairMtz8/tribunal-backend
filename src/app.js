// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorMiddleware, notFoundMiddleware } = require('./middlewares/errorMiddleware');

/**
 * CONFIGURACIÓN DE LA APLICACIÓN EXPRESS
 */
const app = express();

// ===================================================
// MIDDLEWARE DE SEGURIDAD
// ===================================================

// Helmet: Protección básica de headers HTTP
app.use(helmet());

// CORS: Configuración de orígenes permitidos
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // En producción, especificar dominios exactos
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===================================================
// MIDDLEWARE DE PARSEO
// ===================================================

// Parsear JSON en el body (límite de 10mb para seguridad)
app.use(express.json({ limit: '10mb' }));

// Parsear URL-encoded data (formularios)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===================================================
// LOGGING (solo en desarrollo)
// ===================================================

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📨 ${req.method} ${req.path}`, {
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    });
}

// ===================================================
// RUTAS
// ===================================================

// Ruta de health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Tribunal Para Adolescentes',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Health check específico
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ===================================================
// RUTAS DE LA API
// ===================================================

// Autenticación
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Catálogos
const catalogoRoutes = require('./routes/catalogoRoutes');
app.use('/api/catalogos', catalogoRoutes);

// Conductas (Catálogo de Delitos)
const conductaRoutes = require('./routes/conductaRoutes');
app.use('/api/conductas', conductaRoutes);

// Domicilios
const domicilioRoutes = require('./routes/domicilioRoutes');
app.use('/api/domicilios', domicilioRoutes);

// Adolescentes
const adolescenteRoutes = require('./routes/adolescenteRoutes');
app.use('/api/adolescentes', adolescenteRoutes);

// Procesos
const procesoRoutes = require('./routes/procesoRoutes');
app.use('/api/procesos', procesoRoutes);

// CJ (Carpeta Judicial)
const cjRoutes = require('./routes/cjRoutes');
app.use('/api/cj', cjRoutes);

// CJO (Carpeta Juicio Oral)
const cjoRoutes = require('./routes/cjoRoutes');
app.use('/api/cjo', cjoRoutes);

// CEMCI (Carpeta Ejecución Medida Cautelar Internamiento)
const cemciRoutes = require('./routes/cemciRoutes');
app.use('/api/cemci', cemciRoutes);

// CEMS (Carpeta Ejecución Medidas Sancionadoras)
const cemsRoutes = require('./routes/cemsRoutes');
app.use('/api/cems', cemsRoutes);

// Audiencias
const audienciaRoutes = require('./routes/audienciaRoutes');
app.use('/api/audiencias', audienciaRoutes);

// Medidas Sancionadoras
const medidaSancionadoraRoutes = require('./routes/medidaSancionadoraRoutes');
app.use('/api/medidas-sancionadoras', medidaSancionadoraRoutes);

// Condena
const condenaRoutes = require('./routes/condenaRoutes');
app.use('/api/condena', condenaRoutes);

// Internamiento
const internamientoRoutes = require('./routes/internamientoRoutes');
app.use('/api/internamiento', internamientoRoutes);

// Libertad
const libertadRoutes = require('./routes/libertadRoutes');
app.use('/api/libertad', libertadRoutes);

// CJ Conductas (Conductas del Adolescente)
const cjConductaRoutes = require('./routes/cjConductaRoutes');
app.use('/api/cj-conductas', cjConductaRoutes);

// Víctimas
const victimaRoutes = require('./routes/victimaRoutes');
app.use('/api', victimaRoutes);

// Actores Jurídicos
const actorJuridicoRoutes = require('./routes/actorJuridicoRoutes');
app.use('/api', actorJuridicoRoutes);

// Medidas Cautelares
const medidaCautelarRoutes = require('./routes/medidaCautelarRoutes');
app.use('/api/medidas-cautelares', medidaCautelarRoutes);

// ===================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===================================================

// Capturar rutas no encontradas (404)
app.use(notFoundMiddleware);

// Manejador global de errores (DEBE SER EL ÚLTIMO)
app.use(errorMiddleware);

module.exports = app;