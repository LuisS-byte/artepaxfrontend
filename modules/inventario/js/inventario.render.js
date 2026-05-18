/**
 * modules/inventario/js/inventario.render.js
 * Render layer del módulo Inventario.
 * Columnas, tablas, skeletons, empty/error states, KPIs, paginación, animaciones,
 * filtros activos y date validation.
 * NO llaman API, NO ejecutan acciones mutantes.
 * Dependencias: InventarioState (lectura), helpers, formatters, modulos, lucide, DOM.
 */

/* ================================================================ */
/*  SKELETON LOADING                                                */
/* ================================================================ */

function renderSkeleton(tbodyId, columnas, filas) {
    filas = filas || 4;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    let html = '';
    const widths = ['lg', 'md', 'sm', 'xs', 'md', 'lg', 'sm'];
    for (let r = 0; r < filas; r++) {
        html += '<tr class="skeleton-row">';
        for (let c = 0; c < columnas; c++) {
            const w = widths[(r + c) % widths.length];
            const center = c > 0 && c < columnas - 1 ? ' skeleton-cell--center' : '';
            html += `<td><div class="skeleton-cell skeleton-cell--${w}${center}"></div></td>`;
        }
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

/* ================================================================ */
/*  EMPTY STATE                                                     */
/* ================================================================ */

function renderEmptyState(tbodyId, colspan, icono, titulo, descripcion) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="inventory-empty-state">
        <span class="inventory-empty-state-icon"><i data-lucide="${icono}"></i></span>
        <span class="inventory-empty-state-title">${formatters.textoSeguro(titulo)}</span>
        <span class="inventory-empty-state-text">${formatters.textoSeguro(descripcion)}</span>
    </td></tr>`;
    if (window.lucide) lucide.createIcons();
}

/* ================================================================ */
/*  ERROR STATE                                                     */
/* ================================================================ */

function renderErrorState(tbodyId, colspan, mensaje, detalle, onRetry) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const retryBtn = onRetry
        ? `<button class="btn btn-primary btn-sm" onclick="${onRetry}" style="margin-top: 8px;">
               <i data-lucide="refresh-cw"></i> Reintentar
           </button>`
        : '';
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="inventory-error-state">
        <span class="inventory-error-state-icon"><i data-lucide="alert-circle"></i></span>
        <span class="inventory-error-state-text">${formatters.textoSeguro(mensaje)}</span>
        <span class="inventory-error-state-hint">${formatters.textoSeguro(detalle)}</span>
        ${retryBtn}
    </td></tr>`;
    if (window.lucide) lucide.createIcons();
}

/* ================================================================ */
/*  ANIMATIONS                                                       */
/* ================================================================ */

function animateValue(el, start, end, duration) {
    if (!el) return;
    const range = end - start;
    if (range === 0) { el.textContent = end; return; }
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + range * eased);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = end;
    }
    requestAnimationFrame(step);
}

function countUpElement(id, nuevo) {
    const el = document.getElementById(id);
    if (!el) return;
    const actual = parseInt(el.textContent, 10) || 0;
    if (actual === nuevo) { el.textContent = nuevo; return; }
    animateValue(el, actual, nuevo, 400);
}

function animateRows(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr:not(.skeleton-row)');
    rows.forEach((row, i) => {
        if (!row.classList.contains('inventory-empty-state') && !row.classList.contains('inventory-error-state')) {
            row.classList.add('row-animate');
            row.style.animationDelay = `${i * 0.04}s`;
        }
    });
}

function scrollTableTop(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const wrapper = tbody.closest('.table-wrapper');
    if (wrapper) wrapper.scrollTop = 0;
}

/* ================================================================ */
/*  PRIORITY STRIP — productos en riesgo                             */
/* ================================================================ */

