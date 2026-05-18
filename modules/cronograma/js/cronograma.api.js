/**
 * modules/cronograma/js/cronograma.api.js
 * Payload builders para el módulo Cronograma.
 * Construyen los objetos de request para cada endpoint.
 * Aún no reemplazan la construcción inline en guardarTarea/asignarPersonal.
 */

function buildCreatePayload({ actividad, fechaInicio, fechaFin, idEvento }) {
    return {
        idEvento: Number(idEvento),
        actividad,
        fechaInicio: toApiDateTime(fechaInicio),
        fechaFin: toApiDateTime(fechaFin)
    };
}

function buildUpdatePayload({ actividad, fechaInicio, fechaFin, observacion }) {
    return {
        actividad,
        fechaInicio: toApiDateTime(fechaInicio),
        fechaFin: toApiDateTime(fechaFin),
        cronoObservacion: observacion || null
    };
}

function buildAsignarUsuarioPayload({ usuarioId, pagoAsignado, pagoTipo }) {
    return { usuarioId, pagoAsignado, pagoTipo };
}
