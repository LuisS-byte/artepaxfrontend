/**
 * modules/pagos/js/pagos.evento.js
 * Detalle financiero del evento: carga de pagos, resumen, anticipo, progreso y encabezado.
 * 
 * Dependencias (resueltas en runtime):
 *   PagosState                       (js/pagos.state.js)
 *   estadoPermiteRegistrarPagos()    (js/pagos.permissions.js)
 *   getBadgeEstadoEvento()           (js/pagos.permissions.js)
 *   PagosColumns                     (js/pagos.columns.js)
 *   renderizarListaEventosPago()     (js/pagos.cobranza.js)
 *   formatters.*                     (js/shared/formatters.js)
 *   modulos.*                        (js/shared/modulos.js)
 *   API.pagos.*                      (js/shared/api.js)
 *   mostrarAlerta()                  (js/shared/alerts.js)
 *   getEventoSeleccionado()          (js/pagos.js)
 *   getResumenEvento()               (js/pagos.js)
 */

// ── Helpers de tabla ───────────────────────────────────────

function getEstadoEventoPago(row) {
    return row.estadoEventoNombre || getEventoSeleccionado()?.estadoEventoNombre || '';
}

/**
 * Renderiza los botones de acción (Confirmar / Anular) para una fila de pago.
 * Usado por PagosColumns.PAGOS y PagosColumns.PAGOS_GLOBAL (resuelto en runtime).
 */
function renderAccionesPago(row, actionMode = 'evento') {
    const estadoPago = row.estadoPagoNombre || row.estadoPago;
    const estadoEvento = getEstadoEventoPago(row);
    const puedeConfirmar = estadoPago === 'PENDIENTE' && estadoPermiteConfirmarPagos(estadoEvento);

    if (estadoPago !== 'PENDIENTE') {
        return '<span class="text-muted text-sm">Sin acciones</span>';
    }

    const confirmHandler = `confirmarPago(${row.id})`;
    const anularHandler = `anularPago(${row.id})`;
    const confirmDisabled = puedeConfirmar ? '' : 'disabled';
    const confirmTitle = puedeConfirmar
        ? ''
        : `title="No se puede confirmar mientras el evento esté en ${formatters.textoSeguro(estadoEvento || 'un estado no permitido')}."`;

    return `
        <button class="btn btn-outline btn-sm btn-success-hover" onclick="${confirmHandler}" ${confirmDisabled} ${confirmTitle}>Confirmar</button>
        <button class="btn btn-outline btn-sm btn-danger-hover" onclick="${anularHandler}">Anular</button>
    `;
}

function renderEmptyRow(tbodyId, colspan, message) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-state-table">${message}</td></tr>`;
}

// ── Disponibilidad de registro ─────────────────────────────

function actualizarDisponibilidadRegistroPago() {
    const btnRegistrar = document.getElementById('btn-registrar-pago');
    const hint = document.getElementById('pago-evento-hint');
    if (!btnRegistrar || !hint) return;

    const evento = getEventoSeleccionado();
    const estado = evento?.estadoEventoNombre || '';
    const permitido = estadoPermiteRegistrarPagos(estado);

    btnRegistrar.disabled = !permitido;
    btnRegistrar.title = permitido
        ? ''
        : estado
            ? `No se pueden registrar pagos mientras el evento esté en ${estado}.`
            : 'Selecciona un evento para continuar.';

    if (!evento) {
        hint.className = 'pag-hint hidden';
        hint.innerHTML = '';
        return;
    }

    if (estado === 'FINALIZADO') {
        hint.className = 'pag-hint pag-hint--warning';
        hint.innerHTML = 'Evento finalizado: podés consultar historial y devoluciones, pero ya no admite nuevos pagos.';
        return;
    }

    if (estado === 'COTIZACION') {
        hint.className = 'pag-hint pag-hint--warning';
        hint.innerHTML = 'Cotización: cuando el evento pase a <strong>PROGRAMADO</strong> vas a poder registrar pagos.';
        return;
    }

    if (estado === 'PROGRAMADO') {
        hint.className = 'pag-hint pag-hint--info';
        hint.innerHTML = 'Evento programado: si el anticipo alcanza lo necesario, el evento puede pasar automáticamente a <strong>CONFIRMADO</strong>.';
        return;
    }

    if (estado === 'PENDIENTE_COBRO') {
        hint.className = 'pag-hint pag-hint--warning';
        hint.innerHTML = 'El evento ya ocurrió, pero la cobranza sigue activa hasta completar el saldo pendiente.';
        return;
    }

    if (!permitido) {
        hint.className = 'pag-hint pag-hint--warning';
        hint.innerHTML = `Evento en estado <strong>${formatters.textoSeguro(estado)}</strong>: solo lectura para pagos.`;
        return;
    }

    hint.className = 'pag-hint pag-hint--success';
    hint.innerHTML = `Evento en estado <strong>${formatters.textoSeguro(estado)}</strong>: pagos habilitados.`;
}

