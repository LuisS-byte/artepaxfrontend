/**
 * modules/notificaciones/js/notificaciones.state.js
 * Estado centralizado del módulo Notificaciones
 */
const NotificacionesState = {
    notificacionesActuales: [],
    tiposDetectados: new Set(),
    notificacionesFiltradas: [],
    NOTI_PAGE_SIZE: 25
};
window.NotificacionesState = NotificacionesState;
