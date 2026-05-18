/**
 * modules/gastos/js/gastos.api.js
 * Capa de abstracción de llamadas HTTP para el módulo Gastos.
 * Fase 3 — Wrappers finos sobre API.* compartida.
 */
(function () {
    'use strict';

    window.GastosAPI = {
        /**
         * Obtiene todos los eventos activos para poblar el selector.
         * @returns {Promise<Array>}
         */
        listarEventos: function () {
            return API.eventos.list();
        },

        /**
         * Lista gastos globales con paginación y orden.
         * @param {Object} params - { page, size, sort }
         * @returns {Promise<Object>} - { content, totalPages, totalElements, ... }
         */
        listarGastos: function (params) {
            return API.gastos.list(params);
        },

        /**
         * Lista gastos de un evento específico.
         * @param {number|string} eventoId
         * @returns {Promise<Array>}
         */
        listarGastosPorEvento: function (eventoId) {
            return API.gastos.porEvento(eventoId);
        },

        /**
         * Obtiene resumen financiero de un evento.
         * @param {number|string} eventoId
         * @returns {Promise<Object|null>}
         */
        obtenerResumenEvento: function (eventoId) {
            return API.gastos.resumen(eventoId);
        },

        /**
         * Crea un nuevo gasto.
         * @param {Object} payload - { eventoId, gastoConcepto, gastoMonto, gastoEstado, gastoNota }
         * @returns {Promise<Object>}
         */
        crearGasto: function (payload) {
            return API.gastos.crear(payload);
        },

        /**
         * Marca un gasto como desembolsado.
         * @param {number|string} id
         * @returns {Promise<Object>}
         */
        desembolsarGasto: function (id) {
            return API.gastos.desembolsar(id);
        },

        /**
         * Elimina un gasto.
         * @param {number|string} id
         * @returns {Promise<Object>}
         */
        eliminarGasto: function (id) {
            return API.gastos.eliminar(id);
        },

        /**
         * Obtiene los eventos disponibles para la cola de control de egresos.
         * @returns {Promise<Array>}
         */
        listarEventosControl: function () {
            return API.gastos.eventosControl();
        }
    };
})();
