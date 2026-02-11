// src/utils/carpetaUtils.js

const { executeQuery } = require('../config/database');

/**
 * Generar número secuencial para carpetas (CEMCI, CEMS, CJO)
 *
 * @param {string} tipoCarpeta - 'CEMCI', 'CEMS', 'CJO'
 * @param {number} año - Año para el número (ej: 2025)
 * @returns {Promise<string>} - Número generado (ej: 'CEMCI-008/2025')
 */
const generarNumeroCarpeta = async (tipoCarpeta, año = null) => {
    const añoActual = año || new Date().getFullYear();
    const tabla = tipoCarpeta.toLowerCase();
    const columna = `numero_${tabla}`;

    // Obtener el siguiente número disponible
    // Extrae el número de cadenas como "CEMCI-008/2025" y obtiene el máximo
    const sql = `
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING_INDEX(
            SUBSTRING_INDEX(${columna}, '/', 1),  -- Obtiene "CEMCI-008"
            '-', 
            -1                                      -- Obtiene "008"
          ) AS UNSIGNED
        )
      ),
      0
    ) + 1 as siguiente
    FROM ${tabla}
    WHERE ${columna} LIKE CONCAT(?, '-%/', ?)
  `;

    const [result] = await executeQuery(sql, [tipoCarpeta, añoActual]);
    const siguiente = result.siguiente;

    // Formatear con 3 dígitos (001, 002, ..., 010, ...)
    const numeroFormateado = String(siguiente).padStart(3, '0');

    return `${tipoCarpeta}-${numeroFormateado}/${añoActual}`;
};

/**
 * Validar formato de número de carpeta
 *
 * @param {string} numero - Número a validar (ej: 'CEMCI-008/2025')
 * @param {string} tipoCarpeta - Tipo esperado ('CEMCI', 'CEMS', 'CJO')
 * @returns {boolean} - true si es válido
 */
const validarFormatoNumeroCarpeta = (numero, tipoCarpeta) => {
    // Formato: TIPO-###/YYYY
    const regex = new RegExp(`^${tipoCarpeta}-\\d{3}\\/\\d{4}$`);
    return regex.test(numero);
};

/**
 * Verificar si un número de carpeta ya existe
 *
 * @param {string} numero - Número a verificar
 * @param {string} tipoCarpeta - 'CEMCI', 'CEMS', 'CJO'
 * @param {number} idExcluir - ID a excluir de la búsqueda (para updates)
 * @returns {Promise<boolean>} - true si existe
 */
const existeNumeroCarpeta = async (numero, tipoCarpeta, idExcluir = null) => {
    const tabla = tipoCarpeta.toLowerCase();
    const columna = `numero_${tabla}`;
    const idColumna = `id_${tabla}`;

    let sql = `SELECT ${idColumna} FROM ${tabla} WHERE ${columna} = ?`;
    const params = [numero];

    if (idExcluir) {
        sql += ` AND ${idColumna} != ?`;
        params.push(idExcluir);
    }

    const result = await executeQuery(sql, params);
    return result.length > 0;
};

module.exports = {
    generarNumeroCarpeta,
    validarFormatoNumeroCarpeta,
    existeNumeroCarpeta
};