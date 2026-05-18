/**
 * modules/pagos/js/pagos.movimientos.js
 * Pagos globales: carga paginada, filtros, resumen de movimientos y paginación.
 * 
 * Dependencias:
 *   PagosState                       (js/pagos.state.js)
 *   PagosColumns                     (js/pagos.columns.js)
 *   renderEmptyRow()                 (js/pagos.evento.js)
 *   normalizarTextoBusqueda()        (js/pagos.js)
 *   toComparableDate()               (js/pagos.js)
 *   modulos.*                        (js/shared/modulos.js)
 *   API.pagos.*                      (js/shared/api.js)
 *   mostrarAlerta()                  (js/shared/alerts.js)
 */

// ── Filtros ────────────────────────────────────────────────

function aplicarFiltrosPagosGlobales(items) {
    const estado = document.getElementById('filter-estado-pago')?.value || '';
    const concepto = document.getElementById('filter-concepto-pago')?.value || '';
    const fechaDesde = toComparableDate(document.getElementById('filter-fecha-desde')?.value || '', false);
    const fechaHasta = toComparableDate(document.getElementById('filter-fecha-hasta')?.value || '', true);
    const query = normalizarTextoBusqueda(PagosState.busquedaPagosGlobales);

    return items.filter(row => {
        const estadoPago = row.estadoPagoNombre || row.estadoPago || '';
        const conceptoPago = row.conceptoPago || '';
        const fechaPago = toComparableDate(row.fecha);
        const bag = normalizarTextoBusqueda([
            row.clienteNombre,
            row.estadoEventoNombre,
            row.conceptoPago,
            row.metodoPago,
            row.eventoId,
            row.id
        ].join(' '));

        if (estado && estadoPago !== estado) return false;
        if (concepto && conceptoPago !== concepto) return false;
        if (fechaDesde && (!fechaPago || fechaPago < fechaDesde)) return false;
        if (fechaHasta && (!fechaPago || fechaPago > fechaHasta)) return false;
        if (query && !bag.includes(query)) return false;
        return true;
    });
}

// ── Resumen de movimientos ─────────────────────────────────

function actualizarResumenMovimientos(items) {
    const visibles = items.length;
    const pendientes = items.filter(row => (row.estadoPagoNombre || row.estadoPago) === 'PENDIENTE').length;
    const pagados = items.filter(row => (row.estadoPagoNombre || row.estadoPago) === 'PAGADO').length;
    const devoluciones = items.filter(row => (row.estadoPagoNombre || row.estadoPago) === 'DEVOLUCION_PENDIENTE').length;

    const visiblesEl = document.getElementById('movimientos-visibles');
    const pendientesEl = document.getElementById('movimientos-pendientes');
    const pagadosEl = document.getElementById('movimientos-pagados');
    const devolucionesEl = document.getElementById('movimientos-devolucion');

    if (visiblesEl) visiblesEl.textContent = visibles;
    if (pendientesEl) pendientesEl.textContent = pendientes;
    if (pagadosEl) pagadosEl.textContent = pagados;
    if (devolucionesEl) devolucionesEl.textContent = devoluciones;
}

// ── Limpiar filtros ────────────────────────────────────────

function limpiarFiltrosMovimientos() {
    const ids = ['filter-estado-pago', 'filter-concepto-pago', 'filter-fecha-desde', 'filter-fecha-hasta', 'input-buscar-pago-global'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    PagosState.busquedaPagosGlobales = '';
    renderPagosGlobalesFiltrados();
}

// ── Render filtrado ────────────────────────────────────────

function renderPagosGlobalesFiltrados() {
    const filtrados = aplicarFiltrosPagosGlobales(PagosState.pagosGlobalesPagina);
    actualizarResumenMovimientos(filtrados);

    if (!filtrados.length) {
        renderEmptyRow('tabla-pagos-global', 8, 'No hay pagos para los filtros aplicados en esta página.');
        return;
    }

    modulos.renderTabla(filtrados, 'tabla-pagos-global', PagosColumns.PAGOS_GLOBAL);
}

// ── Carga paginada ─────────────────────────────────────────

async function cargarPagosGlobales(page = 0) {
    PagosState.paginaActual = page;
    const tbody = document.getElementById('tabla-pagos-global');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-state"><div class="spinner"></div> Cargando pagos...</td></tr>';
    }

    try {
        const response = await API.pagos.list({ page: PagosState.paginaActual, size: 50, sort: 'fecha,desc' });
        PagosState.pagosGlobalesPagina = response.content || [];
        PagosState.totalPaginas = response.totalPages || 0;

        renderPagosGlobalesFiltrados();
        renderPaginacion();
    } catch (err) {
        modulos.setTableError('tabla-pagos-global', 8, 'Error al cargar pagos.');
        mostrarAlerta('error', 'Error al cargar pagos: ' + err.message);
    }
}

// ── Paginación ─────────────────────────────────────────────

function renderPaginacion() {
    const container = document.getElementById('paginacion-global');
    if (!container) return;

    if (PagosState.totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }

    const info = `Página ${PagosState.paginaActual + 1} de ${PagosState.totalPaginas}`;
    container.innerHTML = `
        <div class="pagination">
            <button class="btn btn-secondary btn-sm" onclick="cargarPagosGlobales(${PagosState.paginaActual - 1})" ${PagosState.paginaActual === 0 ? 'disabled' : ''}>Anterior</button>
            <span class="pagination-info">${info}</span>
            <button class="btn btn-secondary btn-sm" onclick="cargarPagosGlobales(${PagosState.paginaActual + 1})" ${PagosState.paginaActual >= PagosState.totalPaginas - 1 ? 'disabled' : ''}>Siguiente</button>
        </div>`;
}
