window.formatters = {
    fecha(str) {
        if (!str) return '—';
        return new Date(str).toLocaleDateString('es-SV');
    },

    precio(valor) {
        if (valor === null || valor === undefined) return '—';
        return Number(valor).toLocaleString('es-GT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    textoSeguro(str) {
        return String(str ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
};

window.formatFecha = function formatFecha(str) {
    if (!str) return '—';

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [y, m, d] = str.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
    }

    return window.formatters.fecha(str);
};

window.formatPrecio = function formatPrecio(valor) {
    return window.formatters.precio(valor);
};

window.escapeStr = function escapeStr(str) {
    return String(str || '').replace(/'/g, '').replace(/"/g, '');
};

/**
 * escapeHtml - Escapa caracteres HTML para prevenir XSS.
 * Uso: ${escapeHtml(valor)} en template literals.
 */
window.escapeHtml = function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
};

/**
 * formatFechaHora - Formatea una fecha ISO a DD/MM/AAAA HH:MM.
 */
window.formatFechaHora = function formatFechaHora(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * debounce - Evita ejecutar una función hasta que pasen `delay` ms sin llamarla.
 * Uso: input.addEventListener('input', debounce(() => buscar(), 300));
 */
window.debounce = function debounce(fn, delay = 300) {
    let timeoutId;
    return function debouncedFunction(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
};
