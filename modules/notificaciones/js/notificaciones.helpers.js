/**
 * modules/notificaciones/js/notificaciones.helpers.js
 * Helpers puros del módulo Notificaciones
 */
window.NotificacionesHelpers = {

    /**
     * Formatea un tipo de notificación para display.
     * Ej: "ALERTA_STOCK" → "Alerta Stock"
     * @param {string} tipo
     * @returns {string}
     */
    formatearTipo(tipo) {
        if (!tipo) return '—';
        return tipo
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
    },

    /**
     * Retorna el nombre del ícono Lucide según el tipo de notificación.
     * @param {string} tipo
     * @returns {string}
     */
    iconoPorTipo(tipo) {
        if (!tipo) return 'bell';
        const t = tipo.toUpperCase();
        if (t.includes('STOCK') || t.includes('INVENTARIO')) return 'package';
        if (t.includes('PAGO') || t.includes('SALDO')) return 'wallet';
        if (t.includes('EVENTO') || t.includes('RECORDATORIO')) return 'calendar';
        if (t.includes('MONTAJE')) return 'hammer';
        if (t.includes('CANCEL')) return 'x-circle';
        if (t.includes('CONFIRM')) return 'check-circle';
        if (t.includes('COTIZACION') || t.includes('EXPIRA')) return 'clock';
        return 'bell';
    }
};
