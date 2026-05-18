/**
 * modules/cronograma/js/cronograma.render.js
 * Render de celdas, columnas y componentes visuales del módulo Cronograma.
 * NO modifica estado, NO llama API, NO abre/cierra drawers.
 * Recibe datos y retorna HTML. Las acciones onclick usan window.* existentes.
 */

function getActividadMeta(row) {
    const chips = [];
    chips.push(`<span class="policy-chip ${esEditableCronograma(row) ? '' : 'policy-locked'}">${esEditableCronograma(row) ? 'Editable' : 'Bloqueada'}</span>`);
    if (esVencida(row)) chips.push('<span class="vencida-chip">Vencida</span>');
    return chips.join('');
}

function renderActividadCell(row) {
    const done = row.cronoEstado === 'COMPLETADO';
    const meta = getActividadMeta(row);
    return `
        <td>
            <div class="task-title-cell">
                <div class="task-title-row">
                    <strong class="${done ? 'task-done' : ''}">${formatters.textoSeguro(row.actividad || 'Actividad sin nombre')}</strong>
                    ${meta}
                </div>
                <div class="task-meta-row">Estados siguientes: ${formatters.textoSeguro(getEstadosSiguientes(row).join(', ') || 'Sin transiciones')}</div>
            </div>
        </td>`;
}

