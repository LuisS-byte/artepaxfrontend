/**
 * modules/documentos/documentos.js
 * Gestion y generacion de documentos PDF por evento.
 * Orquestador: loaders, tabs, cola de eventos, deep-link.
 */

// =========================================================================
//   TABS
// =========================================================================

function cambiarTab(tab) {
    DocumentosState.tabActual = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    document.getElementById('view-evento').classList.toggle('hidden', tab !== 'evento');
    document.getElementById('view-global').classList.toggle('hidden', tab !== 'global');
    document.getElementById('view-plantillas').classList.toggle('hidden', tab !== 'plantillas');

    if (tab === 'global' && !DocumentosState.documentosGlobales.length) cargarDocumentosGlobales();
    if (tab === 'plantillas') cargarPlantillas();
}

// =========================================================================
//   CARGA DE EVENTOS PARA LA COLA
// =========================================================================

async function cargarEventosParaDocs() {
    try {
        DocumentosState.colaCargando = true;
        DocumentosRender.renderColaEventos();

        const [eventos, cobranzaData] = await Promise.all([
            DocumentosAPI.listarEventos(),
            DocumentosAPI.listarCobranzaEventos().catch(() => [])
        ]);

        DocumentosState.eventosDisponibles = (eventos || []).filter(e => e.estadoEventoNombre !== 'CANCELADO');
        DocumentosState.eventosSaldoPendiente = Object.fromEntries(
            (cobranzaData || []).map(row => [String(row.eventoId || row.id), Number(row.saldoPendiente || 0)])
        );

        DocumentosState.colaCargando = false;
        DocumentosRender.renderColaEventos();
        DocumentosRender.actualizarKpisDocumentos();
    } catch (err) {
        DocumentosState.colaCargando = false;
        mostrarAlerta('error', 'Error al cargar eventos: ' + err.message);
    }
}

// =========================================================================
//   FILTRO DE COLA
// =========================================================================

function setFiltroEventosDoc(filtro) {
    DocumentosState.filtroEventosDoc = filtro;
    document.querySelectorAll('.doc-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filtro);
    });
    DocumentosRender.renderColaEventos();
}

// =========================================================================
//   SELECCIÓN DE EVENTO
// =========================================================================

async function seleccionarEventoDoc(id) {
    DocumentosState.eventoSeleccionadoId = String(id);
    DocumentosRender.renderColaEventos();
    await cargarDocumentosEvento();
}

// =========================================================================
//   CARGA DE DOCUMENTOS POR EVENTO
// =========================================================================

