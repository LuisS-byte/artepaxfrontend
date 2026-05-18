/**
 * modules/documentos/js/documentos.api.js
 * Capa de abstracción de llamadas HTTP para el módulo Documentos.
 * Fase 2 — Wrappers finos sobre API.* compartida.
 */
(function () {
    'use strict';

    window.DocumentosAPI = {
        /**
         * Obtiene todos los eventos activos para poblar el selector.
         * @returns {Promise<Array>}
         */
        listarEventos: async function () {
            const response = await API.eventos.list();
            if (Array.isArray(response)) return response;
            if (Array.isArray(response?.content)) return response.content;
            return [];
        },

        /**
         * Lista documentos de un evento específico.
         * @param {number|string} eventoId
         * @returns {Promise<Array>}
         */
        listarDocumentosEvento: function (eventoId) {
            return API.documentos.porEvento(eventoId);
        },

        /**
         * Obtiene eventos con datos de cobranza (para filtro "Con deuda").
         * @returns {Promise<Array>}
         */
        listarCobranzaEventos: async function () {
            const response = await API.pagos.eventosCobranza();
            return Array.isArray(response) ? response : [];
        },

        /**
         * Obtiene resumen financiero de un evento (para saldo pendiente).
         * @param {number|string} eventoId
         * @returns {Promise<Object|null>}
         */
        obtenerResumenPago: function (eventoId) {
            return API.pagos.resumen(eventoId);
        },

        /**
         * Genera un documento de un tipo específico para un evento.
         * @param {number|string} eventoId
         * @param {string} tipo - DocumentoTipo: COTIZACION_EVENTO, CONFIRMACION_RESERVA, etc.
         * @returns {Promise<Object>}
         */
        generarDocumento: function (eventoId, tipo) {
            return API.documentos.generar(eventoId, tipo);
        },

        /**
         * Genera aviso de saldo pendiente para un evento.
         * @param {number|string} eventoId
         * @returns {Promise<Object>}
         */
        generarAvisoSaldoPendiente: function (eventoId) {
            return API.documentos.avisoSaldoPendiente(eventoId);
        },

        /**
         * Reenvía un documento existente al correo del cliente.
         * @param {number|string} idDocumento
         * @returns {Promise<Object>}
         */
        reenviarDocumento: function (idDocumento) {
            return API.documentos.reenviar(idDocumento);
        },

        /**
         * Lista todos los documentos con paginación.
         * @param {Object} params - { page, size, sort }
         * @returns {Promise<Object>} - { content, totalPages, ... }
         */
        listarDocumentosGlobales: function (params) {
            return API.documentos.list(params);
        },

        /**
         * Lista todas las plantillas de documentos.
         * @returns {Promise<Array>}
         */
        listarPlantillas: function () {
            return API.documentos.plantillas.list();
        },

        /**
         * Obtiene una plantilla por ID.
         * @param {number|string} id
         * @returns {Promise<Object>}
         */
        obtenerPlantilla: function (id) {
            return API.documentos.plantillas.get(id);
        },

        /**
         * Actualiza una plantilla (contenidoBase, camposEditables, activo).
         * @param {number|string} id
         * @param {Object} payload - { contenidoBase, activo }
         * @returns {Promise<Object>}
         */
        actualizarPlantilla: function (id, payload) {
            return API.documentos.plantillas.actualizar(id, payload);
        }
    };
})();
