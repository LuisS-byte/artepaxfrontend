/**
 * modules/cronograma/js/cronograma.js
 * Orquestador del módulo Cronograma.
 * Gestion de cronogramas y asignacion de personal por evento.
 *
 * Dependencias:
 *   - cronograma.constants.js  → EVENTOS_EDITABLES, ESTADOS_FINALES, MAPA_ESTADOS_CRONO
 *   - cronograma.helpers.js    → safeArray, toComparableDate, getDateKey, etc.
 *   - cronograma.policy.js     → esEventoEditable, esVencida, getAccionesPermitidas, etc.
 *   - cronograma.api.js        → buildCreatePayload, buildUpdatePayload, buildAsignarUsuarioPayload
 *   - cronograma.state.js      → CronogramaState.get(), .set(), .resetActividadDrawer(), etc.
 */

function getEventoById(id) {
    return CronogramaState.get().eventosDisponibles.find(evento => String(evento.id) === String(id)) || null;
}

function abrirDetalleEvento(idEvento) {
    if (!idEvento) return;
    window.location.href = `../eventos/eventos.html?eventoId=${idEvento}`;
}

function findCronogramaEnMemoria(id) {
    const st = CronogramaState.get();
    return st.tareasActuales.find(item => item.id === id)
        || st.cronogramaGlobalBase.find(item => item.id === id)
        || st.cronogramaGlobal.find(item => item.id === id)
        || null;
}
function cambiarTab(tab) {
    CronogramaState.set({ tabActual: tab });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.getElementById('view-todos').classList.toggle('hidden', tab !== 'todos');
    document.getElementById('view-evento').classList.toggle('hidden', tab !== 'evento');

    if (tab === 'todos' && CronogramaState.get().cronogramaGlobalBase.length === 0) {
        cargarCronogramaGlobal();
    }
}

async function cargarEventosParaCronograma() {
    try {
        const response = await API.eventos.list();
        const eventos = Array.isArray(response) ? response : (Array.isArray(response?.content) ? response.content : []);
        CronogramaState.set({ eventosDisponibles: eventos });
        renderizarColaEventos();
    } catch (err) {
        mostrarAlerta('error', 'Error al cargar eventos: ' + err.message);
    }
}

function getEventosColaFiltrados() {
    const st = CronogramaState.get();
    const query = (document.getElementById('crono-queue-search')?.value || '').trim().toLowerCase();

    return st.eventosDisponibles.filter(evento => {
        if (st.cronoQueueFiltro === 'editables' && !EVENTOS_EDITABLES.includes(evento.estadoEventoNombre)) return false;
        if (st.cronoQueueFiltro === 'pendientes' && evento.estadoEventoNombre !== 'PENDIENTE_COBRO') return false;

        if (!query) return true;
        const bag = `${evento.clienteNombre || ''} ${evento.id}`.toLowerCase();
        return bag.includes(query);
    });
}

function renderizarColaEventos() {
    const st = CronogramaState.get();
    CronogramaRender.renderEventosQueue({
        eventos: getEventosColaFiltrados(),
        eventoSeleccionadoId: st.eventoSeleccionadoId
    });
}

function setCronoQueueFiltro(filtro) {
    CronogramaState.set({ cronoQueueFiltro: filtro });
    document.querySelectorAll('.crono-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filtro);
    });
    renderizarColaEventos();
}

function seleccionarEventoCronograma(id) {
    const evtId = String(id);
    const evtResumen = getEventoById(evtId);
    CronogramaState.set({ eventoSeleccionadoId: evtId, eventoSeleccionadoResumen: evtResumen });
    renderizarColaEventos();
    cargarCronogramaEvento();
}

async function cargarCronogramaGlobal(page = 0) {
    CronogramaState.set({ paginaActual: page });
    const st = CronogramaState.get();
    modulos.setTableLoading('tabla-cronograma-global', 9, 'Cargando actividades...');

    const estado = document.getElementById('filter-estado-global').value;
    const fechaDesde = toComparableDate(document.getElementById('filter-fecha-desde').value);
    const fechaHasta = toComparableDate(document.getElementById('filter-fecha-hasta').value, true);

    try {
        const response = await API.cronogramas.list({ page: st.paginaActual, size: 50, sort: 'fechaInicio,desc' });
        const base = response.content || [];
        CronogramaState.set({ cronogramaGlobalBase: base, totalPaginas: response.totalPages || 0 });

        const filtered = base.filter(item => {
            const fechaInicio = toComparableDate(item.fechaInicio);
            if (estado && item.cronoEstado !== estado) return false;
            if (fechaDesde && (!fechaInicio || fechaInicio < fechaDesde)) return false;
            if (fechaHasta && (!fechaInicio || fechaInicio > fechaHasta)) return false;
            return true;
        });
        CronogramaState.set({ cronogramaGlobal: filtered });

        modulos.renderTabla(filtered, 'tabla-cronograma-global', COLUMNAS_CRONOGRAMA_GLOBAL);
        renderPaginacionCrono();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        modulos.setTableError('tabla-cronograma-global', 9, 'Error al cargar actividades.');
        mostrarAlerta('error', 'Error al cargar actividades: ' + err.message);
    }
}