async function cargarDocumentosEvento() {
    const eventoId = DocumentosState.eventoSeleccionadoId;
    const wrapper = document.getElementById('documentos-evento-wrapper');
    const emptyState = document.getElementById('documentos-empty');

    if (!eventoId) {
        wrapper.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    wrapper.classList.remove('hidden');
    DocumentosRender.renderSkeleton('tabla-documentos', [8, 25, 18, 18, 12, 16]);

    try {
        DocumentosState.eventoSeleccionadoResumen = DocumentosState.eventosDisponibles.find(e => String(e.id) === String(eventoId)) || null;
        const [docs, resumen] = await Promise.all([
            DocumentosAPI.listarDocumentosEvento(eventoId),
            DocumentosAPI.obtenerResumenPago(eventoId).catch(() => null)
        ]);
        DocumentosState.documentosActuales = docs;
        DocumentosState.resumenPagoEvento = resumen;

        // Cachear stats para la cola
        DocumentosRender.cachearStatsDocumentos(eventoId, docs);

        // Renderizar contexto + KPIs + banner
        DocumentosRender.renderContextoDocumentos();
        DocumentosRender.renderAccionesEvento();
        modulos.renderTabla(DocumentosState.documentosActuales, 'tabla-documentos', DocumentosRender.COLUMNAS_DOCS);

        // Refrescar cola para reflejar stats cacheados
        DocumentosRender.renderColaEventos();

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    } catch (err) {
        modulos.setTableError('tabla-documentos', 6, 'Error al cargar documentos.');
        mostrarAlerta('error', 'Error al cargar documentos: ' + err.message);
    }
}

// =========================================================================
//   LISTADO GLOBAL
// =========================================================================

async function cargarDocumentosGlobales(page = 0) {
    DocumentosState.paginaGlobalActual = page;
    DocumentosRender.renderSkeleton('tabla-documentos-global', [20, 14, 25, 14, 8, 18, 14]);

    const params = { page: DocumentosState.paginaGlobalActual, size: 50, sort: 'docuFechaGeneracion,desc' };
    try {
        const response = await DocumentosAPI.listarDocumentosGlobales(params);
        DocumentosState.documentosGlobalesBase = response.content || [];
        DocumentosState.totalPaginasGlobal = response.totalPages || 0;
        filtrarDocumentosGlobales();
        DocumentosRender.renderPaginacionGlobal();
    } catch (err) {
        modulos.setTableError('tabla-documentos-global', 7, 'Error al cargar documentos globales.');
        mostrarAlerta('error', 'Error al cargar listado global: ' + err.message);
    }
}

function filtrarDocumentosGlobales() {
    const estado = DocumentosState.filtrosGlobales.estado;
    const query = DocumentosState.filtrosGlobales.query.trim().toLowerCase();

    DocumentosState.documentosGlobales = (DocumentosState.documentosGlobalesBase || []).filter(doc => {
        if (estado !== 'todos' && doc.docuEstadoEnvio !== estado) return false;
        if (query) {
            const cliente = (doc.clienteNombre || '').toLowerCase();
            const idEvento = String(doc.idEvento || '');
            if (!cliente.includes(query) && !idEvento.includes(query)) return false;
        }
        return true;
    });

    modulos.renderTabla(DocumentosState.documentosGlobales, 'tabla-documentos-global', DocumentosRender.COLUMNAS_DOCS_GLOBAL);
    DocumentosRender.actualizarKpisDocumentos();
    DocumentosRender.actualizarChipsFiltrosGlobales();
    DocumentosRender.actualizarResultsCountGlobales();
}

function limpiarFiltroEstadoGlobal() {
    document.getElementById('filter-estado-doc-global').value = 'todos';
    DocumentosState.filtrosGlobales.estado = 'todos';
    filtrarDocumentosGlobales();
}

function limpiarBusquedaGlobal() {
    document.getElementById('search-documentos-global').value = '';
    DocumentosState.filtrosGlobales.query = '';
    filtrarDocumentosGlobales();
}

function limpiarTodosFiltrosGlobales() {
    document.getElementById('filter-estado-doc-global').value = 'todos';
    document.getElementById('search-documentos-global').value = '';
    DocumentosState.filtrosGlobales.estado = 'todos';
    DocumentosState.filtrosGlobales.query = '';
    filtrarDocumentosGlobales();
}

// =========================================================================
//   PLANTILLAS
// =========================================================================

async function cargarPlantillas() {
    DocumentosRender.renderSkeleton('tabla-plantillas', [40, 18, 25, 16]);

    try {
        const response = await DocumentosAPI.listarPlantillas();
        if (!response || !Array.isArray(response)) throw new Error('Formato inesperado');
        modulos.renderTabla(response, 'tabla-plantillas', DocumentosRender.COLUMNAS_PLANTILLAS);
    } catch (err) {
        modulos.setTableError('tabla-plantillas', 4, 'Error al cargar plantillas.');
        mostrarAlerta('error', 'Error al cargar plantillas: ' + err.message);
    }
}

// =========================================================================
//   INIT
// =========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // ── Búsqueda en cola de eventos ──
    const searchDocQueue = document.getElementById('input-buscar-evento-doc');
    if (searchDocQueue) {
        searchDocQueue.addEventListener('input', (e) => {
            DocumentosState.busquedaEventosDoc = e.target.value || '';
            DocumentosRender.renderColaEventos();
        });
    }

    // ── Búsqueda global ──
    const searchInput = document.getElementById('search-documentos-global');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            DocumentosState.filtrosGlobales.query = e.target.value;
            filtrarDocumentosGlobales();
        }, 300));
    }

    const stateSelect = document.getElementById('filter-estado-doc-global');
    if (stateSelect) {
        stateSelect.addEventListener('change', (e) => {
            DocumentosState.filtrosGlobales.estado = e.target.value;
            filtrarDocumentosGlobales();
        });
    }

    // ── Carga inicial ──
    await cargarEventosParaDocs();
    await cargarDocumentosGlobales();

    // ── Deep-link eventoId ──
    const eventoId = new URLSearchParams(window.location.search).get('eventoId');
    if (eventoId) {
        const evento = DocumentosState.eventosDisponibles.find(e => String(e.id) === eventoId);
        if (evento) {
            DocumentosState.eventoSeleccionadoId = eventoId;
            DocumentosRender.renderColaEventos();
            await cargarDocumentosEvento();
        }
    }
});

// =========================================================================
//   EXPORTS GLOBALES (handlers inline HTML)
// =========================================================================

window.limpiarBusquedaGlobal = limpiarBusquedaGlobal;
window.limpiarFiltroEstadoGlobal = limpiarFiltroEstadoGlobal;
window.limpiarTodosFiltrosGlobales = limpiarTodosFiltrosGlobales;
window.cargarDocumentosEvento = cargarDocumentosEvento;
window.setFiltroEventosDoc = setFiltroEventosDoc;
window.seleccionarEventoDoc = seleccionarEventoDoc;