// ── Carga de pagos del evento ──────────────────────────────

async function cargarPagosEvento() {

    const container = document.getElementById('pagos-container');
    const emptyState = document.getElementById('pagos-empty');

    if (!PagosState.eventoSeleccionadoId) {
        container?.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        actualizarAnticipo(null);
        actualizarDisponibilidadRegistroPago();
        return;
    }

    container?.classList.remove('hidden');
    emptyState?.classList.add('hidden');
    renderizarListaEventosPago();
    modulos.setTableLoading('tabla-pagos', 6, 'Cargando pagos...');

    try {
        PagosState.pagosActuales = await API.pagos.porEvento(PagosState.eventoSeleccionadoId);
        actualizarEncabezadoEvento();

        if (!PagosState.pagosActuales.length) {
            renderEmptyRow('tabla-pagos', 6, 'Este evento todavía no tiene pagos registrados.');
        } else {
            modulos.renderTabla(PagosState.pagosActuales, 'tabla-pagos', PagosColumns.PAGOS);
        }

        actualizarDisponibilidadRegistroPago();

        try {
            const resumen = await API.pagos.resumen(PagosState.eventoSeleccionadoId);
            PagosState.resumenesEventos[String(PagosState.eventoSeleccionadoId)] = resumen;
            renderizarListaEventosPago();
            actualizarEncabezadoEvento();
            actualizarResumen(resumen);
        } catch (_) {
            actualizarResumen({
                precioTotal: 0,
                totalCobrado: 0,
                saldoPendiente: 0,
                cobroCompleto: false,
                totalDevolucionPendiente: 0,
                tieneDevolucionPendiente: false,
                anticipo: null
            });
        }
    } catch (err) {
        modulos.setTableError('tabla-pagos', 6, 'Error al cargar pagos.');
        mostrarAlerta('error', 'Error al cargar pagos: ' + err.message);
    }
}

// ── Resumen financiero ─────────────────────────────────────

function actualizarResumen(resumen) {
    const total = resumen.precioTotal || 0;
    const abonado = resumen.totalCobrado || 0;
    const pendiente = resumen.saldoPendiente || 0;
    const devolucionPendiente = resumen.totalDevolucionPendiente || 0;
    const tieneDevolucionPendiente = !!resumen.tieneDevolucionPendiente;

    document.getElementById('total-evento').textContent = `$${formatters.precio(total)}`;
    document.getElementById('total-abonado').textContent = `$${formatters.precio(abonado)}`;
    document.getElementById('saldo-pendiente').textContent = `$${formatters.precio(pendiente)}`;
    document.getElementById('devolucion-pendiente').textContent = `$${formatters.precio(devolucionPendiente)}`;

    const cardSaldo = document.getElementById('saldo-pendiente').parentElement;
    cardSaldo.className = pendiente <= 0 ? 'pag-finance-card--success' : 'pag-finance-card--warning';

    const cardDevolucion = document.getElementById('card-devolucion-pendiente');
    if (cardDevolucion) {
        cardDevolucion.className = tieneDevolucionPendiente ? 'pag-finance-card--info' : 'pag-finance-card hidden';
    }

    actualizarProgresoCobro(total, abonado, pendiente);

    actualizarAnticipo(resumen.anticipo, resumen);

    const alerta = document.getElementById('pago-resumen-alerta');
    if (!alerta) return;

    if (tieneDevolucionPendiente) {
        alerta.className = 'pag-banner pag-banner--danger';
        alerta.innerHTML = `Hay <strong>$${formatters.precio(devolucionPendiente)}</strong> en devolución pendiente. Esto suele venir de una cancelación definitiva del evento.`;
        return;
    }

    if (pendiente > 0) {
        alerta.className = 'pag-banner pag-banner--warning';
        alerta.innerHTML = `Todavía faltan <strong>$${formatters.precio(pendiente)}</strong> para completar el cobro del evento.`;
        return;
    }

    alerta.className = 'pag-banner pag-banner--success';
    alerta.innerHTML = 'El evento está completamente cubierto en pagos confirmados.';
}

// ── Progreso de cobro ──────────────────────────────────────

