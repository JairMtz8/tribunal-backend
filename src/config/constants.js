// src/config/constants.js

/**
 * CONSTANTES DEL SISTEMA
 *
 * Centraliza valores que se usan en múltiples lugares
 * Facilita mantenimiento y cambios futuros
 */

// ROLES DEL SISTEMA
const ROLES = {
    ADMIN: 'Administrador',
    JUZGADO: 'Juzgado',
    JUZGADO_EJECUCION: 'Juzgado Ejecución',
};

// TIPOS DE FUERO
const FUERO = {
    COMUN: 'Común',
    FEDERAL: 'Federal'
};

// TIPOS DE CARPETA
const TIPO_CARPETA = {
    CJ: 'CJ',
    CJO: 'CJO',
    CEMCI: 'CEMCI',
    CEMS: 'CEMS'
};

// SEXOS
const SEXO = {
    HOMBRE: 'Hombre',
    MUJER: 'Mujer',
    OTRO: 'Otro',
    NA: 'N/A'
};

// TIPOS DE ACTOR JURÍDICO
const TIPO_ACTOR = {
    DEFENSA: 'defensa',
    FISCAL: 'fiscal',
    ASESOR: 'asesor juridico',
    JUEZ: 'juez',
    REPRESENTANTE: 'representante',
    JUEZ_APOYO: 'juez apoyo'
};

// ESTADOS PROCESALES COMUNES
const ESTADO_PROCESAL = {
    ACTIVO: 'Activo',
    SUSPENDIDO: 'Suspendido',
    CONCLUIDO: 'Concluido',
    ARCHIVADO: 'Archivado'
};

// STATUS GENERALES
const STATUS = {
    ACTIVO: 'Activo',
    INACTIVO: 'Inactivo',
    CONCLUIDO: 'Concluido'
};

// VALIDACIONES
const VALIDATION = {
    // Longitudes máximas
    MAX_VARCHAR_50: 50,
    MAX_VARCHAR_100: 100,
    MAX_VARCHAR_150: 150,
    MAX_VARCHAR_200: 200,

    // Formatos
    REGEX_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    REGEX_TELEFONO: /^[0-9]{10}$/,
    REGEX_NUMERO_CARPETA: /^[A-Z0-9\-\/]+$/i,

    // Edad
    EDAD_MINIMA_ADOLESCENTE: 12,
    EDAD_MAXIMA_ADOLESCENTE: 17,

    // Paginación
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// MENSAJES DE ERROR COMUNES
const ERROR_MESSAGES = {
    // Generales
    NOT_FOUND: 'Registro no encontrado',
    ALREADY_EXISTS: 'El registro ya existe',
    INVALID_ID: 'ID inválido',

    // Adolescente
    ADOLESCENTE_NOT_FOUND: 'Adolescente no encontrado',
    ADOLESCENTE_HAS_PROCESO: 'El adolescente ya tiene un proceso asignado',
    ADOLESCENTE_EDAD_INVALIDA: 'La edad del adolescente debe estar entre 12 y 17 años',

    // Proceso
    PROCESO_NOT_FOUND: 'Proceso no encontrado',
    PROCESO_YA_TIENE_CJO: 'El proceso ya tiene una carpeta CJO asignada',
    PROCESO_YA_TIENE_CEMCI: 'El proceso ya tiene una carpeta CEMCI asignada',
    PROCESO_YA_TIENE_CEMS: 'El proceso ya tiene una carpeta CEMS asignada',

    // Carpetas
    CJ_NOT_FOUND: 'Carpeta Judicial (CJ) no encontrada',
    CJO_NOT_FOUND: 'Carpeta de Juicio Oral (CJO) no encontrada',
    CJO_REQUIERE_CJ: 'Para crear un CJO debe existir primero un CJ',
    CEMCI_NOT_FOUND: 'Carpeta CEMCI no encontrada',
    CEMS_NOT_FOUND: 'Carpeta CEMS no encontrada',
    CEMS_REQUIERE_CJ_CJO: 'Para crear un CEMS debe existir primero un CJ y un CJO',

    // Fechas
    FECHA_INVALIDA: 'Formato de fecha inválido (use YYYY-MM-DD)',
    FECHA_FUTURA: 'La fecha no puede ser futura',
    FECHA_SECUENCIA_INVALIDA: 'La secuencia de fechas es inválida',

    // Autenticación
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'No tienes permisos para esta acción',
    TOKEN_EXPIRED: 'Token expirado',
    INVALID_CREDENTIALS: 'Credenciales inválidas'
};

// MENSAJES DE ÉXITO COMUNES
const SUCCESS_MESSAGES = {
    CREATED: 'Registro creado exitosamente',
    UPDATED: 'Registro actualizado exitosamente',
    DELETED: 'Registro eliminado exitosamente',
    RETRIEVED: 'Datos obtenidos exitosamente'
};

// REGLAS DE NEGOCIO
const BUSINESS_RULES = {
    // Un adolescente solo puede tener un proceso
    ONE_PROCESO_PER_ADOLESCENTE: true,

    // Un CJ puede tener máximo un CJO
    ONE_CJO_PER_CJ: true,

    // Un CJO puede tener máximo un CEMS
    ONE_CEMS_PER_CJO: true,

    // CEMS requiere CJ y CJO
    CEMS_REQUIRES_CJ_AND_CJO: true
};

module.exports = {
    ROLES,
    FUERO,
    TIPO_CARPETA,
    SEXO,
    TIPO_ACTOR,
    ESTADO_PROCESAL,
    STATUS,
    VALIDATION,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    BUSINESS_RULES
};