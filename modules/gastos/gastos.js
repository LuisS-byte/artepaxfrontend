/**
 * modules/gastos/gastos.js
 * Gestión de gastos variables atribuibles a eventos.
 * Orquestador: loaders, tabs, init.
 */

function getEventoById(id) {
    return GastosState.eventosControl.find(evento => String(evento.id) === String(id))
        || null;
}

function cambiarTab(tab) {
    GastosState.tabActual = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.getElementById('view-todos').classList.toggle('hidden', tab !== 'todos');
    document.getElementById('view-evento').classList.toggle('hidden', tab !== 'evento');

    if (tab === 'todos' && GastosState.gastosGlobalesBase.length === 0) {
        cargarGastosGlobales();
    }

    if (tab === 'evento' && GastosState.eventosControl.length === 0) {
        if (typeof GastosCola !== 'undefined') {
            GastosCola.cargarEventosControl();
        }
    }
}

async function cargarGastosGlobales(page = 0) {
    GastosState.paginaActual = page;
    modulos.setTableLoading('tabla-gastos-global', 8, 'Cargando gastos...');

    const estado = document.getElementById('filter-estado-gasto').value;
    const fechaDesde = GastosHelpers.toComparableDate(document.getElementById('filter-fecha-desde').value);
    const fechaHasta = GastosHelpers.toComparableDate(document.getElementById('filter-fecha-hasta').value, true);

    try {
        const response = await GastosAPI.listarGastos({ page: GastosState.paginaActual, size: 50, sort: 'gastoFecha,desc' });
        GastosState.gastosGlobalesBase = response.content || [];
        GastosState.totalPaginas = response.totalPages || 0;
        GastosState.totalElementos = response.totalElements || 0;

        GastosState.gastosGlobales = GastosState.gastosGlobalesBase.filter(gasto => {
            const fecha = GastosHelpers.toComparableDate(gasto.gastoFecha);
            if (estado && gasto.gastoEstado !== estado) return false;
            if (fechaDesde && (!fecha || fecha < fechaDesde)) return false;
            if (fechaHasta && (!fecha || fecha > fechaHasta)) return false;
            return true;
        });

        modulos.renderTabla(GastosState.gastosGlobales, 'tabla-gastos-global', GastosRender.COLUMNAS_GASTOS_GLOBAL);
        GastosRender.addGastoIdsToRows('tabla-gastos-global', GastosState.gastosGlobales);
        GastosRender.renderPaginacionGastos();
        GastosRender.actualizarStatsGlobales();
        // Re-aplicar filtro combinado (búsqueda + KPI) si hay uno activo
        if (GastosState.busqueda || GastosState.kpiActivo) {
            GastosActions.realizarFiltroCombinado();
        } else {
            // Aun sin search/KPI, actualizar chips y contador
            // (para reflejar filtros de estado y fecha)
            GastosRender.actualizarChipsGasto();
            GastosRender.actualizarResultsCount();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        modulos.setTableError('tabla-gastos-global', 8, 'Error al cargar gastos.');
        mostrarAlerta('error', 'Error al cargar gastos: ' + err.message);
    }
}

async function cargarGastosEvento() {
    // Read from state (cola selection)
    GastosState.eventoSeleccionadoResumen = getEventoById(GastosState.eventoSeleccionadoId);

    const container = document.getElementById('gastos-container');
    const emptyState = document.getElementById('gastos-empty');

    if (!GastosState.eventoSeleccionadoId || !GastosState.eventoSeleccionadoResumen) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    modulos.setTableLoading('tabla-gastos', 6, 'Cargando gastos...');

    try {
        const [gastos, resumen] = await Promise.all([
            GastosAPI.listarGastosPorEvento(GastosState.eventoSeleccionadoId),
            GastosAPI.obtenerResumenEvento(GastosState.eventoSeleccionadoId).catch(() => null)
        ]);

        GastosState.gastosActuales = gastos || [];
        GastosState.resumenEventoActual = resumen || GastosHelpers.calcularTotales(GastosState.gastosActuales);
        GastosRender.renderResumenEventoSeleccionado();

        if (!GastosState.gastosActuales.length) {
            // Empty state
            var tbody = document.getElementById('tabla-gastos');
            if (tbody) {
                var editable = GastosHelpers.eventoPermiteGasto(GastosState.eventoSeleccionadoResumen);
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state-table">'
                    + (editable
                        ? 'Todavía no hay gastos. <button class="btn btn-primary btn-sm" onclick="abrirDrawerGasto()" style="margin-left:8px">+ Registrar primer gasto</button>'
                        : 'Este evento no tiene gastos registrados.')
                    + '</td></tr>';
            }
        } else {
            modulos.renderTabla(GastosState.gastosActuales, 'tabla-gastos', GastosRender.COLUMNAS_GASTOS);
            GastosRender.addGastoIdsToRows('tabla-gastos', GastosState.gastosActuales);
        }

        GastosRender.actualizarResumenEvento();
        GastosRender.actualizarBarraProgreso();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        modulos.setTableError('tabla-gastos', 6, 'Error al cargar gastos.');
        mostrarAlerta('error', 'Error al cargar gastos: ' + err.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    modulos.initFechas();

    // Inicializar búsqueda del tab 'todos' (se usa si cambia a ese tab)
    GastosActions.initBusquedaGasto(function () {
        GastosActions.realizarFiltroCombinado();
    });
    GastosRender.initBusquedaEventosGlobales();

    // Inicializar concept chips y cola (tab 'evento' es el default)
    GastosActions.initConceptChips();
    if (typeof GastosCola !== 'undefined') {
        GastosCola.initBusquedaCola();
        GastosCola.cargarEventosControl();
    }

    // Si hay un eventoId en la URL, seleccionarlo
    const eventoId = new URLSearchParams(window.location.search).get('eventoId');
    if (eventoId) {
        var urlParamInterval = window.setInterval(function () {
            if (GastosState.eventosControl.length > 0) {
                GastosCola.seleccionarEventoCola(eventoId);
                window.clearInterval(urlParamInterval);
            }
        }, 100);
        window.setTimeout(function () { window.clearInterval(urlParamInterval); }, 3000);
    }
});

window.cambiarTab = cambiarTab;
window.cargarGastosGlobales = cargarGastosGlobales;
window.cargarGastosEvento = cargarGastosEvento;
