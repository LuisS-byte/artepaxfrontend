/**
 * modules/auditoria/js/auditoria.api.js
 * Capa de acceso a datos del módulo Auditoría
 */
window.AuditoriaAPI = {

    /**
     * Obtiene registros de auditoría según los filtros indicados.
     * No toca DOM, no modifica estado, no renderiza.
     *
     * @param {Object} options
     * @param {string} [options.tabla] - Nombre de tabla para filtrar
     * @param {string|number} [options.registroId] - ID de registro para filtrar
     * @param {number} [options.pagina] - Número de página (default 0)
     * @param {number} [options.tamanio] - Tamaño de página (default 50, max 100)
     * @returns {Promise<Array>} Lista de AuditoriaResponseDTO
     */
    async cargarAuditoria({ tabla, registroId, pagina, tamanio } = {}) {
        if (tabla && registroId) {
            return API.auditoria.porRegistro(tabla, registroId);
        }

        if (tabla) {
            return API.auditoria.porTabla(tabla);
        }

        return API.auditoria.list({
            pagina: pagina ?? 0,
            tamanio: tamanio ?? 50
        });
    }
};
