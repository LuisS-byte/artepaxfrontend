/**
 * modules/eventos/eventos.js
 * Lógica de lista y transiciones de estado de eventos.
 */

const { EVENTO_ESTADOS } = window.EventosConstants;
const eventosStore = window.EventosState;
const state = eventosStore.getState();
const eventosTable = window.EventosTable;
const eventosFilters = window.EventosFilters;
const eventosForm = window.EventosForm;
const eventosConfirmations = window.EventosConfirmations;
const eventosActions = window.EventosActions;
const eventosExtras = window.EventosExtras;
const eventosDetail = window.EventosDetail;
const eventosRentabilidad = window.EventosRentabilidad;
const eventosCalendar = window.EventosCalendar;

function toggleKebab(event, button) {
    eventosTable.toggleKebab(event, button);
}

function closeAllKebabs() {
    eventosTable.closeAllKebabs();
}

// ── KPI CARDS ──────────────────────────────────────────
function aplicarFiltroFecha() {
    eventosFilters.aplicarFiltroFecha(filtrarEventos);
}

function limpiarFiltroFechas() {
    eventosFilters.limpiarFiltroFechas(filtrarEventos);
}

function limpiarFiltroEstado() {
    eventosFilters.limpiarFiltroEstado(filtrarEventos);
}

function limpiarKpiFiltro(refiltrar = true) {
    eventosFilters.limpiarKpiFiltro(filtrarEventos, refiltrar);
}

function limpiarTodosFiltros() {
    eventosFilters.limpiarTodosFiltros(filtrarEventos);
}

function limpiarBusqueda() {
    eventosFilters.limpiarBusqueda(filtrarEventos);
}

function confirmarDescarte() {
    modulos.cerrarModal('modal-descartar-cambios');
    if (state.resolveDescarte) { state.resolveDescarte(true); state.resolveDescarte = null; }
}

function cancelarDescarte() {
    modulos.cerrarModal('modal-descartar-cambios');
    if (state.resolveDescarte) { state.resolveDescarte(false); state.resolveDescarte = null; }
}

//  CARGA Y RENDER DE EVENTOS

/** Refresca la vista activa: lista + calendario si está visible */
function refrescarVista() {
    cargarEventos();
    const calSection = document.getElementById('vista-calendario');
    if (calSection && !calSection.classList.contains('hidden')) {
        eventosCalendar.cargarCalendario();
    }
}

// ── PAGINACIÓN ──────────────────────────────────────────

state.paginaActual = 0;
state.totalPaginas = 0;
state.totalElementos = 0;

async function cargarEventos(page) {
    const tbody = document.getElementById('tabla-eventos');
    eventosTable.renderEventosTableLoading();

    try {
        const pageArg = page !== undefined ? page : state.paginaActual;
        const response = await API.eventos.list({ page: pageArg, size: 50, sort: 'fecha,desc' });

        state.todosLosEventos = response.content || [];
        state.paginaActual = response.number || 0;
        state.totalPaginas = response.totalPages || 0;
        state.totalElementos = response.totalElements || 0;

        // KPIs desde página actual, Total con el real del servidor
        eventosFilters.actualizarKPIs(state.todosLosEventos);
        document.getElementById('kpi-total').textContent = state.totalElementos;
        eventosFilters.actualizarContadoresFiltro(state.todosLosEventos);
        filtrarEventos();
        renderPaginacionEventos();
    } catch (err) {
        mostrarAlerta('error', 'Error al cargar eventos: ' + err.message);
        tbody.innerHTML = `<tr><td colspan="7" class="error-state">Error de conexión.</td></tr>`;
    }
}

function filtrarEventos() {
    // Si todavía no se cargaron los datos, ignorar
    if (state.todosLosEventos === null) return;

    const filtro = document.getElementById('filter-estado').value;
    const query = document.getElementById('search-input').value.trim().toLowerCase();

    document.getElementById('search-clear').classList.toggle('hidden', !query);

    eventosFilters.actualizarKPIs(state.todosLosEventos);
    document.getElementById('kpi-total').textContent = state.totalElementos;
    eventosFilters.actualizarContadoresFiltro(state.todosLosEventos);

    const datos = eventosFilters.aplicarFiltros(state.todosLosEventos, filtro, query);

    state.eventos = datos;

    eventosFilters.actualizarChipsFiltros();
    eventosFilters.actualizarResultsCount(datos);

    if (datos.length === 0) {
        eventosTable.renderEventosTableEmpty();
        return;
    }

    eventosTable.renderEventosTable(datos);
}

function renderPaginacionEventos() {
    modulos.renderPaginacion({
        containerId: 'paginacion-eventos',
        page: state.paginaActual,
        totalPages: state.totalPaginas,
        totalElements: state.totalElementos,
        onPageChange: (nextPage) => cargarEventos(nextPage)
    });
}

