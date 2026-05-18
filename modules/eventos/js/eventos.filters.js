(function () {
    const { EVENTO_ESTADOS, KPI_FILTERS } = window.EventosConstants;
    const { EVENTO_LABELS, KPI_FILTER_LABELS } = window.EventosLabels;
    const state = window.EventosState.getState();

    function aplicarFiltroFecha(onChange) {
        const desde = document.getElementById('kpi-fecha-desde').value;
        const hasta = document.getElementById('kpi-fecha-hasta').value;
        state.filtros.fechaDesde = desde || null;
        state.filtros.fechaHasta = hasta || null;

        const btnLimpiar = document.getElementById('kpi-limpiar-fechas');
        if (btnLimpiar) btnLimpiar.classList.toggle('hidden', !(state.filtros.fechaDesde || state.filtros.fechaHasta));

        if (typeof onChange === 'function') onChange();
    }

    function limpiarFiltroFechas(onChange) {
        document.getElementById('kpi-fecha-desde').value = '';
        document.getElementById('kpi-fecha-hasta').value = '';
        state.filtros.fechaDesde = null;
        state.filtros.fechaHasta = null;
        const btnLimpiar = document.getElementById('kpi-limpiar-fechas');
        if (btnLimpiar) btnLimpiar.classList.add('hidden');
        if (typeof onChange === 'function') onChange();
    }

    function filtrarPorFecha(datos) {
        if (!state.filtros.fechaDesde && !state.filtros.fechaHasta) return datos;
        return datos.filter(evento => {
            if (!evento.fecha) return false;
            if (state.filtros.fechaDesde && evento.fecha < state.filtros.fechaDesde) return false;
            if (state.filtros.fechaHasta && evento.fecha > state.filtros.fechaHasta) return false;
            return true;
        });
    }

    function filtrarPorKpi(datos) {
        const config = KPI_FILTERS[state.filtros.kpi];
        if (!config || !config.estados) return datos;
        return datos.filter(evento => config.estados.includes((evento.estadoEventoNombre || '').trim()));
    }

    function getKpiLabel(filtro) {
        return KPI_FILTER_LABELS[filtro] || filtro;
    }

    function actualizarKPIs(datos) {
        const datosFiltrados = filtrarPorFecha(datos);
        const counts = { total: datosFiltrados.length, accion: 0, ejecucion: 0, PENDIENTE_COBRO: 0 };

        datosFiltrados.forEach(evento => {
            const estado = (evento.estadoEventoNombre || '').trim();
            if (KPI_FILTERS.accion.estados.includes(estado)) counts.accion++;
            if (KPI_FILTERS.ejecucion.estados.includes(estado)) counts.ejecucion++;
            if (estado === EVENTO_ESTADOS.PENDIENTE_COBRO) counts.PENDIENTE_COBRO++;
        });

        setValue('kpi-total', counts.total);
        setValue('kpi-accion', counts.accion);
        setValue('kpi-ejecucion', counts.ejecucion);
        setValue('kpi-pendiente-cobro', counts.PENDIENTE_COBRO);

        document.querySelectorAll('.kpi-card').forEach(card => {
            card.classList.toggle('active', card.dataset.filter === state.filtros.kpi);
        });
    }

    function actualizarContadoresFiltro(datos) {
        const datosFiltrados = filtrarPorFecha(datos);
        const counts = {};
        datosFiltrados.forEach(evento => {
            const estado = (evento.estadoEventoNombre || '').trim();
            counts[estado] = (counts[estado] || 0) + 1;
        });

        const select = document.getElementById('filter-estado');
        if (!select) return;

        const opciones = [
            { value: 'todos', label: 'Todos', count: datosFiltrados.length },
            { value: EVENTO_ESTADOS.COTIZACION, label: EVENTO_LABELS[EVENTO_ESTADOS.COTIZACION], count: counts.COTIZACION || 0 },
            { value: EVENTO_ESTADOS.PROGRAMADO, label: EVENTO_LABELS[EVENTO_ESTADOS.PROGRAMADO], count: counts.PROGRAMADO || 0 },
            { value: EVENTO_ESTADOS.CONFIRMADO, label: EVENTO_LABELS[EVENTO_ESTADOS.CONFIRMADO], count: counts.CONFIRMADO || 0 },
            { value: EVENTO_ESTADOS.EN_MONTAJE, label: EVENTO_LABELS[EVENTO_ESTADOS.EN_MONTAJE], count: counts.EN_MONTAJE || 0 },
            { value: EVENTO_ESTADOS.PENDIENTE_COBRO, label: EVENTO_LABELS[EVENTO_ESTADOS.PENDIENTE_COBRO], count: counts.PENDIENTE_COBRO || 0 },
            { value: EVENTO_ESTADOS.CANCELACION_PENDIENTE, label: EVENTO_LABELS[EVENTO_ESTADOS.CANCELACION_PENDIENTE], count: counts.CANCELACION_PENDIENTE || 0 },
            { value: EVENTO_ESTADOS.FINALIZADO, label: EVENTO_LABELS[EVENTO_ESTADOS.FINALIZADO], count: counts.FINALIZADO || 0 },
            { value: EVENTO_ESTADOS.CANCELADO, label: EVENTO_LABELS[EVENTO_ESTADOS.CANCELADO], count: counts.CANCELADO || 0 }
        ];

        const valorActual = select.value;
        select.innerHTML = opciones.map(opcion => `<option value="${opcion.value}">${opcion.label} (${opcion.count})</option>`).join('');
        select.value = valorActual;
    }

    function actualizarChipsFiltros() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        const filtro = document.getElementById('filter-estado').value;
        const query = document.getElementById('search-input').value.trim();
        const chips = [];

        if (state.filtros.kpi !== 'todos') {
            chips.push(`<span class="filter-chip filter-chip--kpi"><span>${getKpiLabel(state.filtros.kpi)}</span><button class="filter-chip-remove" onclick="limpiarKpiFiltro()" title="Quitar KPI"><i data-lucide="x"></i></button></span>`);
        }

        if (filtro !== 'todos') {
            const select = document.getElementById('filter-estado');
            const label = select.options[select.selectedIndex]?.text.replace(/\s*\(\d+\)$/, '') || filtro;
            chips.push(`<span class="filter-chip filter-chip--estado"><span>${label}</span><button class="filter-chip-remove" onclick="limpiarFiltroEstado()" title="Quitar filtro"><i data-lucide="x"></i></button></span>`);
        }

        if (query) {
            chips.push(`<span class="filter-chip filter-chip--search"><span>"${query}"</span><button class="filter-chip-remove" onclick="limpiarBusqueda()" title="Quitar búsqueda"><i data-lucide="x"></i></button></span>`);
        }

        if (state.filtros.fechaDesde || state.filtros.fechaHasta) {
            const desde = state.filtros.fechaDesde ? formatFecha(state.filtros.fechaDesde) : '—';
            const hasta = state.filtros.fechaHasta ? formatFecha(state.filtros.fechaHasta) : '—';
            chips.push(`<span class="filter-chip filter-chip--fecha"><span>${desde} → ${hasta}</span><button class="filter-chip-remove" onclick="limpiarFiltroFechas()" title="Quitar filtro de fechas"><i data-lucide="x"></i></button></span>`);
        }

        if (chips.length > 0) {
            chips.push(`<button class="filter-chip--clear" onclick="limpiarTodosFiltros()">Limpiar todo</button>`);
            container.innerHTML = chips.join('');
            container.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.classList.add('hidden');
        container.innerHTML = '';
    }

    function actualizarResultsCount(datos) {
        const container = document.getElementById('results-count');
        if (!container) return;
        const filtro = document.getElementById('filter-estado').value;
        const query = document.getElementById('search-input').value.trim();

        if (state.filtros.kpi !== 'todos' || filtro !== 'todos' || query || state.filtros.fechaDesde || state.filtros.fechaHasta) {
            container.innerHTML = `<span class="results-count-text">Mostrando <strong>${datos.length}</strong> resultado${datos.length !== 1 ? 's' : ''} en página actual</span>`;
            container.classList.remove('hidden');
            return;
        }

        container.classList.add('hidden');
    }

    function limpiarFiltroEstado(onChange) {
        document.getElementById('filter-estado').value = 'todos';
        if (typeof onChange === 'function') onChange();
    }

    function limpiarKpiFiltro(onChange, refiltrar = true) {
        state.filtros.kpi = 'todos';
        if (refiltrar && typeof onChange === 'function') onChange();
    }

    function limpiarBusqueda(onChange) {
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear').classList.add('hidden');
        if (typeof onChange === 'function') onChange();
    }

    function limpiarTodosFiltros(onChange) {
        document.getElementById('filter-estado').value = 'todos';
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear').classList.add('hidden');
        state.filtros.kpi = 'todos';
        limpiarFiltroFechas(onChange);
    }

    function initEventosFilters(onChange) {
        document.querySelectorAll('.kpi-card').forEach(card => {
            card.addEventListener('click', () => {
                document.getElementById('filter-estado').value = 'todos';
                state.filtros.kpi = state.filtros.kpi === card.dataset.filter ? 'todos' : card.dataset.filter;
                if (typeof onChange === 'function') onChange();
            });
        });
    }

    function aplicarFiltros(datos, filtroExacto, query) {
        let filtrados = filtrarPorFecha(datos);
        filtrados = filtrarPorKpi(filtrados);

        if (filtroExacto !== 'todos') {
            filtrados = filtrados.filter(evento => evento.estadoEventoNombre === filtroExacto);
        }

        if (query) {
            filtrados = filtrados.filter(evento =>
                String(evento.id).includes(query) ||
                evento.clienteNombre?.toLowerCase().includes(query) ||
                evento.ubicacion?.toLowerCase().includes(query)
            );
        }

        return filtrados;
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    window.EventosFilters = Object.freeze({
        initEventosFilters,
        aplicarFiltroFecha,
        limpiarFiltroFechas,
        limpiarFiltroEstado,
        limpiarKpiFiltro,
        limpiarBusqueda,
        limpiarTodosFiltros,
        actualizarKPIs,
        actualizarContadoresFiltro,
        actualizarChipsFiltros,
        actualizarResultsCount,
        aplicarFiltros
    });
})();
