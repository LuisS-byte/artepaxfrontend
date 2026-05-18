/**
 * modules/gastos/js/gastos.state.js
 * Estado centralizado del módulo Gastos.
 * Fase 2 — Variables globales como objeto plano en namespace propio.
 */
(function () {
    'use strict';

    window.GastosState = {
        gastosActuales: [],
        resumenEventoActual: null,
        eventoSeleccionadoId: null,
        eventoSeleccionadoResumen: null,
        tabActual: 'evento',
        paginaActual: 0,
        totalPaginas: 0,
        totalElementos: 0,
        gastosGlobales: [],
        gastosGlobalesBase: [],
        accionPendiente: null,

        // -- UX Filters -------------------------------------------------------
        busqueda: '',
        kpiActivo: null,
        filtroCombinado: [],

        // -- Cola de eventos (control de egresos) -----------------------------
        eventosControl: [],
        filtroCola: 'pendientes',
        busquedaCola: '',
        colaCargando: false
    };
})();
