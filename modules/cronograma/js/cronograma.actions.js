/**
 * modules/cronograma/js/cronograma.actions.js
 * Mutaciones de API y efectos secundarios del módulo Cronograma.
 * NO renderiza, NO abre drawers, NO lee filtros del DOM.
 * Recibe callbacks de UI (mostrarAlerta, recargarVistaActiva, etc.) desde el orquestador.
 */

window.CronogramaActions = {
    async cambiarEstadoTarea(id, estado, { recargarVistaActiva, mostrarAlerta } = {}) {
        try {
            await API.cronogramas.cambiarEstado(id, estado);
            if (mostrarAlerta) mostrarAlerta('success', 'Estado actualizado correctamente.');
            if (recargarVistaActiva) await recargarVistaActiva();
        } catch (err) {
            if (mostrarAlerta) mostrarAlerta('error', 'No se pudo actualizar la actividad: ' + err.message);
        }
    },

    async confirmarAccionCronograma({ recargarVistaActiva, mostrarAlerta, mostrarAlertaId, cargarPersonalAsignado, cerrarModalConfirmacionCrono } = {}) {
        const cp = CronogramaState.get().confirmacionPendiente;
        if (!cp) return;

        try {
            if (cp.tipo === 'cancelar-cronograma') {
                await API.cronogramas.cancelar(cp.id);
                if (mostrarAlerta) mostrarAlerta('success', 'Actividad cancelada correctamente.');
                if (recargarVistaActiva) await recargarVistaActiva();
            }

            if (cp.tipo === 'quitar-personal') {
                const pa = CronogramaState.get().cronogramaPersonalActual;
                if (pa) {
                    await API.cronogramas.quitarUsuario(pa.id, cp.usuarioId);
                    if (mostrarAlertaId) mostrarAlertaId('drawer-personal-alert', 'success', 'Asignacion removida correctamente.');
                    if (cargarPersonalAsignado) await cargarPersonalAsignado();
                }
            }
        } catch (err) {
            if (mostrarAlerta) mostrarAlerta(cp.tipo === 'cancelar-cronograma' ? 'error' : 'warning', err.message || 'No se pudo completar la accion.');
        } finally {
            if (cerrarModalConfirmacionCrono) cerrarModalConfirmacionCrono();
        }
    }
};
