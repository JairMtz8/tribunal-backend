// server.js
require('dotenv').config();

const app = require('./src/app');
const { testConnection, closePool } = require('./src/config/database');

/**
 * CONFIGURACIÓN DEL SERVIDOR
 */
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * INICIAR SERVIDOR
 */
const startServer = async () => {
    try {
        // 1. Probar conexión a la base de datos
        console.log('🔌 Conectando a MySQL...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.error('El servidor no se iniciará sin conexión a DB');
            process.exit(1);
        }

        // 2. Iniciar el servidor Express
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════╗');
            console.log('║   🚀 Servidor Express iniciado exitosamente   ║');
            console.log('╚════════════════════════════════════════════════╝');
            console.log('');
            console.log(`🌍 Entorno: ${NODE_ENV}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`📊 Base de datos: ${process.env.DB_NAME || 'tribunal_para_adolescentes'}`);
            console.log('');
            console.log('Rutas disponibles:');
            console.log(`  GET  http://localhost:${PORT}/`);
            console.log(`  GET  http://localhost:${PORT}/health`);
            console.log('');
            console.log('Presiona CTRL+C para detener el servidor');
            console.log('');
        });

        // 3. Manejo de cierre graceful
        const gracefulShutdown = async (signal) => {
            console.log('');
            console.log(`⚠️  ${signal} recibido. Cerrando servidor...`);

            // Cerrar servidor HTTP
            server.close(async () => {
                console.log('🔌 Servidor HTTP cerrado');

                // Cerrar pool de conexiones
                await closePool();

                console.log('✅ Cierre graceful completado');
                process.exit(0);
            });

            // Timeout de 10 segundos para forzar cierre
            setTimeout(() => {
                console.error('⏱️  Timeout: forzando cierre del servidor');
                process.exit(1);
            }, 10000);
        };

        // Escuchar señales de terminación
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Manejo de errores no capturados
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();