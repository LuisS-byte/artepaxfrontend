/**
 * modules/cronograma/js/cronograma.confirmation.js
 * Modales de confirmación del módulo Cronograma.
 * Prepara la acción pendiente, configura textos del modal y controla apertura/cierre.
 * NO llama API, NO refresca vistas.
 * actions.js ejecuta la acción confirmada.
 */

window.CronogramaConfirmation = {
    abrirModalCancelarTarea(id, actividadNombre) {
        CronogramaState.set({ confirmacionPendiente: { tipo: 'cancelar-cronograma', id } });
        document.getElementById('modal-confirmacion-titulo').textContent = 'Cancelar actividad';
        document.getElementById('modal-confirmacion-mensaje').innerHTML = `Vas a cancelar <strong>${formatters.textoSeguro(actividadNombre || `la actividad #${id}`)}</strong>.<br><br>Solo se permite cancelar actividades en <strong>PENDIENTE</strong> o <strong>EN_PROGRESO</strong>.`;
        document.getElementById('btn-confirmar-crono').textContent = 'Cancelar actividad';
        modulos.abrirModal('modal-confirmacion-crono');
    },

    abrirModalQuitarPersonal(usuarioId, usuarioNombre) {
        CronogramaState.set({ confirmacionPendiente: { tipo: 'quitar-personal', usuarioId } });
        document.getElementById('modal-confirmacion-titulo').textContent = 'Quitar personal';
        document.getElementById('modal-confirmacion-mensaje').innerHTML = `Vas a remover a <strong>${formatters.textoSeguro(usuarioNombre || `Usuario #${usuarioId}`)}</strong> de esta actividad.`;
        document.getElementById('btn-confirmar-crono').textContent = 'Quitar asignacion';
        modulos.abrirModal('modal-confirmacion-crono');
    },

    cerrarModalConfirmacionCrono() {
        CronogramaState.clearConfirmacion();
        modulos.cerrarModal('modal-confirmacion-crono');
    }
};
