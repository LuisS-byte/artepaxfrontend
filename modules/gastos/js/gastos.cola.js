/**
 * modules/gastos/js/gastos.cola.js
 * Cola de control de egresos: carga, filtrado, renderizado y selección de eventos.
 *
 * Dependencias (resueltas en runtime — el orden de <script defer> garantiza disponibilidad):
 *   GastosState             (js/gastos.state.js)
 *   GastosHelpers           (js/gastos.helpers.js)
 *   GastosAPI               (js/gastos.api.js)
 *   formatters.*            (js/shared/formatters.js)
 *   mostrarAlerta()         (js/shared/alerts.js)
 *   cargarGastosEvento()    (gastos.js)
 */
(function () {
    'use strict';

    // ── Carga de datos ────────────────────────────────

    /**
     * Carga los eventos de control desde el backend y renderiza la cola.
     */
    async function cargarEventosControl() {
        try {
            GastosState.colaCargando = true;
            renderizarColaEgresos();

            var eventos = await GastosAPI.listarEventosControl();
            GastosState.eventosControl = (eventos || []).map(GastosHelpers.normalizarEventoControl);

            GastosState.colaCargando = false;
            renderizarColaEgresos();

            // Re-renderizar lista global de eventos si está visible
            if (typeof GastosRender !== 'undefined' && typeof GastosRender.renderEventosGlobalesLista === 'function') {
                GastosRender.renderEventosGlobalesLista();
            }
        } catch (err) {
            GastosState.colaCargando = false;
            GastosState.eventosControl = [];
            mostrarAlerta('error', 'Error al cargar eventos de control: ' + err.message);
            renderizarColaEgresos();
        }
    }

    // ── Filtrado y ordenamiento ──────────────────────

    /**
     * Retorna los eventos filtrados + ordenados para la cola de egresos.
     * @returns {Array}
     */
    function getColaEgresosFiltrados() {
        var eventos = GastosState.eventosControl;
        if (!Array.isArray(eventos)) return [];

        // Aplicar filtro por chip
        var filtro = GastosState.filtroCola;
        if (filtro && filtro !== 'todos') {
            eventos = eventos.filter(function (ev) {
                switch (filtro) {
                    case 'pendientes':
                        return Number(ev.totalProyectado) > 0;
                    case 'operativos':
                        return ev.permiteRegistrarGasto === true;
                    case 'montaje':
                        return ev.estadoEventoNombre === 'EN_MONTAJE';
                    case 'sin-gastos':
                        return Number(ev.cantidadGastos) === 0 && ev.permiteRegistrarGasto === true;
                    default:
                        return true;
                }
            });
        }

        // Aplicar búsqueda textual
        var busqueda = (GastosState.busquedaCola || '').trim().toLowerCase();
        if (busqueda) {
            eventos = eventos.filter(function (ev) {
                var cliente = (ev.clienteNombre || '').toLowerCase();
                var ubicacion = (ev.ubicacion || '').toLowerCase();
                var idMatch = String(ev.id) === busqueda || ('#' + ev.id) === busqueda;
                return cliente.includes(busqueda) || ubicacion.includes(busqueda) || idMatch;
            });
        }

        // Ordenar: totalProyectado DESC, estado priority, fecha ASC, id DESC
        var prioridadEstado = {
            EN_MONTAJE: 0,
            CONFIRMADO: 1,
            PROGRAMADO: 2
        };

        return eventos.sort(function (a, b) {
            // Proyectado DESC
            var proyA = Number(a.totalProyectado || 0);
            var proyB = Number(b.totalProyectado || 0);
            if (proyA !== proyB) return proyB - proyA;

            // Estado priority
            var priA = prioridadEstado[a.estadoEventoNombre] !== undefined ? prioridadEstado[a.estadoEventoNombre] : 9;
            var priB = prioridadEstado[b.estadoEventoNombre] !== undefined ? prioridadEstado[b.estadoEventoNombre] : 9;
            if (priA !== priB) return priA - priB;

            // Fecha ASC
            if (a.fecha && b.fecha) {
                var dateA = new Date(a.fecha);
                var dateB = new Date(b.fecha);
                if (dateA - dateB !== 0) return dateA - dateB;
            }

            // ID DESC
            return Number(b.id || 0) - Number(a.id || 0);
        });
    }

    // ── KPIs de la cola ──────────────────────────────

    function actualizarKPIsCola() {
        var eventos = GastosState.eventosControl;
        if (!Array.isArray(eventos)) eventos = [];

        var total = eventos.length;
        var pendientes = eventos.filter(function (ev) { return Number(ev.totalProyectado) > 0; }).length;
        var operativos = eventos.filter(function (ev) { return ev.permiteRegistrarGasto === true; }).length;
        var montaje = eventos.filter(function (ev) { return ev.estadoEventoNombre === 'EN_MONTAJE'; }).length;
        var sinGastos = eventos.filter(function (ev) { return Number(ev.cantidadGastos) === 0 && ev.permiteRegistrarGasto === true; }).length;

        // Actualizar KPIs
        var pendientesEl = document.getElementById('cola-pendientes');
        var operativosEl = document.getElementById('cola-operativos');
        var montajeEl = document.getElementById('cola-montaje');
        var sinGastosEl = document.getElementById('cola-sin-gastos');

        if (pendientesEl) pendientesEl.textContent = pendientes;
        if (operativosEl) operativosEl.textContent = operativos;
        if (montajeEl) montajeEl.textContent = montaje;
        if (sinGastosEl) sinGastosEl.textContent = sinGastos;

        // Actualizar etiqueta de chips (sin conteo)
        var chipLabels = {
            pendientes: 'Pendientes',
            operativos: 'Operativos',
            montaje: 'En montaje',
            'sin-gastos': 'Sin gastos'
        };
        Object.keys(chipLabels).forEach(function (filter) {
            var chip = document.querySelector('.egresos-chip[data-filter="' + filter + '"]');
            if (chip && chip.textContent !== chipLabels[filter]) {
                chip.textContent = chipLabels[filter];
            }
        });
    }

    // ── Renderizado de la cola ───────────────────────

    function renderizarColaEgresos() {
        var container = document.getElementById('egresos-queue-list');
        if (!container) return;

        actualizarKPIsCola();

        if (GastosState.colaCargando && !GastosState.eventosControl.length) {
            container.innerHTML = '<div class="egresos-queue-empty">Cargando eventos...</div>';
            return;
        }

        var eventos = getColaEgresosFiltrados();
        if (!eventos.length) {
            container.innerHTML = '<div class="egresos-queue-empty">No hay eventos que coincidan con los filtros actuales.</div>';
            return;
        }

        container.innerHTML = eventos.map(function (ev) {
            var active = String(ev.id) === String(GastosState.eventoSeleccionadoId) ? ' active' : '';
            var badgeClass = GastosHelpers.getBadgeEstadoEvento(ev.estadoEventoNombre);
            var estadoLabel = formatters.textoSeguro(ev.estadoEventoNombre || '-');
            var clienteNombre = formatters.textoSeguro(ev.clienteNombre || 'Evento sin cliente');
            var fecha = ev.fecha ? formatters.fecha(ev.fecha) : '-';
            var ubicacion = ev.ubicacion ? formatters.textoSeguro(ev.ubicacion) : '';
            var proyectado = formatters.precio(Number(ev.totalProyectado || 0));
            var desembolsado = formatters.precio(Number(ev.totalDesembolsado || 0));
            var pendiente = formatters.precio(Number(ev.totalPendiente || 0));
            var sinGastos = Number(ev.cantidadGastos) === 0;
            var alerta = Number(ev.totalProyectado) > Number(ev.totalDesembolsado) && Number(ev.totalProyectado) > 0;

            // Helper text
            var helperText, helperClass;
            if (alerta) {
                helperText = 'Pendiente $' + pendiente;
                helperClass = 'warning';
            } else if (ev.permiteRegistrarGasto && sinGastos) {
                helperText = 'Sin gastos';
                helperClass = 'neutral';
            } else if (ev.permiteRegistrarGasto) {
                helperText = 'Al día';
                helperClass = 'success';
            } else if (!sinGastos) {
                helperText = 'Solo consulta';
                helperClass = 'neutral';
            } else {
                helperText = 'Sin gastos';
                helperClass = 'neutral';
            }

            var ubicacionHtml = ubicacion ? '<span class="egresos-queue-location"><i data-lucide="map-pin" style="width:11px;height:11px"></i>' + ubicacion + '</span>' : '';

            var metricsHtml = sinGastos
                ? '<div class="egresos-queue-metrics egresos-queue-metrics--empty"><i data-lucide="inbox" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;color:var(--neutral-400)"></i><span class="egresos-queue-no-gastos">Sin gastos registrados</span></div>'
                : '<div class="egresos-queue-metrics">'
                    + 'Pend $' + pendiente + '<span class="sep">·</span>'
                    + 'Des $' + desembolsado + '<span class="sep">·</span>'
                    + 'Proy $' + proyectado
                + '</div>';

            var alertClass = alerta ? ' egresos-queue-item--alerta' : '';

            return '<button type="button" class="egresos-queue-item' + active + alertClass + '" onclick="GastosCola.seleccionarEventoCola(' + ev.id + ')">'
                + '<div class="egresos-queue-item-top">'
                    + '<strong>' + clienteNombre + '</strong>'
                    + '<span class="badge ' + badgeClass + ' egresos-queue-badge">' + estadoLabel + '</span>'
                    + '<span class="egresos-queue-id">#' + ev.id + '</span>'
                + '</div>'
                + '<div class="egresos-queue-meta">'
                    + '<span class="egresos-queue-date">' + fecha + '</span>'
                    + ubicacionHtml
                + '</div>'
                + metricsHtml
                + '<span class="egresos-queue-helper ' + helperClass + '">' + helperText + '</span>'
            + '</button>';
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ── Filtros y búsqueda ───────────────────────────

    /**
     * Establece el filtro activo y re-renderiza la cola.
     * @param {string} filtro - 'pendientes'|'operativos'|'montaje'|'sin-gastos'|'todos'
     */
    function setFiltroCola(filtro) {
        GastosState.filtroCola = filtro;
        document.querySelectorAll('.egresos-chip').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.filter === filtro);
        });
        renderizarColaEgresos();
    }

    /**
     * Vincula el input de búsqueda con debounce.
     */
    function initBusquedaCola() {
        var input = document.getElementById('input-buscar-evento');
        var clearBtn = document.getElementById('egresos-search-clear');
        if (!input) return;

        var debounceTimer = null;
        input.addEventListener('input', function () {
            var valor = input.value.trim();
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                GastosState.busquedaCola = valor;
                if (clearBtn) clearBtn.classList.toggle('hidden', !valor);
                renderizarColaEgresos();
            }, 300);
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                limpiarBusquedaCola();
                input.blur();
            }
        });
    }

    /**
     * Limpia la búsqueda y re-renderiza.
     */
    function limpiarBusquedaCola() {
        var input = document.getElementById('input-buscar-evento');
        var clearBtn = document.getElementById('egresos-search-clear');
        if (input) {
            input.value = '';
            GastosState.busquedaCola = '';
        }
        if (clearBtn) clearBtn.classList.add('hidden');
        renderizarColaEgresos();
    }

    // ── Selección de evento ──────────────────────────

    /**
     * Selecciona un evento de la cola y carga su detalle.
     * @param {number|string} id - ID del evento
     */
    function seleccionarEventoCola(id) {
        GastosState.eventoSeleccionadoId = String(id);
        renderizarColaEgresos();

        // Optimistic render: mostrar totales desde la cola mientras carga la API
        var evento = GastosState.eventosControl.find(function (ev) { return String(ev.id) === String(id); });
        if (evento) {
            var proyEl = document.getElementById('total-proyectado');
            var desEl = document.getElementById('total-desembolsado');
            var pendEl = document.getElementById('total-pendiente');
            if (proyEl) proyEl.textContent = GastosHelpers.getMonto(evento.totalProyectado);
            if (desEl) desEl.textContent = GastosHelpers.getMonto(evento.totalDesembolsado);
            if (pendEl) pendEl.textContent = GastosHelpers.getMonto(evento.totalPendiente);

            // Progress bar optimista
            var progreso = GastosHelpers.calcularProgreso(evento.totalProyectado, evento.totalDesembolsado);
            var barContainer = document.getElementById('progress-bar-gasto-container');
            var barFill = document.getElementById('progress-bar-fill');
            var barPercent = document.getElementById('progress-bar-percent');
            if (barContainer) barContainer.classList.remove('hidden');
            if (barFill) {
                barFill.style.width = progreso.percent + '%';
                barFill.className = 'progress-bar-fill ' + progreso.class;
            }
            if (barPercent) barPercent.textContent = progreso.percent + '%';
        }

        cargarGastosEvento();

        // Scroll suave al detalle en mobile
        var detailPanel = document.getElementById('gastos-container');
        if (detailPanel && !detailPanel.classList.contains('hidden') && window.innerWidth <= 768) {
            detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ── Inicialización (llamada externamente) ────────

    /**
     * Inicializa la cola: carga eventos, vincula búsqueda.
     */
    function initColaEgresos() {
        initBusquedaCola();
        cargarEventosControl();
    }

    // ── Exports ───────────────────────────────────────

    window.GastosCola = {
        cargarEventosControl: cargarEventosControl,
        getColaEgresosFiltrados: getColaEgresosFiltrados,
        actualizarKPIsCola: actualizarKPIsCola,
        renderizarColaEgresos: renderizarColaEgresos,
        setFiltroCola: setFiltroCola,
        seleccionarEventoCola: seleccionarEventoCola,
        initBusquedaCola: initBusquedaCola,
        limpiarBusquedaCola: limpiarBusquedaCola,
        initColaEgresos: initColaEgresos
    };

    window.seleccionarEventoCola = seleccionarEventoCola;
    window.setFiltroCola = setFiltroCola;
    window.limpiarBusquedaCola = limpiarBusquedaCola;
})();
