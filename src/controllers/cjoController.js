// src/controllers/cjoController.js

const cjoModel = require('../models/cjoModel');
const {successResponse, createdResponse} = require('../utils/response');
const {validateRequiredFields} = require('../utils/errorHandler');
const {SUCCESS_MESSAGES} = require('../config/constants');

/**
 * CONTROLADOR DE CJO (CARPETA JUICIO ORAL)
 */

const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * CREAR CJO
 * Auto-crea CEMS si sentencia es condenatoria
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, ['numero_cjo', 'cj_id']);

    // Formatear fechas antes de enviar al modelo
    let cjoData = {...req.body};

    if (cjoData.fecha_ingreso) {
        cjoData.fecha_ingreso = formatDate(cjoData.fecha_ingreso);
    }

    if (cjoData.fecha_auto_apertura) {
        cjoData.fecha_auto_apertura = formatDate(cjoData.fecha_auto_apertura);
    }

    if (cjoData.fecha_sentencia) {
        cjoData.fecha_sentencia = formatDate(cjoData.fecha_sentencia);
    }

    if (cjoData.fecha_causo_estado) {
        cjoData.fecha_causo_estado = formatDate(cjoData.fecha_causo_estado);
    }

    if (cjoData.fecha_sentencia_enviada_ejecucion) {
        cjoData.fecha_sentencia_enviada_ejecucion = formatDate(cjoData.fecha_sentencia_enviada_ejecucion);
    }

    const resultado = await cjoModel.create(cjoData);
    const cjo = await cjoModel.getById(resultado.cjo_id);

    let mensaje = 'CJO creada exitosamente';

    if (resultado.cems_creado) {
        mensaje += '. CEMS creado automáticamente (sentencia condenatoria o mixta)';
    }

    return createdResponse(
        res,
        {
            cjo,
            cems_creado: resultado.cems_creado,
            cems_id: resultado.cems_id
        },
        mensaje
    );
};

/**
 * OBTENER TODAS
 */
const getAll = async (req, res) => {
    const {fuero, sentencia, search} = req.query;

    const cjos = await cjoModel.getAll({fuero, sentencia, search});

    return successResponse(
        res,
        cjos,
        'CJOs obtenidas exitosamente'
    );
};

/**
 * OBTENER POR ID
 */
const getById = async (req, res) => {
    const {id} = req.params;

    const cjo = await cjoModel.getById(id);

    return successResponse(
        res,
        cjo,
        'CJO obtenida exitosamente'
    );
};

/**
 * OBTENER POR CJ_ID
 */
const getByCjId = async (req, res) => {
    const { cj_id } = req.params;

    const cjo = await cjoModel.getByCjId(cj_id);

    if (!cjo) {
        return successResponse(
            res,
            null,
            'No existe CJO para esta CJ'
        );
    }

    return successResponse(
        res,
        cjo,
        'CJO obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    // Formatear fechas antes de enviar al modelo
    let cjoData = { ...req.body };

    if (cjoData.fecha_ingreso) {
        cjoData.fecha_ingreso = formatDate(cjoData.fecha_ingreso);
    }

    if (cjoData.fecha_auto_apertura) {
        cjoData.fecha_auto_apertura = formatDate(cjoData.fecha_auto_apertura);
    }

    if (cjoData.fecha_sentencia) {
        cjoData.fecha_sentencia = formatDate(cjoData.fecha_sentencia);
    }

    if (cjoData.fecha_causo_estado) {
        cjoData.fecha_causo_estado = formatDate(cjoData.fecha_causo_estado);
    }

    if (cjoData.fecha_sentencia_enviada_ejecucion) {
        cjoData.fecha_sentencia_enviada_ejecucion = formatDate(cjoData.fecha_sentencia_enviada_ejecucion);
    }

    const resultado = await cjoModel.update(id, cjoData);

    let mensaje = SUCCESS_MESSAGES.UPDATED;

    if (resultado.cems_creado) {
        mensaje += '. CEMS creado automáticamente (sentencia condenatoria o mixta)';
    }

    return successResponse(
        res,
        {
            cjo: resultado.cjo,
            cems_creado: resultado.cems_creado,
            cems_id: resultado.cems_id
        },
        mensaje
    );
};

/**
 * ELIMINAR
 */
const remove = async (req, res) => {
    const {id} = req.params;

    const cjo = await cjoModel.remove(id);

    return successResponse(
        res,
        cjo,
        SUCCESS_MESSAGES.DELETED
    );
};

/**
 * ESTADÍSTICAS
 */
const getStats = async (req, res) => {
    const stats = await cjoModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

module.exports = {
    create,
    getAll,
    getById,
    getByCjId,
    update,
    remove,
    getStats
};