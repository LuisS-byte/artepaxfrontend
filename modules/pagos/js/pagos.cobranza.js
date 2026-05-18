/**
 * modules/pagos/js/pagos.cobranza.js
 * Cola de cobranza: carga, normalización, filtrado, renderizado y selección de eventos.
 * 
 * Dependencias (resueltas en runtime — el orden de <script defer> garantiza disponibilidad):
 *   PagosState                       (js/pagos.state.js)
 *   estadoPermiteRegistrarPagos()    (js/pagos.permissions.js)
 *   getBadgeEstadoEvento()           (js/pagos.permissions.js)
 *   formatters.*                     (js/shared/formatters.js)
 *   API.pagos.*                      (js/shared/api.js)
 *   mostrarAlerta()                  (js/shared/alerts.js)
 *   getEventoSeleccionado()          (js/pagos.js)
 *   getResumenEvento()               (js/pagos.js)
 *   normalizarTextoBusqueda()        (js/pagos.js)
 *   obtenerSaldoEvento()             (js/pagos.js)
 *   obtenerCobradoEvento()           (js/pagos.js)
 *   obtenerDevolucionEvento()        (js/pagos.js)
 *   eventoTieneDevolucionPendiente() (js/pagos.js)
 *   actualizarDisponibilidadRegistroPago() (js/pagos.js)
 *   cargarPagosEvento()              (js/pagos.js)
 */

// ── Normalización ────────────────────────────────────────────

function normalizarEventoCobranza(row) {
    return {
        id: row.eventoId,
        clienteNombre: row.clienteNombre,
        estadoEventoNombre: row.estadoEventoNombre,
        precioTotal: Number(row.precioTotal || 0),
        totalCobrado: Number(row.totalCobrado || 0),
        saldoPendiente: Number(row.saldoPendiente || 0),
        cobroCompleto: !!row.cobroCompleto,
        tieneDevolucionPendiente: !!row.tieneDevolucionPendiente,
        totalDevolucionPendiente: Number(row.totalDevolucionPendiente || 0),
        cantidadPagosPendientes: Number(row.cantidadPagosPendientes || 0)
    };
}

// ── Ordenamiento y filtrado ─────────────────────────────────

function getEventosPagoOrdenados() {
    return [...PagosState.eventosDisponibles].sort((a, b) => {
        const aDevolucion = eventoTieneDevolucionPendiente(a) ? 1 : 0;
        const bDevolucion = eventoTieneDevolucionPendiente(b) ? 1 : 0;
        if (aDevolucion !== bDevolucion) return bDevolucion - aDevolucion;

        const aSaldo = obtenerSaldoEvento(a);
        const bSaldo = obtenerSaldoEvento(b);
        if (aSaldo !== bSaldo) return bSaldo - aSaldo;

        return Number(b.id || 0) - Number(a.id || 0);
    });
}

function getEventosPagoFiltrados() {
    const query = normalizarTextoBusqueda(PagosState.busquedaEventosPago);

    return getEventosPagoOrdenados().filter(evento => {
        const saldo = obtenerSaldoEvento(evento);
        const tieneDevolucion = eventoTieneDevolucionPendiente(evento);
        const matchFiltro =
            PagosState.filtroEventosPago === 'todos'
            || (PagosState.filtroEventosPago === 'pendientes' && saldo > 0)
            || (PagosState.filtroEventosPago === 'devolucion' && tieneDevolucion)
            || (PagosState.filtroEventosPago === 'por-confirmar' && Number(evento.cantidadPagosPendientes || 0) > 0);

        if (!matchFiltro) return false;
        if (!query) return true;

        const bag = normalizarTextoBusqueda([
            evento.clienteNombre,
            evento.estadoEventoNombre,
            `evento ${evento.id}`,
            `#${evento.id}`
        ].join(' '));

        return bag.includes(query);
    });
}

// ── KPIs de la cola ─────────────────────────────────────────

function actualizarResumenColaEventos() {
    const pendientes = PagosState.eventosDisponibles.filter(evento => obtenerSaldoEvento(evento) > 0).length;
    const devoluciones = PagosState.eventosDisponibles.filter(evento => eventoTieneDevolucionPendiente(evento)).length;
    const alDia = PagosState.eventosDisponibles.filter(evento => obtenerSaldoEvento(evento) <= 0 && !eventoTieneDevolucionPendiente(evento)).length;
    const porConfirmar = PagosState.eventosDisponibles.filter(evento => Number(evento.cantidadPagosPendientes || 0) > 0).length;

    const pendientesEl = document.getElementById('cola-eventos-pendientes');
    const devolucionesEl = document.getElementById('cola-eventos-devolucion');
    const alDiaEl = document.getElementById('cola-eventos-al-dia');
    const porConfirmarEl = document.getElementById('cola-eventos-por-confirmar');

    if (pendientesEl) pendientesEl.textContent = pendientes;
    if (devolucionesEl) devolucionesEl.textContent = devoluciones;
    if (alDiaEl) alDiaEl.textContent = alDia;
    if (porConfirmarEl) porConfirmarEl.textContent = porConfirmar;
}

