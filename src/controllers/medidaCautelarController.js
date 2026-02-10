// src/controllers/medidaCautelarController.js

const medidaCautelarModel = require('../models/medidaCautelarModel');
const { successResponse, createdResponse } = require('../utils/response');
const { validateRequiredFields } = require('../utils/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * CONTROLADOR DE MEDIDAS CAUTELARES
 */

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

    const resultado = await medidaCautelarModel.create(req.body);
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

    const medida = await medidaCautelarModel.update(id, req.body);

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
    const { fecha_revocacion } = req.body;

    const medida = await medidaCautelarModel.revocar(id, fecha_revocacion);

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
        SUCCESS_MESSAGES.DELETED
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