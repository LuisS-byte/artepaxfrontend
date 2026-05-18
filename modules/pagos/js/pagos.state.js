/**
 * modules/pagos/pagos.state.js
 * Estado global centralizado del módulo Pagos.
 * Reemplaza las 14 variables let sueltas que existían en pagos.js.
 * 
 * Acceder siempre como: PagosState.eventoSeleccionadoId, PagosState.tabActual, etc.
 * Mutar directamente: PagosState.eventoSeleccionadoId = '123';
 * 
 * Sin dependencias internas del módulo.
 */

window.PagosState = {
    eventosDisponibles: [],
    pagosActuales: [],
    pagosGlobalesPagina: [],
    eventoSeleccionadoId: null,
    conceptosPago: [],
    estadosPago: [],
    metodosPagoActivos: [],
    metodosPagoTodos: [],
    pagoAnulandoId: null,
    tabActual: 'evento',
    paginaActual: 0,
    totalPaginas: 0,
    resumenesEventos: {},
    filtroEventosPago: 'pendientes',
    busquedaEventosPago: '',
    colaEventosCargando: false,
    busquedaPagosGlobales: ''
};
