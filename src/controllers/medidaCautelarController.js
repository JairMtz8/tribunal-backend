// src/controllers/medidaCautelarController.js

const medidaCautelarModel = require('../models/medidaCautelarModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE MEDIDAS CAUTELARES
 */

// Función helper para formatear fechas
const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // "2026-02-19"
};

/**
 * CREAR MEDIDA CAUTELAR
 * Auto-crea CEMCI si el tipo lo requiere
 */
const create = async (req, res) => {
    validateRequiredFields(req.body, [
        'proceso_id',
        'tipo_medida_cautelar_id',
        'fecha_medida_cautelar'
    ]);

    // Formatear fechas antes de crear
    let medidaData = { ...req.body };

    if (medidaData.fecha_medida_cautelar) {
        medidaData.fecha_medida_cautelar = formatDate(medidaData.fecha_medida_cautelar);
    }

    if (medidaData.fecha_revocacion_medida) {
        medidaData.fecha_revocacion_medida = formatDate(medidaData.fecha_revocacion_medida);
    }

    const resultado = await medidaCautelarModel.create(medidaData);
    const medida = await medidaCautelarModel.getById(resultado.medida_id);

    let mensaje = 'Medida cautelar creada exitosamente';

    if (resultado.genera_cemci && resultado.cemci_id) {
        mensaje += '. CEMCI creado automáticamente';
    }

    return createdResponse(
        res,
        {
            medida,
            cemci_creado: resultado.genera_cemci,
            cemci_id: resultado.cemci_id
        },
        mensaje
    );
};

/**
 * OBTENER MEDIDAS DE UN PROCESO
 */
const getByProcesoId = async (req, res) => {
    const { proceso_id } = req.params;

    const medidas = await medidaCautelarModel.getByProcesoId(proceso_id);

    return successResponse(
        res,
        medidas,
        'Medidas cautelares obtenidas exitosamente'
    );
};

/**
 * OBTENER MEDIDAS ACTIVAS DE UN PROCESO
 */
const getMedidasActivas = async (req, res) => {
    const { proceso_id } = req.params;

    const medidas = await medidaCautelarModel.getMedidasActivas(proceso_id);

    return successResponse(
        res,
        medidas,
        'Medidas activas obtenidas exitosamente'
    );
};

/**
 * OBTENER MEDIDA POR ID
 */
const getById = async (req, res) => {
    const { id } = req.params;

    const medida = await medidaCautelarModel.getById(id);

    return successResponse(
        res,
        medida,
        'Medida cautelar obtenida exitosamente'
    );
};

/**
 * ACTUALIZAR MEDIDA CAUTELAR
 */
const update = async (req, res) => {
    const { id } = req.params;

    // Formatear fechas antes de actualizar
    let medidaData = { ...req.body };

    if (medidaData.fecha_medida_cautelar) {
        medidaData.fecha_medida_cautelar = formatDate(medidaData.fecha_medida_cautelar);
    }

    if (medidaData.fecha_revocacion_medida) {
        medidaData.fecha_revocacion_medida = formatDate(medidaData.fecha_revocacion_medida);
    }

    const medida = await medidaCautelarModel.update(id, medidaData);

    return successResponse(
        res,
        medida,
        SUCCESS_MESSAGES.UPDATED
    );
};

/**
 * REVOCAR MEDIDA CAUTELAR
 */
const revocar = async (req, res) => {
    const { id } = req.params;

    let revocarData = { ...req.body };

    if (revocarData.fecha_revocacion_medida) {
        revocarData.fecha_revocacion_medida = formatDate(revocarData.fecha_revocacion_medida);
    }

    const medida = await medidaCautelarModel.revocar(id, revocarData);

    return successResponse(
        res,
        medida,
        'Medida cautelar revocada exitosamente'
    );
};

/**
 * ELIMINAR MEDIDA CAUTELAR
 */
const remove = async (req, res) => {
    const { id } = req.params;

    const medida = await medidaCautelarModel.remove(id);

    return successResponse(
        res,
        medida,
        'Medida cautelar eliminada exitosamente'
    );
};

/**
 * ESTADÍSTICAS DE MEDIDAS CAUTELARES
 */
const getStats = async (req, res) => {
    const stats = await medidaCautelarModel.getStats();

    return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente'
    );
};

/**
 * VERIFICAR SI PROCESO TIENE MEDIDAS PRIVATIVAS
 */
const verificarPrivativas = async (req, res) => {
    const { proceso_id } = req.params;

    const tiene = await medidaCautelarModel.tieneMedidasPrivativas(proceso_id);

    return successResponse(
        res,
        { tiene_medidas_privativas: tiene },
        'Verificación completada'
    );
};

module.exports = {
    create,
    getByProcesoId,
    getMedidasActivas,
    getById,
    update,
    revocar,
    remove,
    getStats,
    verificarPrivativas
};