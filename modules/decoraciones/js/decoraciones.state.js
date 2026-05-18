/**
 * modules/decoraciones/js/decoraciones.state.js
 * Estado global del modulo Decoraciones.
 * Objeto plano compartido entre helpers, render, API y actions.
 * Se asigna directamente desde cada submodulo.
 */
window.DecoracionesState = {
    decoraciones: [],
    productosDisponibles: [],
    stockProductos: [],
    stockErroresIds: [],
    ultimaCargaStock: null,
    vistaActual: 'grid',
    decoracionEditandoId: null,
    decoracionEliminandoId: null,
    decoracionAccionPendiente: null,
    composicionOriginalSnapshot: '',
    guardando: false,
    tiposEventoDisponibles: [],
    decoracionDetalleActualId: null
};
