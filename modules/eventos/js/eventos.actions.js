(function () {
    const { EVENTO_ESTADOS } = window.EventosConstants;
    const state = window.EventosState.getState();

    async function ejecutarAccion(accion, deps) {
        const btn = document.getElementById('btn-confirmar-accion');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm"></span> Procesando...';

        try {
            await API.eventos[accion](state.eventoAccionId);
            mostrarAlerta('success', 'Accion realizada con exito.');
            deps.cerrarModalConfirmar();
            deps.refrescarVista();
            btn.disabled = false;
            btn.textContent = originalText;
        } catch (err) {
            // Mostrar error dentro del modal en vez de cerrarlo
            var mensaje = document.getElementById('confirmar-mensaje');
            var errorHtml = '<div style="color:var(--danger);font-weight:600;margin-bottom:0.6rem;display:flex;align-items:center;gap:0.4rem;"><i data-lucide="alert-circle" style="width:16px;height:16px;"></i> No se pudo completar la accion</div>';
            errorHtml += '<p>' + formatters.textoSeguro(err.message) + '</p>';

            // Si el error habla de anticipo, ofrecer ir a pagos
            if (err.message.indexOf('Anticipo') !== -1 || err.message.indexOf('anticipo') !== -1) {
                errorHtml += '<div style="margin-top:0.75rem;"><a class="btn btn-primary btn-sm" href="../pagos/pagos.html?eventoId=' + state.eventoAccionId + '"><i data-lucide="credit-card"></i> Ir a Pagos</a></div>';
            }

            mensaje.innerHTML = errorHtml;
            btn.textContent = 'Volver a intentar';
            btn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    async function confirmarSolicitudCancelar(deps) {
        const motivo = document.getElementById('motivo-cancelacion').value.trim();
        if (!motivo) return mostrarAlertaId('modal-cancelar', 'error', 'Debes ingresar un motivo.');

        const btn = document.getElementById('btn-solicitar-cancelar');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm"></span> Procesando...';

        try {
            await API.eventos.cancelar(state.eventoAccionId, motivo);
            const msg = state.eventoCancelandoEstado === EVENTO_ESTADOS.COTIZACION
                ? 'Evento cancelado correctamente.'
                : 'Solicitud de cancelación enviada. El evento está en período de gracia.';
            mostrarAlerta('success', msg);
            deps.cerrarModalCancelar();
            deps.refrescarVista();
        } catch (err) {
            mostrarAlerta('error', 'Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    window.EventosActions = Object.freeze({
        ejecutarAccion,
        confirmarSolicitudCancelar
    });
})();