function renderPaginacionCrono() {
    const st = CronogramaState.get();
    CronogramaRender.renderPaginacion({
        page: st.paginaActual,
        totalPages: st.totalPaginas,
        onPageChange: next => cargarCronogramaGlobal(next)
    });
}

async function cargarCronogramaEvento() {
    const st = CronogramaState.get();
    if (!st.eventoSeleccionadoId) return;
    const resumen = getEventoById(st.eventoSeleccionadoId);
    CronogramaState.set({ eventoSeleccionadoResumen: resumen });

    const container = document.getElementById('cronograma-container');
    const emptyState = document.getElementById('cronograma-empty');

    if (!st.eventoSeleccionadoId || !resumen) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    modulos.setTableLoading('tabla-cronograma', 7, 'Cargando actividades del evento...');

    try {
        const tareas = await API.cronogramas.porEvento(st.eventoSeleccionadoId);
        CronogramaState.set({ tareasActuales: tareas });
        document.getElementById('filter-estado-crono').value = '';
        renderResumenEventoSeleccionado();
        filtrarCronograma();
    } catch (err) {
        modulos.setTableError('tabla-cronograma', 7, 'Error al cargar actividades del evento.');
        mostrarAlerta('error', 'Error al cargar actividades: ' + err.message);
    }
}

function renderResumenEventoSeleccionado() {
    const st = CronogramaState.get();
    const ev = st.eventoSeleccionadoResumen;
    if (!ev) {
        document.getElementById('cronograma-evento-resumen').innerHTML = '';
        return;
    }

    const tareas = st.tareasActuales;
    CronogramaRender.renderResumenEvento({
        evento: ev,
        total: tareas.length,
        pendientes: tareas.filter(item => item.cronoEstado === 'PENDIENTE').length,
        progreso: tareas.filter(item => item.cronoEstado === 'EN_PROGRESO').length,
        vencidas: tareas.filter(esVencida).length,
        editable: esEventoEditable(ev)
    });
}