async function cargarOpcionesFormularioEvento() {
    const [clientes, tiposEvento] = await Promise.all([
        modulos.cache.get('clientes', () => API.clientes.list()),
        modulos.cache.get('tiposEvento', () => API.tiposEvento.list())
    ]);

    state.clientesDisponibles = clientes.filter(cliente => cliente.activo !== false);
    state.tiposEventoDisponibles = tiposEvento.filter(tipo => tipo.tipoActivo !== false);

    modulos.limpiarSelect(
        'select-cliente',
        state.clientesDisponibles.map(cliente => ({ value: cliente.id, label: cliente.nombre })),
        'Selecciona un cliente...'
    );
    modulos.limpiarSelect(
        'select-tipo-evento',
        state.tiposEventoDisponibles.map(tipo => ({ value: tipo.id, label: tipo.tipoNombre })),
        'Selecciona un tipo...'
    );
}

// Carga decoraciones compatibles con un tipo de evento
async function cargarDecoracionesCompatibles(tipoEventoId) {
    if (!tipoEventoId) {
        state.decoracionesDisponibles = [];
        modulos.limpiarSelect('select-decoracion', [], 'Primero selecciona un tipo de evento...');
        return;
    }

    try {
        const decoraciones = await API.decoraciones.compatibles(tipoEventoId);
        state.decoracionesDisponibles = decoraciones.filter(dec => dec.estado !== 'INACTIVO');
        modulos.limpiarSelect(
            'select-decoracion',
            state.decoracionesDisponibles.map(dec => ({ value: dec.id, label: dec.nombre })),
            'Selecciona una decoracion...'
        );
    } catch (_) {
        state.decoracionesDisponibles = [];
        modulos.limpiarSelect('select-decoracion', [], 'Error al cargar decoraciones...');
    }

    // Limpiar autocomplete si existe
    var decoInput = document.getElementById('autocomplete-decoracion-input');
    if (decoInput) {
        decoInput.value = '';
        decoInput.placeholder = (state.decoracionesDisponibles && state.decoracionesDisponibles.length > 0)
            ? 'Busca por nombre de decoracion...'
            : 'Sin decoraciones disponibles para este tipo';
    }
    var preview = document.getElementById('decoracion-preview');
    if (preview) preview.classList.add('hidden');
}

//ACCIONES Y TRANSICIONES 

async function confirmarAccion(id, accion) {
    return eventosConfirmations.confirmarAccion(id, accion, {
        ejecutarAccion,
        validarStockEvento,
        mostrarModalStockInsuficiente
    });
}

async function ejecutarAccion(accion) {
    return eventosActions.ejecutarAccion(accion, { cerrarModalConfirmar, refrescarVista });
}

// CANCELACIÓN

function abrirModalCancelar(id) {
    return eventosConfirmations.abrirModalCancelar(id);
}

async function confirmarSolicitudCancelar() {
    return eventosActions.confirmarSolicitudCancelar({ cerrarModalCancelar, refrescarVista });
}

//  DRAWER CREAR / EDITAR

async function abrirDrawerCrear() {
    return eventosForm.abrirDrawerCrear({ cargarOpcionesFormularioEvento });
}

async function editarEvento(id) {
    return eventosForm.editarEvento(id, { cargarOpcionesFormularioEvento });
}

async function guardarEvento(e) {
    return eventosForm.guardarEvento(e, { refrescarVista, cerrarDrawerEvento });
}

async function cerrarDrawerEvento(e) {
    return eventosForm.cerrarDrawerEvento(e);
}

//detalle

async function verDetalle(id) {
    return eventosDetail.verDetalle(id);
}

function buildDetalleHero(args) { return eventosDetail.buildDetalleHero(args); }
function getDetalleEstadoInfo(estado, saldoPendiente = 0, tieneDevolucionPendiente = false) { return eventosDetail.getDetalleEstadoInfo(estado, saldoPendiente, tieneDevolucionPendiente); }

// ── VALIDACIÓN DE STOCK ANTES DE PROGRAMAR ─────────────
async function validarStockEvento(eventoId) {
    try {
        const evento = await API.eventos.get(eventoId);
        if (!evento.decoracionId) {
            return { suficiente: true, items: [], mensaje: 'El evento no tiene decoración asignada.' };
        }

        const decoracion = await API.decoraciones.get(evento.decoracionId);
        const productos = decoracion.productos || [];

        if (productos.length === 0) {
            return { suficiente: true, items: [], mensaje: 'La decoración no requiere productos.' };
        }

        const items = await Promise.all(productos.map(async (p) => {
            try {
                const stock = await API.inventario.stockProducto(p.productoId);
                const disponible = Number(stock.cantidadDisponible || 0);
                return {
                    nombre: p.productoNombre || 'Producto',
                    requerido: p.cantidadRequerida,
                    disponible,
                    suficiente: disponible >= p.cantidadRequerida
                };
            } catch (_) {
                return {
                    nombre: p.productoNombre || 'Producto',
                    requerido: p.cantidadRequerida,
                    disponible: 0,
                    suficiente: false,
                    error: true
                };
            }
        }));

        return {
            suficiente: items.every(i => i.suficiente),
            items
        };
    } catch (err) {
        return { suficiente: null, items: [], mensaje: 'No se pudo verificar stock.', error: err.message };
    }
}

