// src/config/database.js
const mysql = require('mysql2');

/**
 * POOL DE CONEXIONES
 *
 * ¿Por qué usar un pool?
 * - Reutiliza conexiones en lugar de crear una nueva por cada query
 * - Mejora el rendimiento dramáticamente
 * - Maneja automáticamente la cola de peticiones cuando todas las conexiones están ocupadas
 * - Libera conexiones automáticamente después de usarlas
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tribunal_para_adolescentes',

    // Configuración del pool
    waitForConnections: true,  // Espera si todas las conexiones están ocupadas
    connectionLimit: 10,        // Máximo 10 conexiones simultáneas
    queueLimit: 0,             // Sin límite de cola (cuidado en producción)

    // Timeouts
    connectTimeout: 10000,     // 10 segundos para conectar

    // Configuración de MySQL
    timezone: 'Z',             // UTC (mejor práctica para fechas)
    dateStrings: false,        // Convertir fechas a objetos Date de JS

    // Seguridad
    multipleStatements: false  // Previene inyección SQL con múltiples queries
});

/**
 * VERSIÓN PROMISIFICADA
 *
 * ¿Por qué .promise()?
 * - mysql2 por defecto usa callbacks: pool.query(sql, (err, results) => {})
 * - Con .promise() podemos usar async/await: await pool.query(sql)
 * - Código más limpio y manejo de errores más simple
 */
const promisePool = pool.promise();

/**
 * FUNCIÓN DE PRUEBA DE CONEXIÓN
 *
 * Se ejecuta al iniciar el servidor para verificar que la DB está accesible
 */
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        console.log(`📊 Base de datos: ${process.env.DB_NAME || 'tribunal_para_adolescentes'}`);
        connection.release(); // IMPORTANTE: siempre liberar la conexión
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a MySQL:', error.message);
        console.error('Verifica:');
        console.error('  - MySQL está corriendo');
        console.error('  - Las credenciales en .env son correctas');
        console.error('  - La base de datos existe');
        return false;
    }
};

/**
 * HELPER: Ejecutar query con logging en desarrollo
 *
 * Ventajas:
 * - Centraliza la ejecución de queries
 * - Log automático en desarrollo para debug
 * - Manejo consistente de errores
 * - Fácil agregar métricas o auditoría después
 */
const executeQuery = async (sql, params = []) => {
    const isDev = process.env.NODE_ENV !== 'production';

    try {
        if (isDev) {
            console.log('🔍 SQL Query:', sql);
            console.log('📌 Params:', params);
        }

        const [rows] = await promisePool.execute(sql, params);

        if (isDev) {
            console.log(`✅ Query exitoso - ${rows.length || rows.affectedRows || 0} registros`);
        }

        return rows;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error; // Re-lanzar para que el controlador lo maneje
    }
};

/**
 * HELPER: Ejecutar transacción
 *
 * Uso típico:
 * await executeTransaction(async (connection) => {
 *   await connection.execute('INSERT INTO proceso ...');
 *   await connection.execute('INSERT INTO proceso_carpeta ...');
 * });
 *
 * Si algo falla, hace ROLLBACK automáticamente
 */
const executeTransaction = async (callback) => {
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();
        console.log('🔄 Transacción iniciada');

        // Ejecutar las operaciones del callback
        const result = await callback(connection);

        await connection.commit();
        console.log('✅ Transacción completada');

        return result;
    } catch (error) {
        await connection.rollback();
        console.error('⚠️ Transacción revertida:', error.message);
        throw error;
    } finally {
        connection.release(); // SIEMPRE liberar la conexión
    }
};

/**
 * CERRAR POOL (para shutdown graceful)
 */
const closePool = async () => {
    try {
        await promisePool.end();
        console.log('🔌 Pool de conexiones cerrado');
    } catch (error) {
        console.error('❌ Error al cerrar pool:', error.message);
    }
};

// Exportar todo
module.exports = {
    pool: promisePool,           // Para uso directo si es necesario
    testConnection,              // Para verificar conexión al inicio
    executeQuery,                // Para queries simples
    executeTransaction,          // Para operaciones múltiples
    closePool                    // Para cerrar al apagar servidor
};