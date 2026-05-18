/**
 * modules/cronograma/js/cronograma.constants.js
 * Constantes del módulo Cronograma.
 */

const EVENTOS_EDITABLES = ['PROGRAMADO', 'CONFIRMADO', 'EN_MONTAJE'];
const ESTADOS_FINALES = ['COMPLETADO', 'CANCELADO'];
const MAPA_ESTADOS_CRONO = {
    PENDIENTE: { clase: 'badge-cotizacion', label: 'Pendiente' },
    EN_PROGRESO: { clase: 'badge-programado', label: 'En progreso' },
    COMPLETADO: { clase: 'badge-confirmado', label: 'Completado' },
    CANCELADO: { clase: 'badge-cancelado', label: 'Cancelado' }
};
