/**
 * modules/inventario/js/inventario.state.js
 * Estado centralizado del módulo Inventario.
 * Objeto plano, sin proxies, sin reactividad.
 * Namespaced como InventarioState para evitar colisiones globales.
 */
window.InventarioState = {
    stockData: [],
    movimientosData: [],
    productosData: [],
    tabActual: 'stock',
    subTabMovimientos: 'todos',
    tipoMovimientoActual: 'entrada',
    paginaMovActual: 0,
    totalPaginasMov: 0,
    movimientosGlobales: [],
    movimientosGlobalesBase: [],
    productoEditandoId: null,
    productoEstadoPendiente: null,
    stepActual: 'select',
    // Computed risk indicators (refreshed after stock load)
    productosRiesgo: [],
    auditSummary: { total: 0, entradas: 0, salidas: 0, conEvento: 0 },
    // Pagination for per-product movements (set if backend returns Page)
    movimientosProductoPagination: null,
    movimientosProductoPaginaActual: 0,
    // Per‑product history search state
    productoHistorialSeleccionadoId: null,
    productoHistorialSeleccionadoNombre: '',
    productosUltimosConsultados: []      // { id, nombre }[] max 5, session scope
};