function renderPriorityStrip() {
    const strip = document.getElementById('priority-strip');
    const body = document.getElementById('priority-strip-body');
    if (!strip || !body) return;

    const items = InventarioState.productosRiesgo;
    if (!items || items.length === 0) {
        strip.classList.add('hidden');
        return;
    }

    strip.classList.remove('hidden');

    body.innerHTML = items.map(item => {
        const r = getRiesgoLevel(item);
        const isAgotado = item.cantidadDisponible <= 0;
        return `
            <div class="priority-strip-item${isAgotado ? ' priority-strip-item--agotado' : ''}">
                <div class="priority-strip-item-info">
                    <strong class="priority-strip-item-name">${formatters.textoSeguro(item.nombre)}</strong>
                    <span class="priority-strip-item-stock">
                        Disp: <strong>${item.cantidadDisponible}</strong>
                        ${item.stockMinimo != null && item.stockMinimo > 0 ? ` · Mín: ${item.stockMinimo}` : ''}
                    </span>
                </div>
                <span class="${r.clase}">${r.label}</span>
                <div class="priority-strip-actions">
                    <button class="action-chip action-chip--xs action-chip--success" onclick="abrirDrawerMovimiento('entrada', ${item.idProducto})" title="Registrar entrada de stock">
                        <i data-lucide="arrow-down"></i> Entrada
                    </button>
                    <button class="action-chip action-chip--xs action-chip--neutral" onclick="verMovimientosProducto(${item.idProducto})">
                        <i data-lucide="history"></i> Historial
                    </button>
                </div>
            </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

/* ================================================================ */
/*  AUDIT SUMMARY — movimientos                                      */
/* ================================================================ */

function actualizarAuditSummary() {
    const base = InventarioState.movimientosGlobalesBase || InventarioState.movimientosGlobales || [];
    const total = base.length;
    const entradas = base.filter(m => m.tipoMovimiento === 'ENTRADA').length;
    const salidas = base.filter(m => m.tipoMovimiento === 'SALIDA').length;
    const conEvento = base.filter(m => m.eventoId || m.idEvento).length;

    InventarioState.auditSummary = { total, entradas, salidas, conEvento };

    countUpElement('audit-total-mov', total);
    countUpElement('audit-total-entradas', entradas);
    countUpElement('audit-total-salidas', salidas);
    countUpElement('audit-total-eventos', conEvento);
}

/* ================================================================ */
/*  DATE VALIDATION (visual feedback)                                */
/* ================================================================ */

function validarDateInput(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Remove previous feedback
    const existing = input.parentElement?.querySelector('.date-feedback');
    if (existing) existing.remove();

    input.classList.remove('date-valid', 'date-warning', 'date-invalid');

    const val = (input.value || '').trim();
    if (!val) return;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(val)) {
        input.classList.add('date-invalid');
        const feedback = document.createElement('span');
        feedback.className = 'date-feedback error';
        feedback.textContent = 'Formato: AAAA-MM-DD';
        input.parentElement.appendChild(feedback);
        return;
    }

    const parsed = toComparableDate(val);
    if (!parsed) {
        input.classList.add('date-invalid');
        return;
    }

    // Check if date is in the future (warning)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (parsed > now) {
        input.classList.add('date-warning');
        const feedback = document.createElement('span');
        feedback.className = 'date-feedback warning';
        feedback.textContent = 'Fecha futura';
        input.parentElement.appendChild(feedback);
        return;
    }

    input.classList.add('date-valid');
}

/* ================================================================ */
/*  PAGINACIÓN                                                       */
/* ================================================================ */

function renderPaginacionMov() {
    const container = document.getElementById('paginacion-mov-global');
    if (InventarioState.totalPaginasMov <= 1) {
        container.innerHTML = '';
        return;
    }

    const info = `Página ${InventarioState.paginaMovActual + 1} de ${InventarioState.totalPaginasMov}`;
    container.innerHTML = `
        <div class="pagination">
            <button class="btn btn-secondary btn-sm" onclick="cargarMovimientosGlobales(${InventarioState.paginaMovActual - 1})" ${InventarioState.paginaMovActual === 0 ? 'disabled' : ''}>Anterior</button>
            <span class="pagination-info">${info}</span>
            <button class="btn btn-secondary btn-sm" onclick="cargarMovimientosGlobales(${InventarioState.paginaMovActual + 1})" ${InventarioState.paginaMovActual >= InventarioState.totalPaginasMov - 1 ? 'disabled' : ''}>Siguiente</button>
        </div>`;
}

function renderPaginacionMovProducto() {
    const pag = InventarioState.movimientosProductoPagination;
    const page = InventarioState.movimientosProductoPaginaActual;
    const totalPages = pag ? pag.totalPages : 0;
    const totalElements = pag ? pag.totalElements : 0;

    // Show/hide contextual pagination info regardless of page count
    renderMovimientoProductoPageInfo();

    if (!pag || totalPages <= 1) {
        const container = document.getElementById('paginacion-mov-producto');
        if (container) container.innerHTML = '';
        return;
    }

    modulos.renderPaginacion({
        containerId: 'paginacion-mov-producto',
        page: page,
        totalPages: totalPages,
        totalElements: totalElements,
        onPageChange: function(nextPage) {
            if (InventarioState.productoHistorialSeleccionadoId) {
                cargarMovimientosPorProducto(InventarioState.productoHistorialSeleccionadoId, nextPage);
            }
        }
    });
}

/**
 * Render "Mostrando X-Y de Z movimientos" below the per-product history table.
 * Uses pagination metadata from InventarioState.
 * Hidden when no product is selected, no pagination data, or empty result set.
 */
function renderMovimientoProductoPageInfo() {
    const container = document.getElementById('mov-pagination-info');
    if (!container) return;

    const pag = InventarioState.movimientosProductoPagination;
    const page = InventarioState.movimientosProductoPaginaActual;
    const currentLength = InventarioState.movimientosData.length;
    const PAGE_SIZE = 50; // matches inventario.api.js cargarMovimientosPorProducto

    // Hide when: no pagination metadata, no data on page, or total is unknown
    if (!pag || !pag.totalElements || currentLength === 0) {
        container.classList.add('hidden');
        container.textContent = '';
        return;
    }

    const from = page * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE + currentLength, pag.totalElements);
    const total = pag.totalElements;
    const label = total !== 1 ? 'movimientos' : 'movimiento';

    container.textContent = `Mostrando ${from}-${to} de ${total} ${label}`;
    container.classList.remove('hidden');
}

/* ================================================================ */
/*  KPI RESUMEN                                                      */
/* ================================================================ */

function actualizarResumenProductos() {
    const total = InventarioState.productosData.length;
    const activos = InventarioState.productosData.filter(p => p.estado !== 'INACTIVO').length;
    const inactivos = total - activos;
    const criticos = InventarioState.stockData.filter(s => s.stockBajoAlerta || s.cantidadDisponible <= 0).length;

    countUpElement('productos-total', total);
    countUpElement('productos-activos', activos);
    countUpElement('productos-inactivos', inactivos);
    countUpElement('productos-criticos', criticos);
}

function actualizarResumenInventario() {
    const totalProductos = InventarioState.productosData.length;
    const stockCritico = InventarioState.stockData.filter(s => s.cantidadDisponible <= 0 || s.stockBajoAlerta).length;
    const totalReservado = InventarioState.stockData.reduce((acc, item) => acc + Number(item.cantidadReservada || 0), 0);
    const totalDisponible = InventarioState.stockData.reduce((acc, item) => acc + Number(item.cantidadDisponible || 0), 0);

    // KPI order matches risk-first reading: Disponible, Reservado, Crítico, Productos
    countUpElement('inv-total-disponible', totalDisponible);
    countUpElement('inv-total-reservado', totalReservado);
    countUpElement('inv-stock-critico', stockCritico);
    countUpElement('inv-total-productos', totalProductos);

    // Compute priority products for attention strip
    InventarioState.productosRiesgo = InventarioState.stockData
        .filter(s => s.cantidadDisponible <= 0 || s.stockBajoAlerta)
        .sort((a, b) => {
            // Agotados first, then by name
            const aAgotado = a.cantidadDisponible <= 0 ? 0 : 1;
            const bAgotado = b.cantidadDisponible <= 0 ? 0 : 1;
            if (aAgotado !== bAgotado) return aAgotado - bAgotado;
            return (a.nombre || '').localeCompare(b.nombre || '');
        });

    renderPriorityStrip();
}

/* ================================================================ */
/*  COLUMN DEFINITIONS                                               */
/* ================================================================ */

/* ── Risk level helper ──────────────────────────────── */
function getRiesgoLevel(row) {
    if (row.cantidadDisponible <= 0) {
        return { clase: 'riesgo-badge riesgo-badge--agotado', label: 'Agotado', icon: 'octagon-alert' };
    }
    if (row.stockBajoAlerta) {
        return { clase: 'riesgo-badge riesgo-badge--critico', label: 'Crítico', icon: 'alert-triangle' };
    }
    if (row.cantidadDisponible <= row.stockMinimo * 2) {
        return { clase: 'riesgo-badge riesgo-badge--bajo', label: 'Bajo', icon: 'alert-circle' };
    }
    return { clase: 'riesgo-badge riesgo-badge--ok', label: 'OK', icon: 'check-circle' };
}

const COLUMNAS_STOCK = [
    {
        label: 'Producto',
        render: row => `<td><strong>${formatters.textoSeguro(row.nombre)}</strong></td>`
    },
    {
        label: 'Disponible',
        render: row => {
            const r = getRiesgoLevel(row);
            const isLow = r.label !== 'OK';
            return `<td style="text-align: center;">
                <strong class="stock-disponible${isLow ? ' stock-disponible--low' : ''}">${row.cantidadDisponible}</strong>
            </td>`;
        }
    },
    {
        label: 'Reservado',
        render: row => `<td style="text-align: center;">${row.cantidadReservada || 0}</td>`
    },
    {
        label: 'Total',
        render: row => `<td style="text-align: center;">${row.cantidadTotal}</td>`
    },
    {
        label: 'Mínimo',
        render: row => `<td style="text-align: center;">${row.stockMinimo ?? '\u2014'}</td>`
    },
    {
        label: 'Riesgo',
        render: row => {
            const r = getRiesgoLevel(row);
            return `<td><span class="${r.clase}"><i data-lucide="${r.icon}"></i> ${r.label}</span></td>`;
        }
    },
    {
        label: 'Precio',
        render: row => `<td style="text-align: right;"><strong>$${formatters.precio(row.precioUnitario ?? 0)}</strong></td>`
    },
    {
        label: 'Acciones',
        render: row => {
            const r = getRiesgoLevel(row);
            const urgentClass = r.label !== 'OK' ? ' action-chip--urgent' : '';
            const isRisk = r.label === 'Crítico' || r.label === 'Agotado';
            return `
                <td class="acciones-cell">
                    <div class="acciones-wrapper">
                        ${isRisk
                            ? `<button class="action-chip action-chip--success" onclick="abrirDrawerMovimiento('entrada', ${row.idProducto})" title="Registrar entrada de stock">
                                   <i data-lucide="arrow-down"></i> Entrada
                               </button>`
                            : ''}
                        <button class="action-chip action-chip--neutral${urgentClass}" onclick="verMovimientosProducto(${row.idProducto})">
                            <i data-lucide="history"></i>
                            Historial
                        </button>
                    </div>
                </td>`;
        }
    }
];

const COLUMNAS_PRODUCTOS = [
    {
        label: 'Producto',
        render: row => {
            const desc = (row.descripcion || '').trim();
            return `
            <td>
                <div class="product-name-cell">
                    <strong>${formatters.textoSeguro(row.nombre)}</strong>
                    <span class="text-muted text-sm">${desc ? formatters.textoSeguro(desc) : 'Sin descripción registrada.'}</span>
                </div>
            </td>`;
        }
    },
    {
        label: 'Disponible',
        render: row => {
            const stockItem = InventarioState.stockData.find(s => String(s.idProducto) === String(row.id));
            const disp = stockItem != null && stockItem.cantidadDisponible != null ? stockItem.cantidadDisponible : '\u2014';
            const isLow = stockItem != null && (stockItem.cantidadDisponible <= 0 || stockItem.stockBajoAlerta);
            return `<td style="text-align:center;">
                <strong class="stock-disponible${isLow ? ' stock-disponible--low' : ''}">${disp}</strong>
            </td>`;
        }
    },
    {
        label: 'Precio Unit.',
        render: row => `<td style="text-align:right;"><strong>$${formatters.precio(row.precioUnitario ?? 0)}</strong></td>`
    },
    {
        label: 'Stock Mínimo',
        render: row => `<td style="text-align:center;">${row.stockMinimo ?? 0}</td>`
    },
    {
        label: 'Estado',
        render: row => `<td>${getBadgeEstadoProducto(row.estado)}</td>`
    },
    {
        label: 'Acciones',
        render: row => `
            <td class="acciones-cell">
                <div class="acciones-wrapper">
                    <button class="action-chip action-chip--info" onclick="verMovimientosProducto(${row.id})" title="Ver historial de movimientos">
                        <i data-lucide="history"></i>
                        Movimientos
                    </button>
                    <button class="action-chip action-chip--neutral" onclick="abrirDrawerProductoEditar(${row.id})">
                        <i data-lucide="pencil-line"></i>
                        Editar
                    </button>
                    ${row.estado === 'INACTIVO'
                        ? `<button class="action-chip action-chip--success" onclick="abrirModalProductoEstado(${row.id}, 'reactivar')">
                                <i data-lucide="rotate-ccw"></i>
                                Reactivar
                           </button>`
                        : `<button class="action-chip action-chip--danger" onclick="abrirModalProductoEstado(${row.id}, 'desactivar')">
                                <i data-lucide="pause-circle"></i>
                                Desactivar
                           </button>`}
                </div>
            </td>`
    }
];

const COLUMNAS_MOVIMIENTOS = [
    { label: 'Fecha / Hora', render: row => `<td>${modulos.formatearFecha(row.fecha)}</td>` },
    { label: 'Producto', render: row => `<td><strong>${formatters.textoSeguro(row.productoNombre)}</strong></td>` },
    {
        label: 'Movimiento',
        render: row => `<td><span class="badge ${row.tipoMovimiento === 'ENTRADA' ? 'badge-confirmado' : 'badge-cancelado'}">${row.tipoMovimiento}</span></td>`
    },
    { label: 'Cantidad', render: row => `<td>${row.cantidad}</td>` },
    { label: 'Motivo / Contexto', render: row => renderMotivoCell(row) },
    {
        label: 'Evento',
        render: row => {
            const evento = getEventoMovimientoInfo(row);
            return `
                <td>
                    <div class="event-link-stack">
                        <strong class="event-chip-title">${formatters.textoSeguro(evento.label)}</strong>
                        <span class="event-chip-detail">${formatters.textoSeguro(evento.detail)}</span>
                        ${evento.cta}
                    </div>
                </td>`;
        }
    }
];

const COLUMNAS_MOVIMIENTOS_GLOBAL = [
    { label: 'Fecha / Hora', render: row => `<td>${modulos.formatearFecha(row.fecha)}</td>` },
    { label: 'Producto', render: row => `<td><strong>${formatters.textoSeguro(row.productoNombre)}</strong></td>` },
    {
        label: 'Movimiento',
        render: row => `<td><span class="badge ${row.tipoMovimiento === 'ENTRADA' ? 'badge-confirmado' : 'badge-cancelado'}">${row.tipoMovimiento}</span></td>`
    },
    { label: 'Cantidad', render: row => `<td>${row.cantidad}</td>` },
    { label: 'Motivo / Contexto', render: row => renderMotivoCell(row) },
    {
        label: 'Evento',
        render: row => {
            const evento = getEventoMovimientoInfo(row);
            return `
                <td>
                    <div class="event-link-stack">
                        <strong class="event-chip-title">${formatters.textoSeguro(evento.label)}</strong>
                        <span class="event-chip-detail">${formatters.textoSeguro(evento.detail)}</span>
                        ${evento.cta}
                    </div>
                </td>`;
        }
    }
];

/* ================================================================ */
/*  FILTER CHIPS                                                    */
/* ================================================================ */

function actualizarFiltrosActivosProductos() {
    const container = document.getElementById('active-filters-productos');
    if (!container) return;
    let chips = '';

    const estado = document.getElementById('filter-estado-producto')?.value;
    if (estado && estado !== 'todos') {
        const label = estado === 'ACTIVO' ? 'Activos' : 'Inactivos';
        chips += renderFilterChip('Estado: ' + label, 'limpiarFiltroEstadoProducto()');
    }

    const searchVal = document.getElementById('search-productos')?.value.trim();
    if (searchVal) {
        chips += renderFilterChip('Búsqueda: ' + formatters.textoSeguro(searchVal), 'limpiarBusquedaProductos()');
    }

    if (chips) {
        chips += `<button class="filter-clear-all" onclick="limpiarFiltrosProductos()">
            <i data-lucide="x"></i> Limpiar filtros
        </button>`;
    }

    container.innerHTML = chips;
    if (window.lucide) lucide.createIcons();
}

function actualizarFiltrosActivosMov() {
    const container = document.getElementById('active-filters-mov');
    if (!container) return;
    let chips = '';

    const tipo = document.getElementById('filter-tipo-mov')?.value;
    if (tipo) {
        const label = tipo === 'ENTRADA' ? 'Entrada' : 'Salida';
        chips += renderFilterChip('Tipo: ' + label, 'limpiarFiltroTipoMov()');
    }

    const origen = document.getElementById('filter-origen-mov')?.value;
    if (origen) {
        const labels = { REPOSICION: 'Reposición', AJUSTE_MANUAL: 'Ajuste Manual', 'DAÑO': 'Daño', PERDIDA: 'Pérdida', EVENTO: 'Evento' };
        chips += renderFilterChip('Origen: ' + (labels[origen] || origen), 'limpiarFiltroOrigenMov()');
    }

    const desde = document.getElementById('filter-fecha-desde')?.value.trim();
    if (desde) chips += renderFilterChip('Desde: ' + formatters.textoSeguro(desde), 'limpiarFiltroFechaDesde()');

    const hasta = document.getElementById('filter-fecha-hasta')?.value.trim();
    if (hasta) chips += renderFilterChip('Hasta: ' + formatters.textoSeguro(hasta), 'limpiarFiltroFechaHasta()');

    if (chips) {
        chips += `<button class="filter-clear-all" onclick="limpiarTodosFiltrosMov()">
            <i data-lucide="x"></i> Limpiar filtros
        </button>`;
    }

    container.innerHTML = chips;
    if (window.lucide) lucide.createIcons();
}

/* ================================================================ */
/*  TABLE RENDER FUNCTIONS                                           */
/* ================================================================ */

function aplicarRenderProductos() {
    const query = (document.getElementById('search-productos')?.value || '').trim().toLowerCase();
    const estado = document.getElementById('filter-estado-producto')?.value || 'todos';

    const filtrados = InventarioState.productosData.filter(producto => {
        const coincideEstado = estado === 'todos' || producto.estado === estado;
        const coincideTexto = !query || [
            producto.nombre,
            producto.descripcion
        ].some(v => String(v || '').toLowerCase().includes(query));

        return coincideEstado && coincideTexto;
    });

    actualizarFiltrosActivosProductos();

    if (!filtrados.length) {
        renderEmptyState('tabla-productos', 6, 'package-open',
            'Sin productos encontrados',
            'No hay productos para los filtros actuales. Probá con otros criterios de búsqueda.');
        return;
    }

    modulos.renderTabla(filtrados, 'tabla-productos', COLUMNAS_PRODUCTOS);
    animateRows('tabla-productos');
    scrollTableTop('tabla-productos');
    if (window.lucide) lucide.createIcons();
}

function aplicarRenderStock(datos) {
    datos = datos || InventarioState.stockData;
    const query = (document.getElementById('search-stock')?.value || '').trim().toLowerCase();

    let filtrados = datos;
    if (query) {
        filtrados = datos.filter(d => d.nombre.toLowerCase().includes(query));
    }

    if (!filtrados.length) {
        renderEmptyState('tabla-stock', 8, 'package-open',
            'Sin resultados',
            query ? 'Ningún producto coincide con "' + formatters.textoSeguro(query) + '".' : 'No hay stock disponible.');
        return;
    }

    modulos.renderTabla(filtrados, 'tabla-stock', COLUMNAS_STOCK);
    animateRows('tabla-stock');
    scrollTableTop('tabla-stock');
    if (window.lucide) lucide.createIcons();
}

function aplicarRenderMovimientos(datos) {
    datos = datos || InventarioState.movimientosData;
    if (!datos.length) {
        renderEmptyState('tabla-movimientos', 6, 'package-open',
            'Sin movimientos registrados',
            'No hay movimientos para este producto. Seleccioná otro o registrá una entrada.');
        return;
    }
    modulos.renderTabla(datos, 'tabla-movimientos', COLUMNAS_MOVIMIENTOS);
    animateRows('tabla-movimientos');
    scrollTableTop('tabla-movimientos');
    if (window.lucide) lucide.createIcons();
}

function aplicarRenderMovimientosGlobales() {
    const tipo = document.getElementById('filter-tipo-mov')?.value || '';
    const origen = document.getElementById('filter-origen-mov')?.value || '';
    const fechaDesde = toComparableDate(document.getElementById('filter-fecha-desde')?.value);
    const fechaHasta = toComparableDate(document.getElementById('filter-fecha-hasta')?.value, true);

    // Date validation visual feedback
    validarDateInput('filter-fecha-desde');
    validarDateInput('filter-fecha-hasta');

    InventarioState.movimientosGlobales = InventarioState.movimientosGlobalesBase.filter(row => {
        if (tipo && row.tipoMovimiento !== tipo) return false;
        if (origen && row.tipoOrigen !== origen) return false;

        const fechaMovimiento = toComparableDate(row.fecha);
        if (fechaDesde && (!fechaMovimiento || fechaMovimiento < fechaDesde)) return false;
        if (fechaHasta && (!fechaMovimiento || fechaMovimiento > fechaHasta)) return false;
        return true;
    });

    actualizarFiltrosActivosMov();
    actualizarAuditSummary();

    if (!InventarioState.movimientosGlobales.length) {
        renderEmptyState('tabla-movimientos-global', 6, 'package-open',
            'Sin movimientos encontrados',
            'No hay movimientos para los filtros actuales. Probá ajustando los criterios.');
        return;
    }

    modulos.renderTabla(InventarioState.movimientosGlobales, 'tabla-movimientos-global', COLUMNAS_MOVIMIENTOS_GLOBAL);
    animateRows('tabla-movimientos-global');
    scrollTableTop('tabla-movimientos-global');
    if (window.lucide) lucide.createIcons();
}

/* ================================================================ */
/*  PER‑PRODUCT HISTORY: SUGGESTIONS & AUTOCOMPLETE                  */
/* ================================================================ */

/**
 * Render suggestion chips (recently consulted + critical products)
 * inside the default empty state view.
 */
function renderSugerenciasProductos() {
    const container = document.getElementById('suggestion-chips');
    if (!container) return;

    const stockData = InventarioState.stockData || [];
    const recientes = InventarioState.productosUltimosConsultados || [];

    // Critical / attention products from stock
    const criticos = stockData
        .filter(s => s.cantidadDisponible <= 0 || s.stockBajoAlerta)
        .sort((a, b) => {
            const aAgotado = a.cantidadDisponible <= 0 ? 0 : 1;
            const bAgotado = b.cantidadDisponible <= 0 ? 0 : 1;
            if (aAgotado !== bAgotado) return aAgotado - bAgotado;
            return (a.nombre || '').localeCompare(b.nombre || '');
        })
        .slice(0, 6);

    let html = '';

    // ── Recently consulted ──
    if (recientes.length > 0) {
        html += '<div class="suggestions-group">';
        html += '<span class="suggestions-group-label"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Consultados recientemente</span>';
        html += '<div class="suggestions-chip-row">';
        recientes.forEach(function(r) {
            const stockItem = stockData.find(function(s) { return String(s.idProducto) === String(r.id); });
            var badgeHtml = '';
            if (stockItem) {
                var rl = getRiesgoLevel(stockItem);
                if (rl.label !== 'OK') {
                    badgeHtml = '<span class="' + rl.clase + '" style="font-size:0.65rem;padding:0.15rem 0.4rem">' + rl.label + '</span>';
                }
            }
            html += '<button type="button" class="suggestion-chip" onclick="seleccionarProductoHistorial(' + r.id + ')">';
            html += '<span class="suggestion-chip-name">' + formatters.textoSeguro(r.nombre) + '</span>';
            html += badgeHtml;
            html += '</button>';
        });
        html += '</div></div>';
    }

    // ── Needs attention ──
    if (criticos.length > 0) {
        html += '<div class="suggestions-group">';
        html += '<span class="suggestions-group-label suggestions-group-label--warning"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Requieren atención</span>';
        html += '<div class="suggestions-chip-row">';
        criticos.forEach(function(s) {
            var rl = getRiesgoLevel(s);
            html += '<button type="button" class="suggestion-chip suggestion-chip--warning" onclick="seleccionarProductoHistorial(' + s.idProducto + ')">';
            html += '<span class="suggestion-chip-name">' + formatters.textoSeguro(s.nombre) + '</span>';
            html += '<span class="' + rl.clase + '" style="font-size:0.65rem;padding:0.15rem 0.4rem">' + rl.label + '</span>';
            html += '</button>';
        });
        html += '</div></div>';
    }

    // ── Empty state ──
    if (!html) {
        html = '<div class="suggestions-empty"><span class="suggestions-hint">Usá el buscador de arriba para encontrar productos por nombre.</span></div>';
    }

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

/**
 * Render autocomplete search results dropdown below the search input.
 * @param {Array} results — items from buscarProductosLocal()
 */
function renderProductSearchResults(results) {
    const container = document.getElementById('product-search-results');
    if (!container) return;

    if (!results || results.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');

    const stockData = InventarioState.stockData || [];

    container.innerHTML = results.map(function(p) {
        var stockItem = stockData.find(function(s) { return String(s.idProducto) === String(p.id); });
        var badgeHtml = '';
        if (stockItem) {
            var rl = getRiesgoLevel(stockItem);
            if (rl.label !== 'OK') {
                badgeHtml = '<span class="' + rl.clase + '" style="font-size:0.65rem;padding:0.15rem 0.4rem;flex-shrink:0">' + rl.label + '</span>';
            }
        }
        var estadoLabel = p.estado === 'INACTIVO' ? ' <span class="text-muted" style="font-size:0.72rem">(inactivo)</span>' : '';
        var stockLabel = stockItem ? '<span class="product-search-result-stock">Stock: ' + stockItem.cantidadDisponible + ' disp.</span>' : '';
        return '<button type="button" class="product-search-result" onclick="seleccionarProductoHistorial(' + p.id + ')">' +
            '<span class="product-search-result-name">' + formatters.textoSeguro(p.nombre) + estadoLabel + '</span>' +
            badgeHtml + stockLabel +
            '</button>';
    }).join('');
}