function renderEventoCell(row) {
    const idEvento = row.idEvento || null;
    const label = row.estadoEventoNombre || 'Sin estado';
    return `
        <td>
            <div class="event-state-stack">
                <span class="badge ${getBadgeEstadoEvento(label)}">${formatters.textoSeguro(label)}</span>
                ${idEvento ? `<button class="action-chip action-chip--ghost link-inline" data-action="detalleEvento" data-id="${idEvento}"><i data-lucide="external-link"></i>Evento #${idEvento}</button>` : '<span class="text-muted text-sm">Sin evento vinculado</span>'}
            </div>
        </td>`;
}

function renderObservacionCell(row) {
    const observacion = (row.cronoObservacion || '').trim();
    if (!observacion) {
        return `
            <td>
                <div class="task-observacion-cell">
                    <span class="task-observacion-chip is-empty">Sin nota interna</span>
                    <span class="text-muted">Puedes agregarla al editar la actividad.</span>
                </div>
            </td>`;
    }
    return `
        <td>
            <div class="task-observacion-cell">
                <span class="task-observacion-chip">Observacion</span>
                <span title="${formatters.textoSeguro(observacion)}">${formatters.textoSeguro(observacion)}</span>
            </div>
        </td>`;
}

function renderPersonalButton(row) {
    const disabled = ESTADOS_FINALES.includes(row.cronoEstado);
    return `
        <td style="text-align:center;">
            <button class="action-chip action-chip--neutral" title="Ver o asignar personal" data-action="personal" data-id="${row.id}" ${disabled ? 'disabled' : ''}>
                <i data-lucide="users"></i>
                Personal
            </button>
        </td>`;
}

function generarAccionesCronograma(row) {
    const acciones = [];
    const permitidas = getAccionesPermitidas(row);

    // Detalle SIEMPRE visible, incluso en estados finales
    acciones.push(`<button class="action-chip action-chip--ghost" data-action="detalle" data-id="${row.id}"><i data-lucide="eye"></i>Detalle</button>`);

    if (esEditableCronograma(row)) {
        acciones.push(`<button class="action-chip action-chip--neutral" data-action="editar" data-id="${row.id}"><i data-lucide="pencil-line"></i>Editar</button>`);
    }
    if (permitidas.includes('INICIAR')) {
        acciones.push(`<button class="action-chip action-chip--primary" data-action="iniciar" data-id="${row.id}"><i data-lucide="play"></i>Iniciar</button>`);
    }
    if (permitidas.includes('COMPLETAR')) {
        acciones.push(`<button class="action-chip action-chip--success" data-action="completar" data-id="${row.id}"><i data-lucide="check-check"></i>Completar</button>`);
    }
    if (esCancelableCronograma(row) || permitidas.includes('CANCELAR')) {
        acciones.push(`<button class="action-chip action-chip--danger" data-action="cancelar" data-id="${row.id}"><i data-lucide="ban"></i>Cancelar</button>`);
    }

    if (!acciones.length) {
        return `<div class="acciones-wrapper">${acciones.join('')}</div>`;
    }

    return `<div class="acciones-wrapper">${acciones.join('')}</div>`;
}

const COLUMNAS_CRONOGRAMA = [
    { label: 'Actividad', render: row => renderActividadCell(row) },
    { label: 'Inicio', render: row => `<td><span class="text-sm">${modulos.formatearFecha(row.fechaInicio)}</span></td>` },
    { label: 'Fin', render: row => `<td><span class="text-sm">${modulos.formatearFecha(row.fechaFin)}</span></td>` },
    { label: 'Estado', render: row => `<td>${getBadgeCronograma(row.cronoEstado)}</td>` },
    { label: 'Observacion', render: row => renderObservacionCell(row) },
    { label: 'Personal', render: row => renderPersonalButton(row) },
    { label: 'Acciones', render: row => `<td class="acciones-cell">${generarAccionesCronograma(row)}</td>` }
];

const COLUMNAS_CRONOGRAMA_GLOBAL = [
    { label: 'Actividad', render: row => renderActividadCell(row) },
    { label: 'Cliente', render: row => `<td><strong>${formatters.textoSeguro(row.clienteNombre || 'Sin cliente')}</strong></td>` },
    { label: 'Evento', render: row => renderEventoCell(row) },
    { label: 'Inicio', render: row => `<td><span class="text-sm">${modulos.formatearFecha(row.fechaInicio)}</span></td>` },
    { label: 'Fin', render: row => `<td><span class="text-sm">${modulos.formatearFecha(row.fechaFin)}</span></td>` },
    { label: 'Estado', render: row => `<td>${getBadgeCronograma(row.cronoEstado)}</td>` },
    { label: 'Observacion', render: row => renderObservacionCell(row) },
    { label: 'Personal', render: row => renderPersonalButton(row) },
    { label: 'Acciones', render: row => `<td class="acciones-cell">${generarAccionesCronograma(row)}</td>` }
];

/**
 * CronogramaRender — namespace para renders de vista completa.
 * Reciben datos explícitamente; NO leen estado, NO llaman API, NO abren drawers.
 */
window.CronogramaRender = {
    renderEventosQueue({ eventos, eventoSeleccionadoId }) {
        const container = document.getElementById('crono-queue-list');
        if (!container) return;

        if (!eventos || !eventos.length) {
            container.innerHTML = '<div class="crono-queue-empty">No hay eventos para mostrar.</div>';
            return;
        }

        container.innerHTML = eventos.map(evento => {
            const estado = evento.estadoEventoNombre || '';
            const esEditable = EVENTOS_EDITABLES.includes(estado);
            const active = String(evento.id) === String(eventoSeleccionadoId) ? ' active' : '';

            return `
                <button type="button" class="crono-queue-item${active}" data-action="seleccionarEvento" data-id="${evento.id}">
                    <div class="crono-queue-item-top">
                        <strong>${formatters.textoSeguro(evento.clienteNombre || `Evento #${evento.id}`)}</strong>
                        <span class="badge ${getBadgeEstadoEvento(estado)}">${formatters.textoSeguro(estado || '—')}</span>
                    </div>
                    <div class="crono-queue-meta">
                        <span>#${evento.id}</span>
                        <span>${formatFecha(evento.fecha)}</span>
                        ${evento.ubicacion ? `<span>${formatters.textoSeguro(evento.ubicacion)}</span>` : ''}
                    </div>
                    ${esEditable ? '<span class="crono-queue-cta">Gestionar actividades</span>' : '<span class="crono-queue-cta crono-queue-cta--muted">Solo consulta</span>'}
                </button>`;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderResumenEvento({ evento, total, pendientes, progreso, vencidas, editable }) {
        const container = document.getElementById('cronograma-evento-resumen');
        if (!evento) {
            container.innerHTML = '';
            return;
        }

        const horario = [evento.horaInicio, evento.horaFin].filter(Boolean).join(' - ') || 'Sin rango horario configurado';

        document.getElementById('evento-titulo-cron').textContent = `Logistica: ${evento.clienteNombre || `Evento #${evento.id}`}`;
        document.getElementById('evento-subtitulo-cron').textContent = editable
            ? 'Puedes crear y editar porque el evento esta en estado permitido.'
            : 'Solo consulta: el evento ya no permite crear ni editar actividades.';

        const botonNueva = document.getElementById('btn-nueva-tarea');
        botonNueva.disabled = !editable;
        botonNueva.textContent = editable ? 'Nueva actividad' : 'Alta bloqueada';

        container.innerHTML = `
            <div class="event-summary-grid">
                <div>
                    <span class="summary-eyebrow">Evento seleccionado</span>
                    <h2>${formatters.textoSeguro(evento.clienteNombre || `Evento #${evento.id}`)}</h2>
                    <p>${formatters.textoSeguro(evento.ubicacion || 'Ubicacion pendiente')} · ${formatFecha(evento.fecha)}</p>
                    <div class="event-summary-actions">
                        <span class="badge ${getBadgeEstadoEvento(evento.estadoEventoNombre)}">${formatters.textoSeguro(evento.estadoEventoNombre || 'Sin estado')}</span>
                        <button class="action-chip action-chip--neutral" data-action="detalleEvento" data-id="${evento.id}"><i data-lucide="external-link"></i>Ir al evento</button>
                    </div>
                    <div class="policy-banner ${editable ? 'is-ok' : ''}">
                        <i data-lucide="shield-check"></i>
                        <div>
                            <strong>${editable ? 'Ya podés organizar este evento' : 'Por ahora solo podés consultar'}</strong>
                            <p>${editable ? 'Este evento ya está listo para sumar o ajustar actividades.' : 'Cuando el evento entre en etapa operativa vas a poder crear o editar actividades.'}</p>
                        </div>
                    </div>
                </div>
                <div class="summary-kpis">
                    <div class="summary-kpi"><span>Fecha</span><strong>${formatFecha(evento.fecha)}</strong></div>
                    <div class="summary-kpi"><span>Horario</span><strong>${formatters.textoSeguro(horario)}</strong></div>
                    <div class="summary-kpi"><span>Total actividades</span><strong>${total}</strong></div>
                    <div class="summary-kpi"><span>Pend / progreso</span><strong>${pendientes + progreso}</strong></div>
                    <div class="summary-kpi"><span>Vencidas</span><strong>${vencidas}</strong></div>
                    <div class="summary-kpi"><span>ID evento</span><strong>#${evento.id}</strong></div>
                </div>
            </div>`;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderPaginacion({ page, totalPages, onPageChange }) {
        modulos.renderPaginacion({
            containerId: 'paginacion-crono-global',
            page,
            totalPages,
            onPageChange
        });
    }
};
