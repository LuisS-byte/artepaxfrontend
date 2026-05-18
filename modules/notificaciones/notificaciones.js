/**
 * modules/notificaciones/notificaciones.js
 * Orquestador del módulo Notificaciones
 */

// Wrappers globales para handlers HTML (onclick/onchange)
async function cargarNotificaciones()    { return NotificacionesActions.cargarNotificaciones(); }
function filtrarNotificaciones()         { NotificacionesActions.filtrarNotificaciones(); }
function marcarLeida(id)                 { NotificacionesActions.marcarLeida(id); }
async function marcarTodasLeidas()       { return NotificacionesActions.marcarTodasLeidas(); }

// ── INIT ───────────────────────────────────────────────────
// requireAuth() ya se ejecutó como script inline inmediato (ver HTML).
// DOMContentLoaded: sidebar + init del módulo.
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar('notificaciones', 'Notificaciones');
    NotificacionesActions.init();
});
