/**
 * modules/gastos/js/gastos.render.js
 * Capa de render del módulo Gastos — tablas, KPIs, resumen, paginación, drawer.
 * Fase 4 — Separación desde gastos.js monolítico.
 */
(function () {
    'use strict';

    // -- Celdas ---------------------------------------------------------------

    function renderConceptoCell(row) {
        return `
            <td>
                <div class="gasto-concepto-cell">
                    <strong>${formatters.textoSeguro(row.gastoConcepto || 'Sin concepto')}</strong>
                    <span class="text-muted">Gasto #${row.id}</span>
                </div>
            </td>`;
    }

    function renderNotaCell(row) {
        const nota = (row.gastoNota || '').trim();
        if (!nota) {
            return `
                <td>
                    <div class="gasto-note-cell">
                        <span class="gasto-note-chip is-empty">Sin nota</span>
                        <span class="text-muted">No se registró detalle adicional.</span>
                    </div>
                </td>`;
        }

        return `
            <td>
                <div class="gasto-note-cell">
                    <span class="gasto-note-chip">Nota</span>
                    <span title="${formatters.textoSeguro(nota)}">${formatters.textoSeguro(nota)}</span>
                </div>
            </td>`;
    }

    function renderEventoCell(row) {
        const eventoId = row.eventoId || null;
        return `
            <td>
                <div class="event-state-stack">
                    <span class="badge ${GastosHelpers.getBadgeEstadoEvento(row.estadoEventoNombre)}">${formatters.textoSeguro(row.estadoEventoNombre || 'Sin estado')}</span>
                    ${eventoId ? `<button class="action-chip action-chip--ghost event-link-inline" onclick="irADetalleEvento(${eventoId})"><i data-lucide="external-link"></i>Evento #${eventoId}</button>` : '<span class="text-muted">Sin evento</span>'}
                </div>
            </td>`;
    }

    function generarAccionesGasto(row, isGlobal = false) {
        if (row.gastoEstado !== 'PROYECTADO') {
            return '<span class="text-muted text-sm">Cerrado operativamente</span>';
        }

        const desembolsarFn = isGlobal ? 'abrirModalDesembolsarGlobal' : 'abrirModalDesembolsar';
        const eliminarFn = isGlobal ? 'abrirModalEliminarGlobal' : 'abrirModalEliminar';

        return `
            <div class="acciones-wrapper">
                <button class="action-chip action-chip--success" onclick="${desembolsarFn}(${row.id})">
                    <i data-lucide="banknote-arrow-down"></i>
                    Desembolsar
                </button>
                <button class="action-chip action-chip--danger" onclick="${eliminarFn}(${row.id})">
                    <i data-lucide="trash-2"></i>
                    Eliminar
                </button>
            </div>`;
    }

    // -- Columnas -------------------------------------------------------------

    const COLUMNAS_GASTOS = [
        { label: 'Fecha', render: row => `<td>${modulos.formatearFecha(row.gastoFecha)}</td>` },
        { label: 'Concepto', render: row => renderConceptoCell(row) },
        { label: 'Monto', render: row => `<td><strong class="amount-cell">${GastosHelpers.getMonto(row.gastoMonto)}</strong></td>` },
        { label: 'Estado', render: row => `<td>${GastosHelpers.getBadgeGasto(row.gastoEstado)}</td>` },
        { label: 'Nota', render: row => renderNotaCell(row) },
        { label: 'Acciones', render: row => `<td class="acciones-cell">${generarAccionesGasto(row)}</td>` }
    ];

    const COLUMNAS_GASTOS_GLOBAL = [
        { label: 'Fecha', render: row => `<td>${modulos.formatearFecha(row.gastoFecha)}</td>` },
        { label: 'Cliente', render: row => `<td><strong>${formatters.textoSeguro(row.clienteNombre || 'Sin cliente')}</strong></td>` },
        { label: 'Evento', render: row => renderEventoCell(row) },
        { label: 'Concepto', render: row => renderConceptoCell(row) },
        { label: 'Monto', render: row => `<td><strong class="amount-cell">${GastosHelpers.getMonto(row.gastoMonto)}</strong></td>` },
        { label: 'Estado', render: row => `<td>${GastosHelpers.getBadgeGasto(row.gastoEstado)}</td>` },
        { label: 'Nota', render: row => renderNotaCell(row) },
        { label: 'Acciones', render: row => `<td class="acciones-cell">${generarAccionesGasto(row, true)}</td>` }
    ];

    // -- Filter chips ---------------------------------------------------------

    function actualizarChipsGasto() {
        var container = document.getElementById('filter-chips');
        if (!container) return;

        var chips = [];

        // Estado filter
        var estadoEl = document.getElementById('filter-estado-gasto');
        var estado = estadoEl ? estadoEl.value : '';
        if (estado) {
            var label = estado === 'PROYECTADO' ? 'Proyectado' : 'Desembolsado';
            chips.push({ type: 'estado', label: 'Estado: ' + label });
        }

        // Date range filter
        var desdeEl = document.getElementById('filter-fecha-desde');
        var hastaEl = document.getElementById('filter-fecha-hasta');
        var desde = desdeEl ? desdeEl.value : '';
        var hasta = hastaEl ? hastaEl.value : '';
        if (desde || hasta) {
            chips.push({ type: 'fecha', label: 'Fechas: ' + (desde || '…') + ' → ' + (hasta || '…') });
        }

        // Search filter
        if (GastosState.busqueda) {
            chips.push({ type: 'search', label: 'Búsqueda: "' + GastosState.busqueda + '"' });
        }

        // KPI filter
        if (GastosState.kpiActivo) {
            var kpiLabel = GastosState.kpiActivo === 'PROYECTADO' ? 'Proyectado' : 'Desembolsado';
            chips.push({ type: 'kpi', label: 'KPI: ' + kpiLabel });
        }

        if (chips.length === 0) {
            container.innerHTML = '';
            return;
        }

        var chipColors = {
            kpi: 'chip-warning',
            search: 'chip-primary',
            estado: 'chip-neutral',
            fecha: 'chip-accent'
        };

        var chipsHtml = chips.map(function (chip) {
            var colorClass = chipColors[chip.type] || 'chip-primary';
            return '<span class="filter-chip ' + colorClass + '">'
                + formatters.textoSeguro(chip.label)
                + '<button class="filter-chip-remove" onclick="GastosActions.quitarChip(\'' + chip.type + '\')" aria-label="Quitar filtro">'
                + '<i data-lucide="x"></i></button></span>';
        }).join('');

        chipsHtml += '<button class="filter-chip filter-chip-clear" onclick="GastosActions.limpiarTodosFiltros()">'
            + 'Limpiar todo <i data-lucide="x-circle"></i></button>';

        container.innerHTML = chipsHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function actualizarResultsCount() {
        var container = document.getElementById('results-count');
        if (!container) return;

        var count = (GastosState.filtroCombinado && GastosState.filtroCombinado.length > 0) ? GastosState.filtroCombinado.length : GastosState.gastosGlobales.length;

        // Check if ANY filter is active
        var estadoEl = document.getElementById('filter-estado-gasto');
        var desdeEl = document.getElementById('filter-fecha-desde');
        var hastaEl = document.getElementById('filter-fecha-hasta');
        var hasFilters = GastosState.busqueda
            || GastosState.kpiActivo
            || (estadoEl && estadoEl.value)
            || (desdeEl && desdeEl.value)
            || (hastaEl && hastaEl.value);

        if (hasFilters) {
            container.innerHTML = 'Mostrando <span class="count-number">' + count + '</span> resultado' + (count !== 1 ? 's' : '');
        } else {
            container.innerHTML = '';
        }
    }

    function actualizarResumenEvento() {
        document.getElementById('total-proyectado').textContent = GastosHelpers.getMonto(GastosState.resumenEventoActual?.totalProyectado || 0);
        document.getElementById('total-desembolsado').textContent = GastosHelpers.getMonto(GastosState.resumenEventoActual?.totalDesembolsado || 0);
        document.getElementById('total-pendiente').textContent = GastosHelpers.getMonto(GastosState.resumenEventoActual?.totalPendiente || 0);
    }

    // -- Paginación -----------------------------------------------------------

    function renderPaginacionGastos() {
        modulos.renderPaginacion({
            containerId: 'paginacion-gastos-global',
            page: GastosState.paginaActual,
            totalPages: GastosState.totalPaginas,
            totalElements: GastosState.totalElementos,
            onPageChange: next => cargarGastosGlobales(next)
        });
    }

    // -- Resumen y drawer -----------------------------------------------------

    function renderResumenEventoSeleccionado() {
        const container = document.getElementById('gastos-evento-resumen');
        if (!GastosState.eventoSeleccionadoResumen) {
            container.innerHTML = '';
            return;
        }

        const editable = GastosHelpers.eventoPermiteGasto(GastosState.eventoSeleccionadoResumen);
        const botonNuevo = document.getElementById('btn-nuevo-gasto');
        botonNuevo.disabled = !editable;
        botonNuevo.textContent = editable ? 'Registrar gasto' : 'Alta bloqueada';

        container.innerHTML = `
            <div class="event-summary-grid">
                <div>
                    <span class="summary-eyebrow">Evento seleccionado</span>
                    <h2>${formatters.textoSeguro(GastosState.eventoSeleccionadoResumen.clienteNombre || `Evento #${GastosState.eventoSeleccionadoResumen.id}`)}</h2>
                    <p>${formatters.textoSeguro(GastosState.eventoSeleccionadoResumen.ubicacion || 'Ubicacion pendiente')} · ${formatFecha(GastosState.eventoSeleccionadoResumen.fecha)}</p>
                    <div class="event-summary-actions">
                        <span class="badge ${GastosHelpers.getBadgeEstadoEvento(GastosState.eventoSeleccionadoResumen.estadoEventoNombre)}">${formatters.textoSeguro(GastosState.eventoSeleccionadoResumen.estadoEventoNombre || 'Sin estado')}</span>
                        <button class="action-chip action-chip--neutral" onclick="irADetalleEvento(${GastosState.eventoSeleccionadoResumen.id})"><i data-lucide="external-link"></i>Ir al evento</button>
                    </div>
                    <div class="policy-banner ${editable ? 'is-ok' : ''}">
                        <i data-lucide="shield-check"></i>
                        <div>
                            <strong>${editable ? 'Ya podés registrar gastos' : 'Por ahora solo podés consultar'}</strong>
                            <p>${editable ? 'Este evento ya está en una etapa operativa para cargar egresos.' : 'Cuando el evento avance a su etapa operativa vas a poder cargar nuevos gastos.'}</p>
                        </div>
                    </div>
                </div>
                <div class="summary-kpis">
                    <div class="summary-kpi"><span>Fecha</span><strong>${formatFecha(GastosState.eventoSeleccionadoResumen.fecha)}</strong></div>
                    <div class="summary-kpi"><span>ID evento</span><strong>#${GastosState.eventoSeleccionadoResumen.id}</strong></div>
                    <div class="summary-kpi"><span>Gastos cargados</span><strong>${GastosState.gastosActuales.length}</strong></div>
                    <div class="summary-kpi"><span>Pendiente real</span><strong>${GastosHelpers.getMonto(GastosState.resumenEventoActual?.totalPendiente || 0)}</strong></div>
                </div>
            </div>`;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderDrawerContexto() {
        const container = document.getElementById('drawer-gasto-contexto');
        if (!GastosState.eventoSeleccionadoResumen) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="drawer-summary-grid">
                <div class="drawer-summary-main">
                    <span class="summary-eyebrow">Alta de gasto</span>
                    <h3>${formatters.textoSeguro(GastosState.eventoSeleccionadoResumen.clienteNombre || `Evento #${GastosState.eventoSeleccionadoResumen.id}`)}</h3>
                    <p>${formatters.textoSeguro(GastosState.eventoSeleccionadoResumen.ubicacion || 'Ubicacion pendiente')} · ${formatFecha(GastosState.eventoSeleccionadoResumen.fecha)}</p>
                </div>
                <div class="drawer-summary-stat">
                    <span>Estado evento</span>
                    <strong>${formatters.textoSeguro(GastosState.eventoSeleccionadoResumen.estadoEventoNombre || '-')}</strong>
                </div>
                <div class="drawer-summary-stat">
                    <span>Pendiente actual</span>
                    <strong>${GastosHelpers.getMonto(GastosState.resumenEventoActual?.totalPendiente || 0)}</strong>
                </div>
            </div>`;
    }

    // -- Progress Bar --------------------------------------------------------

    function actualizarBarraProgreso() {
        var container = document.getElementById('progress-bar-gasto-container');
        var fill = document.getElementById('progress-bar-fill');
        var percentEl = document.getElementById('progress-bar-percent');
        if (!container || !fill || !percentEl) return;

        if (!GastosState.eventoSeleccionadoId) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        var resumen = GastosState.resumenEventoActual;
        var proyectado = resumen ? Number(resumen.totalProyectado || 0) : 0;
        var desembolsado = resumen ? Number(resumen.totalDesembolsado || 0) : 0;

        var progreso = GastosHelpers.calcularProgreso(proyectado, desembolsado);

        fill.style.width = progreso.percent + '%';
        fill.className = 'progress-bar-fill ' + progreso.class;
        percentEl.textContent = progreso.percent + '%';
    }

    // -- Eventos globales toggle (vista "Todos los gastos") ----------------

    var _busquedaEventosGlobales = '';
    var _eventosGlobalesVisible = false;

    function toggleEventosGlobales() {
        var container = document.getElementById('eventos-global-container');
        var btn = document.getElementById('btn-toggle-eventos');
        if (!container || !btn) return;

        _eventosGlobalesVisible = !_eventosGlobalesVisible;
        container.classList.toggle('hidden', !_eventosGlobalesVisible);
        btn.innerHTML = _eventosGlobalesVisible
            ? '<i data-lucide="list"></i> Ocultar eventos'
            : '<i data-lucide="list"></i> Ver eventos';

        if (_eventosGlobalesVisible) {
            renderEventosGlobalesLista();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderEventosGlobalesLista() {
        var container = document.getElementById('eventos-global-lista');
        if (!container) return;

        var eventos = GastosState.eventosControl;

        // Todavía cargando — mostrar spinner, NO relanzar fetch
        if (GastosState.colaCargando) {
            container.innerHTML = '<div class="eventos-global-empty"><div class="spinner"></div> Cargando eventos...</div>';
            return;
        }

        // Carga completada pero sin datos — estado vacío válido, NO refetch
        if (!Array.isArray(eventos) || !eventos.length) {
            container.innerHTML = '<div class="eventos-global-empty">No hay eventos disponibles.</div>';
            return;
        }

        var estadoFiltro = document.getElementById('filter-eventos-global-estado');
        var estadoVal = estadoFiltro ? estadoFiltro.value : '';
        var busqueda = _busquedaEventosGlobales.trim().toLowerCase();

        var filtrados = eventos.filter(function (ev) {
            if (estadoVal && ev.estadoEventoNombre !== estadoVal) return false;
            if (busqueda) {
                var cliente = (ev.clienteNombre || '').toLowerCase();
                var idMatch = String(ev.id) === busqueda;
                if (!cliente.includes(busqueda) && !idMatch) return false;
            }
            return true;
        });

        if (!filtrados.length) {
            container.innerHTML = '<div class="eventos-global-empty">No hay eventos que coincidan con los filtros.</div>';
            return;
        }

        container.innerHTML = '<div class="eventos-global-grid">'
            + filtrados.map(function (ev) {
                var badgeClass = GastosHelpers.getBadgeEstadoEvento(ev.estadoEventoNombre);
                var estadoLabel = formatters.textoSeguro(ev.estadoEventoNombre || '-');
                var cliente = formatters.textoSeguro(ev.clienteNombre || 'Evento sin cliente');
                var fecha = ev.fecha ? formatters.fecha(ev.fecha) : '-';
                var proy = formatters.precio(Number(ev.totalProyectado || 0));
                var des = formatters.precio(Number(ev.totalDesembolsado || 0));
                var pend = formatters.precio(Number(ev.totalPendiente || 0));
                var cant = ev.cantidadGastos || 0;
                var link = '<button class="action-chip action-chip--ghost" onclick="irADetalleEvento(' + ev.id + ')"><i data-lucide="external-link"></i>#' + ev.id + '</button>';
                return '<div class="eventos-global-row">'
                    + '<div class="eventos-global-row-main">'
                        + '<strong>' + cliente + '</strong> ' + link
                        + '<span class="badge ' + badgeClass + '">' + estadoLabel + '</span>'
                    + '</div>'
                    + '<div class="eventos-global-row-meta">'
                        + '<span>' + fecha + '</span>'
                        + '<span>' + cant + ' gasto' + (cant !== 1 ? 's' : '') + '</span>'
                    + '</div>'
                    + '<div class="eventos-global-row-monto">'
                        + '<span class="monto-pend">Pend $' + pend + '</span>'
                        + '<span class="monto-des">Des $' + des + '</span>'
                        + '<span class="monto-proy">Proy $' + proy + '</span>'
                    + '</div>'
                + '</div>';
            }).join('')
            + '</div>';

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function limpiarBusquedaEventosGlobales() {
        var input = document.getElementById('search-eventos-global');
        var clearBtn = document.getElementById('search-eventos-global-clear');
        if (input) { input.value = ''; _busquedaEventosGlobales = ''; }
        if (clearBtn) clearBtn.classList.add('hidden');
        renderEventosGlobalesLista();
    }

    function initBusquedaEventosGlobales() {
        var input = document.getElementById('search-eventos-global');
        var clearBtn = document.getElementById('search-eventos-global-clear');
        if (!input) return;
        input.addEventListener('input', function () {
            _busquedaEventosGlobales = input.value.trim();
            if (clearBtn) clearBtn.classList.toggle('hidden', !_busquedaEventosGlobales);
            renderEventosGlobalesLista();
        });
    }

    // -- Stats overview (vista "Todos los gastos") --------------------------

    function actualizarStatsGlobales() {
        var gastos = GastosState.gastosGlobales || [];
        var totalEventos = 0;
        var idsEventos = {};
        gastos.forEach(function (g) {
            if (g.eventoId && !idsEventos[g.eventoId]) {
                idsEventos[g.eventoId] = true;
                totalEventos++;
            }
        });

        var totales = GastosHelpers.calcularTotales(gastos);

        var visiblesEl = document.getElementById('mov-gastos-visibles');
        var proyEl = document.getElementById('mov-gastos-proyectados');
        var desEl = document.getElementById('mov-gastos-desembolsados');
        var evEl = document.getElementById('mov-gastos-eventos');

        if (visiblesEl) visiblesEl.textContent = gastos.length;
        if (proyEl) proyEl.textContent = '$' + formatters.precio(totales.totalProyectado);
        if (desEl) desEl.textContent = '$' + formatters.precio(totales.totalDesembolsado);
        if (evEl) evEl.textContent = totalEventos;
    }

    // -- Table helpers -------------------------------------------------------

    /**
     * Adds data-gasto-id attributes to table rows for fade-out animation targeting.
     * @param {string} tableBodyId
     * @param {Array} gastos
     */
    function addGastoIdsToRows(tableBodyId, gastos) {
        var tbody = document.getElementById(tableBodyId);
        if (!tbody) return;
        var rows = tbody.children;
        for (var i = 0; i < rows.length && i < gastos.length; i++) {
            if (gastos[i] && gastos[i].id) {
                rows[i].setAttribute('data-gasto-id', gastos[i].id);
            }
        }
    }

    // -- Exports --------------------------------------------------------------

    window.GastosRender = {
        renderConceptoCell,
        renderNotaCell,
        renderEventoCell,
        generarAccionesGasto,
        COLUMNAS_GASTOS,
        COLUMNAS_GASTOS_GLOBAL,
        actualizarResumenEvento,
        renderPaginacionGastos,
        renderResumenEventoSeleccionado,
        renderDrawerContexto,
        actualizarChipsGasto,
        actualizarResultsCount,
        actualizarBarraProgreso,
        addGastoIdsToRows,
        actualizarStatsGlobales,
        toggleEventosGlobales,
        renderEventosGlobalesLista,
        limpiarBusquedaEventosGlobales,
        initBusquedaEventosGlobales
    };
})();
