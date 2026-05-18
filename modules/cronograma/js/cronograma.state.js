/**
 * modules/cronograma/js/cronograma.state.js
 * Estado mutable del módulo Cronograma.
 * Solo contiene lo que muta durante la sesión.
 * Constantes en cronograma.constants.js.
 */

const state = {
    eventosDisponibles: [],
    tareasActuales: [],
    eventoSeleccionadoId: null,
    eventoSeleccionadoResumen: null,
    tabActual: 'evento',
    paginaActual: 0,
    totalPaginas: 0,
    cronogramaGlobal: [],
    cronogramaGlobalBase: [],
    cronogramaEditandoId: null,
    cronogramaPersonalActual: null,
    confirmacionPendiente: null,
    cronoQueueFiltro: 'todos'
};

window.CronogramaState = {
    state,

    get() {
        return state;
    },

    set(partial) {
        Object.assign(state, partial);
    },

    resetActividadDrawer() {
        state.cronogramaEditandoId = null;
    },

    resetPersonalDrawer() {
        state.cronogramaPersonalActual = null;
    },

    clearConfirmacion() {
        state.confirmacionPendiente = null;
    }
};
