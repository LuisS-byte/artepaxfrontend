/**
 * modules/documentos/js/documentos.state.js
 * Estado centralizado del módulo Documentos.
 * Incluye estado de cola de eventos, stats cacheados y editor de plantillas.
 */
(function () {
    'use strict';

    window.DocumentosState = {
        // ── Eventos y documentos ──
        eventosDisponibles: [],
        documentosActuales: [],
        documentosGlobales: [],
        documentosGlobalesBase: [],
        eventoSeleccionadoId: null,
        eventoSeleccionadoResumen: null,
        resumenPagoEvento: null,

        // ── Cola de eventos (workspace) ──
        filtroEventosDoc: 'cotizacion',  // 'cotizacion' | 'con-deuda' | 'activos' | 'finalizados'
        eventosSaldoPendiente: {},        // { [eventoId]: saldoPendiente } (de API.pagos.eventosCobranza)
        busquedaEventosDoc: '',
        colaCargando: true,
        docsStatsPorEvento: {},           // { [eventoId]: { total, enviados, pendientes, fallidos, tieneProblemas } }

        // ── Tabs ──
        tabActual: 'evento',

        // ── Editor de plantillas ──
        plantillaEditando: null,
        quillEditor: null,
        formularioModificado: false,

        // ── Paginación global ──
        paginaGlobalActual: 0,
        totalPaginasGlobal: 0,

        // ── Reenvío ──
        reenviarPendienteId: null,
        generacionesEnCurso: new Set(),
        reenviandoEnCurso: false,

        // ── Filtros globales ──
        filtrosGlobales: { query: '', estado: 'todos' },

        // ── Editor de plantillas — camposEditables ──
        camposEditablesActuales: null,
        modoEditorActual: 'campos' // 'campos' | 'preview' | 'tecnico'
    };
})();
