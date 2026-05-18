/**
 * modules/cronograma/js/cronograma.helpers.js
 * Funciones auxiliares puras y de formateo del módulo Cronograma.
 */

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function toComparableDate(value, endOfDay = false) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return new Date(`${raw}T${endOfDay ? '23:59:59' : '00:00:00'}`);
    }

    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateKey(value) {
    const date = toComparableDate(value);
    if (!date) return '';
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function combineDateAndTime(dateValue, timeValue) {
    if (!dateValue || !timeValue) return null;
    const dateKey = getDateKey(dateValue);
    if (!dateKey) return null;
    const parsed = new Date(`${dateKey}T${timeValue}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDateTimeInput(value) {
    if (!value) return '';
    return String(value).replace('T', ' ').slice(0, 16);
}

function toApiDateTime(value) {
    return value ? String(value).replace(' ', 'T') : value;
}

function setDateTimeFieldValue(fieldId, value) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const normalized = normalizeDateTimeInput(value);
    if (input._flatpickr) {
        input._flatpickr.setDate(normalized, true, 'Y-m-d H:i');
        return;
    }
    input.value = normalized;
}

function formatCurrency(value) {
    return `$${formatters.precio(Number(value || 0))}`;
}

function getBadgeEstadoEvento(estado) {
    const map = {
        COTIZACION: 'badge-cotizacion',
        PROGRAMADO: 'badge-programado',
        CONFIRMADO: 'badge-confirmado',
        EN_MONTAJE: 'badge-en-montaje',
        FINALIZADO: 'badge-finalizado',
        CANCELACION_PENDIENTE: 'badge-cancelacion-pendiente',
        CANCELADO: 'badge-cancelado'
    };
    return map[estado] || 'badge-cotizacion';
}

function getBadgeCronograma(estado) {
    return modulos.badgeEstado(estado || 'PENDIENTE', MAPA_ESTADOS_CRONO);
}

function getPersonalSummary(asignados) {
    const totalCosto = asignados.reduce((acc, item) => acc + Number(item.pagoAsignado || 0), 0);
    return {
        cantidad: asignados.length,
        totalCosto
    };
}
