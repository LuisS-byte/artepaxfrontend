/**
 * modules/pagos/pagos.permissions.js
 * Reglas de negocio, permisos visuales y badges del módulo Pagos.
 * Fuente de verdad: backend (02_PAGO_CONTRATO_BACKEND.md §6 y §10.4).
 * 
 * Dependencias: modulos.badgeEstado() (js/shared/modulos.js).
 * Sin dependencias internas del módulo.
 */

// ── Estados de evento que permiten operaciones de pago ──
const ESTADOS_EVENTO_PERMITEN_PAGOS = [
    'PROGRAMADO',
    'CONFIRMADO',
    'EN_MONTAJE',
    'PENDIENTE_COBRO'
];

// ── Mapa de badges CSS por estado de evento ──
const BADGE_ESTADO_EVENTO_MAP = {
    COTIZACION:             'badge-cotizacion',
    PROGRAMADO:             'badge-programado',
    CONFIRMADO:             'badge-confirmado',
    EN_MONTAJE:             'badge-en-montaje',
    PENDIENTE_COBRO:        'badge-pendiente-cobro',
    FINALIZADO:             'badge-finalizado',
    CANCELACION_PENDIENTE:  'badge-cancelacion-pendiente',
    CANCELADO:              'badge-cancelado'
};

// ── Mapa de badges CSS por estado de pago ──
const BADGE_ESTADO_PAGO_MAP = {
    PENDIENTE:              { clase: 'badge-warning',                label: 'Pendiente' },
    PAGADO:                 { clase: 'badge-confirmado',             label: 'Pagado' },
    CANCELADO:              { clase: 'badge-cancelado',              label: 'Cancelado' },
    DEVOLUCION_PENDIENTE:   { clase: 'badge-cancelacion-pendiente',  label: 'Devolución pendiente' }
};

// ── Permisos ─────────────────────────────────────────────────

/**
 * Indica si un estado de evento permite registrar o confirmar pagos.
 * Regla backend: PROGRAMADO, CONFIRMADO, EN_MONTAJE, PENDIENTE_COBRO.
 */
function estadoPermitePagos(estadoEvento) {
    return ESTADOS_EVENTO_PERMITEN_PAGOS.includes(estadoEvento);
}

// Aliases — preservan compatibilidad con código existente.
// Se unificarán en Fase 6 (drawers).
var estadoPermiteRegistrarPagos = estadoPermitePagos;
var estadoPermiteConfirmarPagos = estadoPermitePagos;

// ── Badges ───────────────────────────────────────────────────

/**
 * Renderiza el badge HTML para un estado de pago.
 * @param {string} estadoPago - PENDIENTE | PAGADO | CANCELADO | DEVOLUCION_PENDIENTE
 * @returns {string} HTML del badge
 */
function getBadgeEstadoPago(estadoPago) {
    const estadoNormalizado = estadoPago || 'PENDIENTE';
    return modulos.badgeEstado(estadoNormalizado, BADGE_ESTADO_PAGO_MAP);
}

/**
 * Devuelve la clase CSS de badge para un estado de evento.
 * @param {string} estado - COTIZACION | PROGRAMADO | CONFIRMADO | ...
 * @returns {string} clase CSS (ej: 'badge-programado')
 */
function getBadgeEstadoEvento(estado) {
    return BADGE_ESTADO_EVENTO_MAP[estado] || 'badge-cotizacion';
}

/**
 * Renderiza el badge HTML de activo/inactivo para métodos de pago.
 * @param {boolean} activo
 * @returns {string} HTML del badge
 */
function getBadgeMetodoActivo(activo) {
    return activo
        ? '<span class="badge badge-confirmado">Activo</span>'
        : '<span class="badge badge-cancelado">Inactivo</span>';
}