function mostrarModalStockInsuficiente(resultado) {
    const content = document.getElementById('stock-validacion-contenido');
    const itemsFaltan = resultado.items.filter(i => !i.suficiente);
    const itemsOk = resultado.items.filter(i => i.suficiente);

    let html = `
        <div class="stock-val-header">
            <div class="stock-val-icon">
                <i data-lucide="alert-triangle"></i>
            </div>
            <h3>Stock insuficiente para programar</h3>
            <p>Falta stock en <strong>${itemsFaltan.length}</strong> de <strong>${resultado.items.length}</strong> productos. Reponé antes de continuar.</p>
        </div>
        <table class="data-table data-table-sm stock-val-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th class="text-right">Requerido</th>
                    <th class="text-right">Disponible</th>
                    <th class="text-center">Estado</th>
                </tr>
            </thead>
            <tbody>
                ${resultado.items.map(item => `
                <tr class="${item.suficiente ? 'stock-val-ok' : 'stock-val-fail'}">
                    <td><strong>${formatters.textoSeguro(item.nombre)}</strong></td>
                    <td class="text-right">${item.requerido}</td>
                    <td class="text-right">${item.disponible}</td>
                    <td class="text-center">
                        ${item.suficiente
                            ? '<span class="badge badge-confirmado">✔ Suficiente</span>'
                            : '<span class="badge badge-cancelado">✖ Insuficiente</span>'
                        }
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>
        ${itemsOk.length > 0 ? `
        <p style="margin-top:0.75rem;font-size:0.8125rem;color:var(--success);">
            <i data-lucide="check-circle" style="width:14px;height:14px;"></i>
            ${itemsOk.length} producto(s) con stock suficiente.
        </p>` : ''}
    `;

    content.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    modulos.abrirModal('modal-stock-validacion');
}

function cerrarModalStockValidacion() {
    modulos.cerrarModal('modal-stock-validacion');
}

function irAInventario() {
    window.location.href = '../inventario/inventario.html';
}

function buildDetalleStatusNote(args) { return eventosDetail.buildDetalleStatusNote(args); }
function buildEmptyStateCard(icon, title, body, actionHtml = '') { return eventosDetail.buildEmptyStateCard(icon, title, body, actionHtml); }
function accordionSection(id, icon, title, open = false, content) { return eventosDetail.accordionSection(id, icon, title, open, content); }
function toggleAccordion(id, btn) { return eventosDetail.toggleAccordion(id, btn); }
function toggleAllAccordions() { return eventosDetail.toggleAllAccordions(); }
function generarFooterDetalle(evento) { return eventosDetail.generarFooterDetalle(evento); }
function gestionarPagos(id) { return eventosDetail.gestionarPagos(id); }
function gestionarGastos(id) { return eventosDetail.gestionarGastos(id); }

async function verRentabilidad(id) {
    return eventosRentabilidad.verRentabilidad(id);
}

function cerrarModalDetalleEvento() { return eventosDetail.cerrarModalDetalleEvento(); }
function cerrarModalRentabilidad() { return eventosRentabilidad.cerrarModalRentabilidad(); }

function cerrarModalCancelar() {
    return eventosConfirmations.cerrarModalCancelar();
}
function cerrarModalConfirmar() {
    return eventosConfirmations.cerrarModalConfirmar();
}

function abrirModalExtras(id) {
    return eventosExtras.abrirModalExtras(id);
}

async function cargarExtrasProductos() {
    return eventosExtras.cargarExtrasProductos();
}

function agregarItemExtra() {
    return eventosExtras.agregarItemExtra();
}

function eliminarItemExtra(index) {
    return eventosExtras.eliminarItemExtra(index);
}

function renderExtrasItems() {
    return eventosExtras.renderExtrasItems();
}

async function confirmarExtras() {
    return eventosExtras.confirmarExtras({ refrescarVista });
}

function cerrarModalExtras() {
    return eventosExtras.cerrarModalExtras();
}


document.addEventListener('DOMContentLoaded', () => {
    eventosTable.initEventosTable();
    eventosFilters.initEventosFilters(filtrarEventos);
    eventosForm.initEventosForm();
    document.getElementById('search-input').addEventListener('input', debounce(filtrarEventos, 300));
    document.getElementById('search-input').placeholder = 'Buscar en página actual...';
    cargarEventos().then(() => {
        const eventoId = new URLSearchParams(window.location.search).get('eventoId');
        if (eventoId) verDetalle(Number(eventoId));
    });
});


function cambiarVista(vista) {
    return eventosCalendar.cambiarVista(vista);
}
async function cargarCalendario() {
    return eventosCalendar.cargarCalendario();
}

function abrirDetalleDia(fechaStr, numDia) {
    return eventosCalendar.abrirDetalleDia(fechaStr, numDia);
}

function cerrarDetalleDia() {
    return eventosCalendar.cerrarDetalleDia();
}

function mesAnterior() {
    return eventosCalendar.mesAnterior();
}

function mesSiguiente() {
    return eventosCalendar.mesSiguiente();
}

function irAHoy() {
    return eventosCalendar.irAHoy();
}