function actualizarProgresoCobro(total, abonado, pendiente) {
    const porcentajeEl = document.getElementById('cobro-porcentaje');
    const fillEl = document.getElementById('cobro-bar-fill');
    const leftEl = document.getElementById('cobro-bar-left');
    const rightEl = document.getElementById('cobro-bar-right');
    if (!porcentajeEl || !fillEl || !leftEl || !rightEl) return;

    const pct = total > 0 ? Math.min(100, Math.round((Number(abonado || 0) / Number(total || 0)) * 100)) : 0;
    porcentajeEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct}%`;
    leftEl.textContent = `$${formatters.precio(abonado || 0)} cobrados`;
    rightEl.textContent = `$${formatters.precio(pendiente || 0)} pendientes`;
}

// ── Anticipo ───────────────────────────────────────────────

function actualizarAnticipo(anticipo, resumen = {}) {
    const card = document.getElementById('card-anticipo');
    const badge = document.getElementById('anticipo-badge');
    const requerido = document.getElementById('anticipo-requerido');
    const confirmado = document.getElementById('anticipo-confirmado');
    const porConceptoWrap = document.getElementById('anticipo-por-concepto-wrap');
    const porConcepto = document.getElementById('anticipo-por-concepto');
    const faltante = document.getElementById('anticipo-faltante');
    const alerta = document.getElementById('anticipo-alerta');

    if (!card || !badge || !requerido || !confirmado || !faltante || !alerta) return;

    if (!anticipo) {
        card.classList.add('hidden');
        return;
    }

    card.classList.remove('hidden');

    const porcentaje = Number(anticipo.porcentajeAnticipoMinimo || 0);
    const montoMinimo = Number(anticipo.montoMinimoAnticipo || 0);
    const montoConfirmado = Number(anticipo.anticipoConfirmado || 0);
    const montoPorConcepto = Number(anticipo.anticipoPorConcepto || 0);
    const montoFaltante = Number(anticipo.faltanteParaAnticipo || 0);
    const cumplido = !!anticipo.anticipoCumplido;
    const puedeConfirmarse = !!anticipo.puedeConfirmarsePorAnticipo;

    requerido.textContent = `${formatters.precio(porcentaje)}% · $${formatters.precio(montoMinimo)}`;
    confirmado.textContent = `$${formatters.precio(montoConfirmado)}`;
    faltante.textContent = `$${formatters.precio(montoFaltante)}`;

    if (porConceptoWrap && porConcepto) {
        porConceptoWrap.classList.toggle('hidden', montoPorConcepto <= 0);
        porConcepto.textContent = `$${formatters.precio(montoPorConcepto)}`;
    }

    badge.innerHTML = cumplido
        ? '<span class="badge badge-confirmado">Anticipo cumplido</span>'
        : '<span class="badge badge-warning">Anticipo pendiente</span>';

    if (cumplido) {
        alerta.className = puedeConfirmarse ? 'pag-banner pag-banner--success' : 'pag-banner pag-banner--info';
        alerta.innerHTML = puedeConfirmarse
            ? 'Anticipo minimo cumplido. El evento ya puede quedar confirmado segun reglas de backend.'
            : 'Anticipo minimo cumplido. Se muestra como referencia historica para este evento.';
        return;
    }

    const estadoEvento = getEventoSeleccionado()?.estadoEventoNombre || '';
    alerta.className = 'pag-banner pag-banner--warning';
    alerta.innerHTML = `Anticipo requerido: <strong>${formatters.precio(porcentaje)}%</strong> ($${formatters.precio(montoMinimo)}). Confirmado: <strong>$${formatters.precio(montoConfirmado)}</strong>. Faltan <strong>$${formatters.precio(montoFaltante)}</strong>${estadoEvento === 'PROGRAMADO' ? ' para que el evento pueda confirmarse.' : '.'}`;
}

// ── Encabezado del evento ──────────────────────────────────

function actualizarEncabezadoEvento() {
    const evento = getEventoSeleccionado();
    const title = document.getElementById('evento-pago-titulo');
    const subtitle = document.getElementById('evento-pago-subtitulo');
    const badge = document.getElementById('evento-pago-badge');
    const meta = document.getElementById('evento-pago-meta');

    if (!evento || !title || !subtitle || !badge || !meta) return;

    const resumen = getResumenEvento(evento.id);
    const saldo = resumen?.saldoPendiente ?? evento.precioTotal ?? 0;
    const total = resumen?.precioTotal ?? evento.precioTotal ?? 0;
    const pagosPendientes = Number(evento.cantidadPagosPendientes || 0);
    const devolucion = Number(resumen?.totalDevolucionPendiente || 0);

    title.textContent = `${evento.clienteNombre || 'Evento'} · #${evento.id}`;
    subtitle.textContent = saldo > 0
        ? `Total $${formatters.precio(total)} · Restan $${formatters.precio(saldo)} por cobrar.`
        : `Total $${formatters.precio(total)} · Sin saldo pendiente por cobrar.`;
    badge.innerHTML = `<span class="badge ${getBadgeEstadoEvento(evento.estadoEventoNombre)}">${formatters.textoSeguro(evento.estadoEventoNombre || '—')}</span>`;

    const pills = [];
    pills.push(`<span class="pag-pill--${saldo > 0 ? 'warning' : 'success'}">${saldo > 0 ? 'Saldo pendiente' : 'Cobranza al dia'}</span>`);
    if (pagosPendientes > 0) {
        pills.push(`<span class="pag-pill--info">${pagosPendientes} pago(s) por confirmar</span>`);
    }
    if (devolucion > 0) {
        pills.push(`<span class="pag-pill--warning">Devolucion pendiente $${formatters.precio(devolucion)}</span>`);
    }
    meta.innerHTML = pills.join('');
}
