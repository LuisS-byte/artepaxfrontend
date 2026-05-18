/**
 * modules/pagos/js/pagos.drawer.js
 * Drawer de registro de pago, modales de anulación y mutaciones (confirmar/anular).
 * 
 * Unifica confirmarPago/confirmarPagoGlobal y anularPago/anularPagoGlobal.
 * 
 * Dependencias (resueltas en runtime):
 *   PagosState                       (js/pagos.state.js)
 *   estadoPermiteRegistrarPagos()    (js/pagos.permissions.js)
 *   formatters.*                     (js/shared/formatters.js)
 *   modulos.*                        (js/shared/modulos.js)
 *   API.pagos.*                      (js/shared/api.js)
 *   mostrarAlerta(), mostrarAlertaId(), ocultarAlertaId()  (js/shared/alerts.js)
 *   getEventoSeleccionado()          (js/pagos.js)
 *   getResumenEvento()               (js/pagos.js)
 *   recargarVistaActiva()            (js/pagos.js)
 */

// ── Drawer: Registrar Pago ─────────────────────────────────

function abrirDrawerPago() {
    const evento = getEventoSeleccionado();
    const estado = evento?.estadoEventoNombre || '';
    const contexto = document.getElementById('drawer-pago-contexto');

    if (!evento || !estadoPermiteRegistrarPagos(estado)) {
        mostrarAlerta('warning', `No se pueden registrar pagos en eventos con estado: ${estado || 'sin selección'}.`);
        return;
    }

    const resumen = getResumenEvento(evento.id);
    const saldo = resumen?.saldoPendiente ?? evento.precioTotal ?? 0;
    if (contexto) {
        contexto.textContent = `${evento.clienteNombre || 'Evento'} · #${evento.id} · Saldo actual $${formatters.precio(saldo)}.`;
        contexto.classList.remove('hidden');
    }

    modulos.limpiarForm(['input-monto']);
    document.getElementById('select-concepto-pago').value = '';
    document.getElementById('select-metodo-pago').value = '';
    ocultarAlertaId('drawer-alert');
    modulos.abrirModal('drawer-pago-overlay');
}

function cerrarDrawer(e) {
    if (e && e.target.id !== 'drawer-pago-overlay' && e.type === 'click') return;
    modulos.cerrarModal('drawer-pago-overlay');
}

async function guardarPago(e) {
    e.preventDefault();
    if (!PagosState.eventoSeleccionadoId) return;

    const evento = getEventoSeleccionado();
    const estado = evento?.estadoEventoNombre || '';

    if (!evento || !estadoPermiteRegistrarPagos(estado)) {
        mostrarAlertaId('drawer-alert', 'error', `No se pueden registrar pagos en eventos con estado: ${estado || 'desconocido'}.`);
        return;
    }

    const submitBtn = e.submitter || document.querySelector('#drawer-pago-overlay [type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const monto = parseFloat(document.getElementById('input-monto').value);
    const conceptoPagoId = parseInt(document.getElementById('select-concepto-pago').value, 10);
    const metodoPagoId = parseInt(document.getElementById('select-metodo-pago').value, 10);

    if (isNaN(monto) || monto < 0.01) {
        mostrarAlertaId('drawer-alert', 'error', 'El monto debe ser mayor o igual a $0.01.');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        await API.pagos.crear({
            eventoId: parseInt(PagosState.eventoSeleccionadoId, 10),
            monto,
            metodoPagoId,
            conceptoPagoId
        });

        mostrarAlerta('success', 'Pago registrado. Pendiente de confirmación.');
        cerrarDrawer();
        await recargarVistaActiva();
    } catch (err) {
        mostrarAlertaId('drawer-alert', 'error', 'Error: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ── Mutaciones: Confirmar y Anular (UNIFICADAS) ────────────

/**
 * Confirma un pago. Funciona tanto desde la tabla por evento
 * como desde la tabla global de movimientos.
 */
async function confirmarPago(id) {
    const btn = document.querySelector(`[onclick="confirmarPago(${id})"]`);
    if (btn) { btn.disabled = true; btn.textContent = 'Confirmando...'; }
    try {
        await API.pagos.confirmar(id);
        mostrarAlerta('success', 'Pago confirmado correctamente.');
        await recargarVistaActiva();
    } catch (err) {
        mostrarAlerta('error', 'Error al confirmar: ' + err.message);
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar'; }
    }
}

/**
 * Abre el modal de anulación. Busca el pago en la tabla por evento
 * o en la tabla global, según donde esté visible.
 */
function anularPago(id) {
    PagosState.pagoAnulandoId = id;
    const pago = PagosState.pagosActuales.find(p => p.id === id)
              || PagosState.pagosGlobalesPagina.find(p => p.id === id);
    const monto = pago ? `$${formatters.precio(pago.monto)}` : '';
    const concepto = pago ? pago.conceptoPago : '';
    document.getElementById('anular-monto').textContent = `${monto} (${concepto})`;
    modulos.abrirModal('modal-anular-pago');
}

// ── Modal: Confirmar Anulación ─────────────────────────────

function cerrarModalAnular() {
    PagosState.pagoAnulandoId = null;
    modulos.cerrarModal('modal-anular-pago');
}

async function confirmarAnulacion() {
    const btn = document.getElementById('btn-confirmar-anular');
    if (btn) { btn.disabled = true; btn.textContent = 'Anulando...'; }
    try {
        await API.pagos.anular(PagosState.pagoAnulandoId);
        PagosState.pagoAnulandoId = null;
        mostrarAlerta('success', 'Pago anulado correctamente.');
        cerrarModalAnular();
        await recargarVistaActiva();
    } catch (err) {
        mostrarAlerta('error', 'Error al anular: ' + err.message);
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar Anulación'; }
        cerrarModalAnular();
    }
}
