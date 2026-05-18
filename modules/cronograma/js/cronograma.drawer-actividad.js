/**
 * modules/cronograma/js/cronograma.drawer-actividad.js
 * Apertura, cierre, contexto, validación y guardado del drawer de actividad.
 * Recibe datos pre-validados y callbacks de recarga desde el orquestador.
 */

window.CronogramaDrawerActividad = {
    resetDrawerActividad() {
        CronogramaState.resetActividadDrawer();
        ocultarAlertaId('drawer-alert');
        modulos.limpiarForm(['input-actividad', 'input-fecha-inicio', 'input-fecha-fin', 'input-observacion']);
        document.getElementById('drawer-titulo').textContent = 'Agregar actividad';
        document.getElementById('btn-guardar-tarea').textContent = 'Crear actividad';
        document.getElementById('grupo-observacion').classList.add('hidden');
        document.getElementById('observacion-help').classList.remove('hidden');
        this.renderContextoDrawerActividad();
    },

    renderContextoDrawerActividad(tarea) {
        const ev = CronogramaState.get().eventoSeleccionadoResumen;
        const container = document.getElementById('drawer-evento-contexto');
        if (!ev) {
            container.innerHTML = '';
            return;
        }

        const horario = [ev.horaInicio, ev.horaFin].filter(Boolean).join(' - ') || 'Sin rango horario configurado';
        const modo = tarea ? 'Editando actividad existente' : 'Nueva actividad';

        container.innerHTML = `
            <div class="drawer-summary-grid">
                <div class="drawer-summary-main">
                    <span class="summary-eyebrow">${modo}</span>
                    <h3>${formatters.textoSeguro(ev.clienteNombre || `Evento #${ev.id}`)}</h3>
                    <p>${formatters.textoSeguro(ev.ubicacion || 'Ubicacion pendiente')} · ${formatFecha(ev.fecha)}</p>
                </div>
                <div class="drawer-summary-stat">
                    <span>Estado evento</span>
                    <strong>${formatters.textoSeguro(ev.estadoEventoNombre || '-')}</strong>
                </div>
                <div class="drawer-summary-stat">
                    <span>Horario permitido</span>
                    <strong>${formatters.textoSeguro(horario)}</strong>
                </div>
            </div>`;
    },

    validarFormularioActividad({ actividad, fechaInicio, fechaFin, observacion }) {
        if (!actividad) return 'La actividad es obligatoria.';
        if (actividad.length > 255) return 'La actividad no puede superar 255 caracteres.';
        if (!fechaInicio || !fechaFin) return 'Debes indicar fecha y hora de inicio y fin.';

        const inicio = toComparableDate(fechaInicio);
        const fin = toComparableDate(fechaFin);
        if (!inicio || !fin) return 'Las fechas ingresadas no son validas.';
        if (fin <= inicio) return 'La fecha de fin debe ser posterior a la fecha de inicio.';

        if (observacion && observacion.length > 255) return 'La observacion no puede superar 255 caracteres.';

        const ev = CronogramaState.get().eventoSeleccionadoResumen;
        if (!ev) return null;

        const fechaEvento = getDateKey(ev.fecha);
        if (getDateKey(inicio) !== fechaEvento || getDateKey(fin) !== fechaEvento) {
            return 'La actividad debe quedar dentro del mismo dia del evento.';
        }

        const inicioEvento = combineDateAndTime(ev.fecha, ev.horaInicio);
        const finEvento = combineDateAndTime(ev.fecha, ev.horaFin);

        if (inicioEvento && finEvento) {
            if (inicio < inicioEvento || fin > finEvento) {
                return 'La actividad queda fuera del horario configurado para el evento.';
            }
        }

        return null;
    },

    async guardarTarea(e, { recargarVistaActiva, mostrarAlerta } = {}) {
        e.preventDefault();
        const st = CronogramaState.get();
        if (!st.eventoSeleccionadoId || !st.eventoSeleccionadoResumen) return;

        const actividad = document.getElementById('input-actividad').value.trim();
        const fechaInicio = document.getElementById('input-fecha-inicio').value;
        const fechaFin = document.getElementById('input-fecha-fin').value;
        const observacion = document.getElementById('input-observacion').value.trim();

        const error = this.validarFormularioActividad({ actividad, fechaInicio, fechaFin, observacion });
        if (error) {
            return mostrarAlertaId('drawer-alert', 'error', error);
        }

        const submitBtn = document.getElementById('btn-guardar-tarea');
        submitBtn.disabled = true;

        try {
            if (st.cronogramaEditandoId) {
                const body = buildUpdatePayload({ actividad, fechaInicio, fechaFin, observacion });
                await API.cronogramas.actualizar(st.cronogramaEditandoId, body);
                if (mostrarAlerta) mostrarAlerta('success', 'Actividad actualizada correctamente.');
            } else {
                const body = buildCreatePayload({ actividad, fechaInicio, fechaFin, idEvento: st.eventoSeleccionadoId });
                await API.cronogramas.crear(body);
                if (mostrarAlerta) mostrarAlerta('success', 'Actividad creada correctamente.');
            }

            this.cerrarDrawerTarea();
            if (recargarVistaActiva) await recargarVistaActiva();
        } catch (err) {
            mostrarAlertaId('drawer-alert', 'error', err.message || 'No se pudo guardar la actividad.');
        } finally {
            submitBtn.disabled = false;
        }
    },

    abrirDrawerTarea() {
        const ev = CronogramaState.get().eventoSeleccionadoResumen;
        if (!ev || !esEventoEditable(ev)) {
            mostrarAlerta('warning', 'El estado del evento no permite crear cronograma.');
            return;
        }
        this.resetDrawerActividad();
        modulos.abrirModal('drawer-tarea-overlay');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async abrirDrawerEditar(id, row) {
        if (row && !esEditableCronograma(row)) {
            mostrarAlerta('warning', 'No se puede editar una actividad finalizada o cancelada.');
            return;
        }

        try {
            ocultarAlertaId('drawer-alert');
            const tarea = await API.cronogramas.get(id);
            CronogramaState.set({ cronogramaEditandoId: id });
            document.getElementById('drawer-titulo').textContent = 'Editar actividad';
            document.getElementById('btn-guardar-tarea').textContent = 'Guardar cambios';
            document.getElementById('input-actividad').value = tarea.actividad || '';
            setDateTimeFieldValue('input-fecha-inicio', tarea.fechaInicio);
            setDateTimeFieldValue('input-fecha-fin', tarea.fechaFin);
            document.getElementById('input-observacion').value = tarea.cronoObservacion || '';
            document.getElementById('grupo-observacion').classList.remove('hidden');
            document.getElementById('observacion-help').classList.add('hidden');
            this.renderContextoDrawerActividad(tarea);
            modulos.abrirModal('drawer-tarea-overlay');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (err) {
            mostrarAlerta('error', 'No se pudo cargar la actividad: ' + err.message);
        }
    },

    cerrarDrawerTarea(e) {
        if (e && e.target.id !== 'drawer-tarea-overlay') return;
        modulos.cerrarModal('drawer-tarea-overlay');
    }
};