function filtrarCronograma() {
    const st = CronogramaState.get();
    const filtro = document.getElementById('filter-estado-crono')?.value || '';

    let datos = st.tareasActuales.slice();
    if (filtro === 'VENCIDA') {
        datos = datos.filter(esVencida);
    } else if (filtro) {
        datos = datos.filter(item => item.cronoEstado === filtro);
    }

    modulos.renderTabla(datos, 'tabla-cronograma', COLUMNAS_CRONOGRAMA);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function resetDrawerActividad() {
    CronogramaDrawerActividad.resetDrawerActividad();
}

function renderContextoDrawerActividad(tarea = null) {
    CronogramaDrawerActividad.renderContextoDrawerActividad(tarea || undefined);
}

function abrirDrawerTarea() {
    CronogramaDrawerActividad.abrirDrawerTarea();
}

async function abrirDrawerEditar(id) {
    const row = findCronogramaEnMemoria(id);
    await CronogramaDrawerActividad.abrirDrawerEditar(id, row);
}

function cerrarDrawerTarea(e) {
    CronogramaDrawerActividad.cerrarDrawerTarea(e);
}

async function guardarTarea(e) {
    await CronogramaDrawerActividad.guardarTarea(e, {
        recargarVistaActiva,
        mostrarAlerta
    });
}

async function cambiarEstadoTarea(id, estado) {
    await CronogramaActions.cambiarEstadoTarea(id, estado, {
        recargarVistaActiva,
        mostrarAlerta
    });
}

function abrirModalCancelarTarea(id) {
    const row = findCronogramaEnMemoria(id);
    CronogramaConfirmation.abrirModalCancelarTarea(id, row?.actividad);
}

function abrirModalQuitarPersonal(usuarioId, usuarioNombre) {
    CronogramaConfirmation.abrirModalQuitarPersonal(usuarioId, usuarioNombre);
}

function cerrarModalConfirmacionCrono() {
    CronogramaConfirmation.cerrarModalConfirmacionCrono();
}

async function confirmarAccionCronograma() {
    await CronogramaActions.confirmarAccionCronograma({
        recargarVistaActiva,
        mostrarAlerta,
        mostrarAlertaId,
        cargarPersonalAsignado,
        cerrarModalConfirmacionCrono
    });
}

async function recargarVistaActiva() {
    const st = CronogramaState.get();
    if (st.tabActual === 'todos') {
        await cargarCronogramaGlobal(st.paginaActual);
        if (st.eventoSeleccionadoId) await cargarCronogramaEvento();
        return;
    }
    // En vista "Por evento" solo recargamos actividades del evento
    await cargarCronogramaEvento();
}

async function abrirDrawerPersonal(cronogramaId) {
    await CronogramaDrawerPersonal.abrirDrawerPersonal(cronogramaId);
}

function renderResumenPersonal() {
    CronogramaDrawerPersonal.renderResumenPersonal();
}

function cerrarDrawerPersonal(e) {
    CronogramaDrawerPersonal.cerrarDrawerPersonal(e);
}

async function cargarPersonalAsignado() {
    await CronogramaDrawerPersonal.cargarPersonalAsignado();
}

async function asignarPersonal(e) {
    await CronogramaDrawerPersonal.asignarPersonal(e);
}

// ── DETALLE DE ACTIVIDAD (SOLO LECTURA) ──────────────────────

function buildDetalleEstadoActividad(estado) {
    const estados = {
        PENDIENTE: { tone: 'info', icon: 'clock', title: 'Actividad pendiente', body: 'Todavía no se inició. Está lista para arrancar cuando el equipo esté disponible.' },
        EN_PROGRESO: { tone: 'info', icon: 'play-circle', title: 'Actividad en progreso', body: 'El equipo ya está trabajando en esta tarea.' },
        COMPLETADO: { tone: 'success', icon: 'check-circle', title: 'Actividad completada', body: 'La tarea fue finalizada. Podés consultar el personal asignado y los costos asociados.' },
        CANCELADO: { tone: 'danger', icon: 'circle-off', title: 'Actividad cancelada', body: 'Esta actividad no se llevó a cabo. Los datos quedan como referencia histórica.' }
    };
    return estados[estado] || { tone: 'info', icon: 'info', title: 'Estado de actividad', body: 'Consultá el detalle completo de la actividad.' };
}

async function abrirDetalleActividad(id) {
    const contenido = document.getElementById('detalle-actividad-contenido');
    contenido.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando detalle...</div>';
    modulos.abrirModal('modal-detalle-actividad');

    try {
        const [actividad, personal] = await Promise.all([
            API.cronogramas.get(id),
            API.cronogramas.listarUsuarios(id).catch(() => [])
        ]);

        const badgeEstado = MAPA_ESTADOS_CRONO[actividad.cronoEstado] || { clase: '', label: actividad.cronoEstado || 'Desconocido' };
        const estadoInfo = buildDetalleEstadoActividad(actividad.cronoEstado);
        const resumenPersonal = getPersonalSummary(personal);
        const horaStr = [modulos.formatearFecha(actividad.fechaInicio), modulos.formatearFecha(actividad.fechaFin)].filter(Boolean).join(' → ');

        const statusTone = {
            info: '#2563eb', success: '#16a34a', warning: '#ea580c', danger: '#dc2626'
        }[estadoInfo.tone] || '#2563eb';

        let html = `
            <section style="margin-bottom:var(--spacing-lg)">
                <div style="display:flex;flex-direction:column;gap:4px">
                    <span style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;color:var(--neutral-500)">Actividad #${actividad.id}</span>
                    <h3 style="font-size:1.25rem;font-weight:700;margin:0;color:var(--neutral-900)">${formatters.textoSeguro(actividad.actividad)}</h3>
                    <p style="font-size:0.9rem;color:var(--neutral-600);margin:0">${formatters.textoSeguro(actividad.clienteNombre || 'Sin cliente')}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">
                        <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--neutral-600)"><i data-lucide="calendar" style="width:14px;height:14px"></i>${horaStr}</span>
                        <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--neutral-600)"><i data-lucide="building" style="width:14px;height:14px"></i>${formatters.textoSeguro(actividad.estadoEventoNombre || '—')}</span>
                        <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--neutral-600)"><i data-lucide="users" style="width:14px;height:14px"></i>${personal.length} ${personal.length === 1 ? 'asignado' : 'asignados'}</span>
                    </div>
                </div>
                <div style="display:flex;gap:24px;margin-top:16px;padding-top:16px;border-top:1px solid var(--neutral-200)">
                    <div>
                        <span style="font-size:0.75rem;color:var(--neutral-500)">Estado</span>
                        <div style="margin-top:4px"><span class="badge ${badgeEstado.clase}" style="font-size:0.8rem">${badgeEstado.label}</span></div>
                    </div>
                </div>
            </section>

            <div style="display:flex;gap:12px;padding:14px 16px;border-radius:10px;background:${statusTone}0d;border:1px solid ${statusTone}20;margin-bottom:var(--spacing-lg)">
                <div style="flex-shrink:0;width:20px;height:20px;color:${statusTone};margin-top:1px"><i data-lucide="${estadoInfo.icon}" style="width:20px;height:20px"></i></div>
                <div style="flex:1;min-width:0">
                    <strong style="display:block;font-size:0.85rem;color:${statusTone}">${estadoInfo.title}</strong>
                    <p style="margin:4px 0 0;font-size:0.82rem;color:var(--neutral-600);line-height:1.4">${estadoInfo.body}</p>
                </div>
            </div>

            <div style="background:var(--neutral-50);border:1px solid var(--neutral-200);border-radius:10px;padding:var(--spacing-md)">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Inicio</label>
                        <span>${modulos.formatearFecha(actividad.fechaInicio)}</span>
                    </div>
                    <div class="info-item">
                        <label>Fin</label>
                        <span>${modulos.formatearFecha(actividad.fechaFin)}</span>
                    </div>
                    <div class="info-item full">
                        <label>Observación</label>
                        <span>${formatters.textoSeguro(actividad.cronoObservacion || 'Sin observaciones registradas.')}</span>
                    </div>
                </div>
            </div>`;

        // Personal asignado
        html += `
            <div class="modal-section" style="margin-top:var(--spacing-lg)">
                <button class="accordion-header" onclick="toggleAccordionDetalle('acc-personal', this)" type="button">
                    <div class="accordion-header-left">
                        <i data-lucide="users" class="accordion-header-icon"></i>
                        <span class="accordion-header-title">Personal asignado (${personal.length})</span>
                    </div>
                    <i data-lucide="${personal.length > 0 ? 'chevron-down' : 'chevron-right'}" class="accordion-header-chevron"></i>
                </button>
                <div id="acc-personal" class="accordion-body ${personal.length > 0 ? 'open' : ''}">
                    <div class="accordion-body-inner">
                        ${personal.length > 0 ? `
                            <p class="section-note" style="margin-bottom:var(--spacing-sm)">
                                Costo estimado: <strong>${formatCurrency(resumenPersonal.totalCosto)}</strong>
                            </p>
                            <div class="items-list">${personal.map(item => `
                                <div class="list-item">
                                    <div class="list-item-icon blue"><i data-lucide="user"></i></div>
                                    <div class="list-item-body">
                                        <div class="item-title">${formatters.textoSeguro(item.usuarioNombre || `Usuario #${item.usuarioId}`)}</div>
                                        <div class="item-meta">ID ${item.usuarioId}</div>
                                    </div>
                                    <div class="list-item-amount">
                                        <span>${formatCurrency(item.pagoAsignado)}</span>
                                        <small class="text-muted" style="display:block;text-align:right">${item.pagoTipo === 'POR_HORA' ? 'Por hora' : 'Fijo'}</small>
                                    </div>
                                </div>`).join('')}</div>
                        ` : `
                            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px 16px;text-align:center">
                                <i data-lucide="users" style="width:32px;height:32px;color:var(--neutral-400)"></i>
                                <strong style="font-size:0.9rem;color:var(--neutral-700)">Sin personal asignado</strong>
                                <p style="margin:0;font-size:0.82rem;color:var(--neutral-500)">No se asignaron usuarios a esta actividad.</p>
                            </div>`}
                    </div>
                </div>
            </div>`;

        contenido.innerHTML = html;
        document.getElementById('detalle-actividad-titulo').textContent = `Detalle: ${formatters.textoSeguro(actividad.actividad)}`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        contenido.innerHTML = `<div class="empty-state-card"><div class="empty-icon"><i data-lucide="alert-circle"></i></div><h3>Error al cargar detalle</h3><p>${formatters.textoSeguro(err.message)}</p></div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function toggleAccordionDetalle(id, btn) {
    const body = document.getElementById(id);
    const isOpen = body.classList.contains('open');
    if (!isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        body.classList.add('open');
    } else {
        body.style.maxHeight = '0px';
        body.classList.remove('open');
    }
    const chevron = btn.querySelector('.accordion-header-chevron');
    chevron.setAttribute('data-lucide', isOpen ? 'chevron-down' : 'chevron-up');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function cerrarDetalleActividad() {
    modulos.cerrarModal('modal-detalle-actividad');
}

/**
 * Mapa de acciones para delegación de eventos data-action.
 * Cada handler recibe (triggerElement, clickEvent).
 * Reemplaza onclick en templates y HTML. Fases 6A/6B.
 */
const CRONOGRAMA_ACTIONS = {
    // Render dinámico (Fase 6A) — desde templates JS
    detalle: el => abrirDetalleActividad(Number(el.dataset.id)),
    editar: el => abrirDrawerEditar(Number(el.dataset.id)),
    iniciar: el => cambiarEstadoTarea(Number(el.dataset.id), 'EN_PROGRESO'),
    completar: el => cambiarEstadoTarea(Number(el.dataset.id), 'COMPLETADO'),
    cancelar: el => abrirModalCancelarTarea(Number(el.dataset.id)),
    personal: el => abrirDrawerPersonal(Number(el.dataset.id)),
    detalleEvento: el => abrirDetalleEvento(Number(el.dataset.id)),
    seleccionarEvento: el => seleccionarEventoCronograma(el.dataset.id),
    quitarPersonal: el => abrirModalQuitarPersonal(Number(el.dataset.usuarioId), el.dataset.usuarioNombre || ''),

    // HTML estático (Fase 6B) — desde cronograma.html
    cambiarTab: el => cambiarTab(el.dataset.tab),
    abrirDrawerTarea: () => abrirDrawerTarea(),
    cerrarDrawerTarea: () => cerrarDrawerTarea(),
    guardarTarea: (el, event) => guardarTarea(event),
    cerrarDrawerPersonal: () => cerrarDrawerPersonal(),
    asignarPersonal: (el, event) => asignarPersonal(event),
    cerrarModalConfirmacionCrono: () => cerrarModalConfirmacionCrono(),
    confirmarAccionCronograma: () => confirmarAccionCronograma()
};

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    if (trigger.disabled) return;

    const action = trigger.dataset.action;
    const handler = CRONOGRAMA_ACTIONS[action];
    if (typeof handler === 'function') {
        event.preventDefault();
        handler(trigger, event);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    modulos.initFechas();

    // Inicializar autocomplete de usuarios en drawer personal
    if (typeof CronogramaDrawerPersonal.init === 'function') {
        CronogramaDrawerPersonal.init();
    }

    // Carga asincrónica determinística (reemplaza polling de ?eventoId)
    await cargarEventosParaCronograma();
    await cargarCronogramaGlobal();

    const searchInput = document.getElementById('crono-queue-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(renderizarColaEventos, 200));
    }

    document.getElementById('crono-queue-chips')?.addEventListener('click', (e) => {
        const chip = e.target.closest('.crono-chip');
        if (chip) setCronoQueueFiltro(chip.dataset.filter);
    });

    // Overlay clicks: close drawer only when clicking directly on the overlay
    document.getElementById('drawer-tarea-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'drawer-tarea-overlay') cerrarDrawerTarea(e);
    });
    document.getElementById('drawer-personal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'drawer-personal-overlay') cerrarDrawerPersonal(e);
    });

    // Enlace directo a evento: ?eventoId=N (sin polling, sin timeout)
    const eventoIdUrl = new URLSearchParams(window.location.search).get('eventoId');
    if (eventoIdUrl) {
        cambiarTab('evento');
        const evento = getEventoById(eventoIdUrl);
        if (evento) {
            await seleccionarEventoCronograma(Number(eventoIdUrl));
        } else {
            mostrarAlerta('warning', `No se encontró el evento #${eventoIdUrl} en la lista disponible.`);
        }
    }
});

// Conservadas para debug/consola: carga de datos y filtros
window.cargarCronogramaGlobal = cargarCronogramaGlobal;
window.cargarCronogramaEvento = cargarCronogramaEvento;
window.filtrarCronograma = filtrarCronograma;
