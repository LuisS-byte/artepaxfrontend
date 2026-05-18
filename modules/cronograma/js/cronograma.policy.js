/**
 * modules/cronograma/js/cronograma.policy.js
 * Reglas de negocio y permisos del módulo Cronograma.
 * Prioriza flags del backend (editable, cancelable, accionesPermitidas).
 * El fallback manual es solo defensa visual, no regla principal.
 */

function esEventoEditable(evento) {
    return EVENTOS_EDITABLES.includes(evento?.estadoEventoNombre);
}

function esVencida(row) {
    if (!row || ESTADOS_FINALES.includes(row.cronoEstado)) return false;
    const fechaFin = toComparableDate(row.fechaFin);
    if (!fechaFin) return false;
    return fechaFin < new Date();
}

function esEditableCronograma(row) {
    if (typeof row?.editable === 'boolean') return row.editable;
    return !ESTADOS_FINALES.includes(row?.cronoEstado) && EVENTOS_EDITABLES.includes(row?.estadoEventoNombre);
}

function esCancelableCronograma(row) {
    if (typeof row?.cancelable === 'boolean') return row.cancelable;
    return ['PENDIENTE', 'EN_PROGRESO'].includes(row?.cronoEstado);
}

function getAccionesPermitidas(row) {
    const acciones = safeArray(row?.accionesPermitidas);
    if (acciones.length) return acciones;
    if (row?.cronoEstado === 'PENDIENTE') return ['INICIAR', 'CANCELAR'];
    if (row?.cronoEstado === 'EN_PROGRESO') return ['COMPLETAR', 'CANCELAR'];
    return [];
}

function getEstadosSiguientes(row) {
    const estados = safeArray(row?.estadosSiguientesPermitidos);
    if (estados.length) return estados;
    if (row?.cronoEstado === 'PENDIENTE') return ['EN_PROGRESO', 'CANCELADO'];
    if (row?.cronoEstado === 'EN_PROGRESO') return ['COMPLETADO', 'CANCELADO'];
    return [];
}
