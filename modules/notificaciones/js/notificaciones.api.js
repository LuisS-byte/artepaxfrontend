/**
 * modules/notificaciones/js/notificaciones.api.js
 * Capa de acceso a datos del módulo Notificaciones
 */
window.NotificacionesAPI = {

    /**
     * Obtiene las notificaciones del usuario autenticado.
     * GET /api/notificaciones/mias → List<NotificacionResponseDTO>
     * @returns {Promise<Array>}
     */
    async cargarMias() {
        return API.notificaciones.mias();
    },

    /**
     * Marca una notificación como leída.
     * PATCH /api/notificaciones/{id}/leer → 204 No Content
     * @param {number} id - ID de la notificación
     * @returns {Promise<void>}
     */
    async marcarLeida(id) {
        return API.notificaciones.leer(id);
    }
};
