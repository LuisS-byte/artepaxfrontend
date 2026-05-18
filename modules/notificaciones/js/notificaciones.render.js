/**
 * modules/notificaciones/js/notificaciones.render.js
 * Render layer del módulo Notificaciones: cards, paginación y stats
 */
window.NotificacionesRender = {

    // ── RENDER LISTA ──────────────────────────────────────

    renderNotificaciones(lista) {
        const container = document.getElementById('noti-list');

        if (lista.length === 0) {
            container.innerHTML = `
                <div class="noti-empty">
                    <span class="noti-empty-icon"><i data-lucide="bell"></i></span>
                    <p>No hay notificaciones que coincidan con los filtros.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = lista.map(n => this.renderItem(n)).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    // ── RENDER ITEM ────────────────────────────────────────

    renderItem(n) {
        const estado = n.estadoNotificacion || '';
        const esPendiente = estado === 'PENDIENTE';
        const esEnviada = estado === 'ENVIADA';
        const esFallida = estado === 'FALLIDA';
        const esLeida = estado === 'LEIDA';
        const claseItem = esPendiente ? 'noti-item--pendiente' : esFallida ? 'noti-item--fallida' : esLeida ? 'noti-item--leida' : 'noti-item--desconocido';
        const icono = `<i data-lucide="${NotificacionesHelpers.iconoPorTipo(n.tipoNotificacion)}" class="noti-item-icon"></i>`;
        const fecha = modulos.formatearFecha(n.fechaEnvio) || '—';
        const tipoBadge = n.tipoNotificacion
            ? `<span class="noti-tipo">${NotificacionesHelpers.formatearTipo(n.tipoNotificacion)}</span>`
            : '';
        const eventoBadge = n.eventoId
            ? `<span class="noti-evento">Evento <a href="../eventos/eventos.html?eventoId=${encodeURIComponent(n.eventoId)}">#${n.eventoId}</a></span>`
            : '';

        let estadoBadge;
        if (esPendiente) {
            estadoBadge = `<span class="badge-pendiente-noti"><i data-lucide="circle"></i> Pendiente</span>`;
        } else if (esEnviada) {
            estadoBadge = `<span class="badge-enviada-noti"><i data-lucide="send"></i> Enviada</span>`;
        } else if (esFallida) {
            estadoBadge = `<span class="badge-fallida-noti"><i data-lucide="alert-triangle"></i> Fallida</span>`;
        } else if (estado === 'LEIDA') {
            estadoBadge = `<span class="badge-leida-noti"><i data-lucide="check"></i> Leída</span>`;
        } else {
            // Estado desconocido: mostrar el valor real, no asumir "Leída"
            estadoBadge = `<span class="badge-noti badge-desconocido">${escapeHtml(estado || 'DESCONOCIDO')}</span>`;
        }

        const btnLeer = esPendiente || esEnviada
            ? `<button class="btn btn-outline btn-sm" onclick="marcarLeida(${n.id})" title="Marcar como leída">Marcar leída</button>`
            : '';

        return `
            <div class="noti-item ${claseItem}" id="noti-${n.id}">
                <div class="noti-icon">${icono}</div>
                <div class="noti-content">
                    <div class="noti-mensaje">${escapeHtml(n.mensaje || '—')}</div>
                    <div class="noti-meta">
                        ${tipoBadge}
                        ${estadoBadge}
                        <span class="noti-fecha">${fecha}</span>
                        ${eventoBadge}
                    </div>
                </div>
                <div class="noti-actions">
                    ${btnLeer}
                </div>
            </div>`;
    },

    // ── PAGINACIÓN ─────────────────────────────────────────

    renderPaginaNotis(page = 0) {
        const inicio = page * NotificacionesState.NOTI_PAGE_SIZE;
        const pagina = NotificacionesState.notificacionesFiltradas.slice(inicio, inicio + NotificacionesState.NOTI_PAGE_SIZE);
        const totalPages = Math.ceil(NotificacionesState.notificacionesFiltradas.length / NotificacionesState.NOTI_PAGE_SIZE);

        this.renderNotificaciones(pagina);

        modulos.renderPaginacion({
            containerId: 'noti-pagination',
            page,
            totalPages,
            totalElements: NotificacionesState.notificacionesFiltradas.length,
            onPageChange: p => this.renderPaginaNotis(p)
        });
    },

    // ── STATS ──────────────────────────────────────────────

    actualizarStats() {
        const total = NotificacionesState.notificacionesActuales.length;
        const pendientes = NotificacionesState.notificacionesActuales.filter(n => n.estadoNotificacion === 'PENDIENTE').length;
        const leidas = NotificacionesState.notificacionesActuales.filter(n => n.estadoNotificacion === 'LEIDA').length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-pendientes').textContent = pendientes;
        document.getElementById('stat-leidas').textContent = leidas;

        // Botón "marcar todas" solo visible si hay pendientes
        const btn = document.getElementById('btn-marcar-todas');
        if (btn) btn.style.display = pendientes > 0 ? '' : 'none';
    }
};