// ── Renderizado de la lista ─────────────────────────────────

function renderizarListaEventosPago() {
    const container = document.getElementById('lista-eventos-pago');
    if (!container) return;

    actualizarResumenColaEventos();

    if (PagosState.colaEventosCargando && !PagosState.eventosDisponibles.length) {
        container.innerHTML = '<div class="pag-queue-empty">Cargando eventos...</div>';
        return;
    }

    const eventos = getEventosPagoFiltrados();
    if (!eventos.length) {
        container.innerHTML = '<div class="pag-queue-empty">No hay eventos que coincidan con los filtros actuales.</div>';
        return;
    }

    container.innerHTML = eventos.map(evento => {
        const resumen = getResumenEvento(evento.id);
        const saldo = obtenerSaldoEvento(evento);
        const cobrado = obtenerCobradoEvento(evento);
        const devolucion = obtenerDevolucionEvento(evento);
        const pagosPendientes = Number(evento.cantidadPagosPendientes || 0);
        const active = String(evento.id) === String(PagosState.eventoSeleccionadoId) ? ' active' : '';
        const helper = eventoTieneDevolucionPendiente(evento)
            ? `Devolución pendiente: $${formatters.precio(devolucion)}`
            : pagosPendientes > 0
                ? `${pagosPendientes} pago(s) pendiente(s) por confirmar`
            : saldo > 0
                ? `Saldo pendiente: $${formatters.precio(saldo)}`
                : 'Evento al día';

        return `
            <button type="button" class="pag-queue-item${active}" onclick="seleccionarEventoPago(${evento.id})">
                <div class="pag-queue-item-top">
                    <div>
                        <strong>${formatters.textoSeguro(evento.clienteNombre || `Evento #${evento.id}`)}</strong>
                        <span class="pag-queue-id">Evento #${evento.id}</span>
                    </div>
                    <span class="badge ${getBadgeEstadoEvento(evento.estadoEventoNombre)}">${formatters.textoSeguro(evento.estadoEventoNombre || '—')}</span>
                </div>
                <div class="pag-queue-metrics">
                    <span>Total $${formatters.precio((resumen?.precioTotal ?? evento.precioTotal) || 0)}</span>
                    <span>Cobrado $${formatters.precio(cobrado)}</span>
                    <span>Pendientes ${pagosPendientes}</span>
                </div>
                <div class="pag-queue-footer">
                    <span class="pag-queue-helper ${saldo > 0 || devolucion > 0 || pagosPendientes > 0 ? 'warning' : 'success'}">${helper}</span>
                    <span class="pag-queue-cta">Ver detalle</span>
                </div>
            </button>`;
    }).join('');
}

// ── Filtros y selección ─────────────────────────────────────

function setFiltroEventosPago(filtro) {
    PagosState.filtroEventosPago = filtro;
    document.querySelectorAll('.pag-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filtro);
    });
    renderizarListaEventosPago();
}

function seleccionarEventoPago(id) {
    PagosState.eventoSeleccionadoId = String(id);
    renderizarListaEventosPago();
    cargarPagosEvento();
}

// ── Carga de datos ──────────────────────────────────────────

async function cargarEventosParaPagos(seleccionPreferida = null) {
    try {
        PagosState.colaEventosCargando = true;
        renderizarListaEventosPago();
        const eventos = await API.pagos.eventosCobranza();
        PagosState.eventosDisponibles = (eventos || []).map(normalizarEventoCobranza);
        PagosState.resumenesEventos = Object.fromEntries(PagosState.eventosDisponibles.map(evento => [String(evento.id), {
            idEvento: evento.id,
            precioTotal: evento.precioTotal,
            totalCobrado: evento.totalCobrado,
            saldoPendiente: evento.saldoPendiente,
            cobroCompleto: evento.cobroCompleto,
            totalDevolucionPendiente: evento.totalDevolucionPendiente,
            tieneDevolucionPendiente: evento.tieneDevolucionPendiente
        }]));

        PagosState.colaEventosCargando = false;
        renderizarListaEventosPago();
        actualizarDisponibilidadRegistroPago();
    } catch (err) {
        PagosState.colaEventosCargando = false;
        mostrarAlerta('error', 'Error al cargar eventos: ' + err.message);
    }
}
