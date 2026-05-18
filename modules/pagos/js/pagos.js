/**
 * modules/pagos/pagos.js
 * Gestión financiera y pagos de eventos.
 *
 * Estado centralizado en PagosState (js/pagos.state.js).
 * Reglas de negocio en PagosPermisos (js/pagos.permissions.js).
 */

function getEventoSeleccionado() {
    return PagosState.eventosDisponibles.find(e => String(e.id) === String(PagosState.eventoSeleccionadoId)) || null;
}

function getResumenEvento(eventoId) {
    return PagosState.resumenesEventos[String(eventoId)] || null;
}

function normalizarTextoBusqueda(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function obtenerSaldoEvento(evento) {
    const resumen = getResumenEvento(evento.id);
    if (resumen && typeof resumen.saldoPendiente !== 'undefined') {
        return Number(resumen.saldoPendiente || 0);
    }
    return Number(evento.precioTotal || 0);
}

function obtenerCobradoEvento(evento) {
    return Number(getResumenEvento(evento.id)?.totalCobrado || 0);
}

function obtenerDevolucionEvento(evento) {
    return Number(getResumenEvento(evento.id)?.totalDevolucionPendiente || 0);
}

function eventoTieneDevolucionPendiente(evento) {
    return !!getResumenEvento(evento.id)?.tieneDevolucionPendiente;
}

function toComparableDate(value, isEndOfDay = false) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return new Date(`${raw}T${isEndOfDay ? '23:59:59' : '00:00:00'}`);
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cambiarTab(tab) {
    PagosState.tabActual = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.getElementById('view-todos').classList.toggle('hidden', tab !== 'todos');
    document.getElementById('view-evento').classList.toggle('hidden', tab !== 'evento');
    document.getElementById('view-metodos').classList.toggle('hidden', tab !== 'metodos');

    if (tab === 'todos' && PagosState.pagosGlobalesPagina.length === 0) {
        cargarPagosGlobales();
    }

    if (tab === 'metodos') {
        renderizarTablaMetodos();
    }
}

async function recargarVistaActiva() {
    const seleccionActual = PagosState.eventoSeleccionadoId || '';

    await Promise.all([
        cargarEventosParaPagos(seleccionActual),
        cargarCatalogosPago()
    ]);

    if (PagosState.tabActual === 'todos') {
        await cargarPagosGlobales(PagosState.paginaActual);
        return;
    }

    if (PagosState.tabActual === 'evento') {
        await cargarPagosEvento();
        return;
    }

    renderizarTablaMetodos();
}

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        cargarEventosParaPagos(),
        cargarCatalogosPago(),
        cargarPagosGlobales()
    ]);

    const inputBuscarEvento = document.getElementById('input-buscar-evento-pago');
    if (inputBuscarEvento) {
        inputBuscarEvento.addEventListener('input', (event) => {
            PagosState.busquedaEventosPago = event.target.value || '';
            renderizarListaEventosPago();
        });
    }

    const inputBuscarPagoGlobal = document.getElementById('input-buscar-pago-global');
    if (inputBuscarPagoGlobal) {
        inputBuscarPagoGlobal.addEventListener('input', (event) => {
            PagosState.busquedaPagosGlobales = event.target.value || '';
            renderPagosGlobalesFiltrados();
        });
    }

    const eventoId = new URLSearchParams(window.location.search).get('eventoId');
    if (eventoId) {
        cambiarTab('evento');
        PagosState.eventoSeleccionadoId = eventoId;
        await cargarPagosEvento();
    }
});

