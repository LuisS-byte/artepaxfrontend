/**
 * modules/notificaciones/js/notificaciones.actions.js
 * Acciones del módulo Notificaciones: carga, filtros, mutaciones e init
 */
window.NotificacionesActions = {

    // ── CARGA ──────────────────────────────────────────────

    async cargarNotificaciones() {
        const list = document.getElementById('noti-list');
        if (!list) return;
        list.innerHTML = '<div class="loading-state"><div class="spinner"></div>Cargando notificaciones...</div>';

        try {
            NotificacionesState.notificacionesActuales = await NotificacionesAPI.cargarMias();
            this.poblarFiltroTipos();
            this.poblarFiltroEstados();
            NotificacionesRender.actualizarStats();
            this.filtrarNotificaciones();
        } catch (err) {
            list.innerHTML = '<div class="noti-empty"><span class="noti-empty-icon"><i data-lucide="alert-triangle"></i></span><p>Error al cargar notificaciones: ' + escapeHtml(err.message) + '</p></div>';
            mostrarAlerta('error', 'No se pudieron cargar las notificaciones.');
        }
    },

    // ── FILTROS ────────────────────────────────────────────

    poblarFiltroTipos() {
        NotificacionesState.tiposDetectados = new Set(
            NotificacionesState.notificacionesActuales.map(n => n.tipoNotificacion).filter(Boolean)
        );

        const sel = document.getElementById('filter-tipo-noti');
        if (!sel) return;
        const valorActual = sel.value;
        sel.innerHTML = '<option value="">Todos los tipos</option>';
        NotificacionesState.tiposDetectados.forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo;
            opt.textContent = NotificacionesHelpers.formatearTipo(tipo);
            sel.appendChild(opt);
        });
        if (valorActual && NotificacionesState.tiposDetectados.has(valorActual)) sel.value = valorActual;
    },

    /**
     * Pobla el filtro de estado dinámicamente desde los datos reales,
     * en lugar de depender de una lista fija del HTML.
     */
    poblarFiltroEstados() {
        const estados = new Set(
            NotificacionesState.notificacionesActuales.map(n => n.estadoNotificacion).filter(Boolean)
        );

        const sel = document.getElementById('filter-estado-noti');
        if (!sel) return;
        const valorActual = sel.value;
        sel.innerHTML = '<option value="">Todas</option>';

        // Orden prioritario: los 4 conocidos primero, el resto alfabético
        const ordenPrioritario = ['PENDIENTE', 'ENVIADA', 'LEIDA', 'FALLIDA'];
        const ordenado = [...estados].sort((a, b) => {
            const ia = ordenPrioritario.indexOf(a);
            const ib = ordenPrioritario.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        });

        ordenado.forEach(estado => {
            const opt = document.createElement('option');
            opt.value = estado;
            opt.textContent = NotificacionesHelpers.formatearTipo(estado);
            sel.appendChild(opt);
        });

        if (valorActual && estados.has(valorActual)) sel.value = valorActual;
    },

    filtrarNotificaciones() {
        const q = (document.getElementById('search-noti')?.value || '').toLowerCase();
        const estado = document.getElementById('filter-estado-noti')?.value || '';
        const tipo = document.getElementById('filter-tipo-noti')?.value || '';

        NotificacionesState.notificacionesFiltradas = NotificacionesState.notificacionesActuales.filter(n => {
            const mensaje = (n.mensaje || '').toLowerCase();
            const matchQ = !q || mensaje.includes(q);
            const matchEstado = !estado || n.estadoNotificacion === estado;
            const matchTipo = !tipo || n.tipoNotificacion === tipo;
            return matchQ && matchEstado && matchTipo;
        });

        NotificacionesRender.renderPaginaNotis(0);
        NotificacionesRender.actualizarStats();
    },

    // ── ACCIONES ───────────────────────────────────────────

    async marcarLeida(id) {
        try {
            await NotificacionesAPI.marcarLeida(id);
            // Actualización optimista en memoria
            const noti = NotificacionesState.notificacionesActuales.find(n => n.id === id);
            if (noti) noti.estadoNotificacion = 'LEIDA';
            this.filtrarNotificaciones();
            NotificacionesRender.actualizarStats();
            mostrarAlerta('success', 'Notificación marcada como leída.');
        } catch (err) {
            mostrarAlerta('error', 'Error al marcar como leída: ' + err.message);
        }
    },

    async marcarTodasLeidas() {
        const pendientes = NotificacionesState.notificacionesActuales.filter(n => n.estadoNotificacion === 'PENDIENTE');
        if (pendientes.length === 0) {
            mostrarAlerta('info', 'No hay notificaciones pendientes.');
            return;
        }

        const btn = document.getElementById('btn-marcar-todas');
        if (!btn) return;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Marcando...';

        let exito = 0;
        let errores = 0;

        for (const n of pendientes) {
            try {
                await NotificacionesAPI.marcarLeida(n.id);
                n.estadoNotificacion = 'LEIDA';
                exito++;
            } catch (err) {
                console.warn('No se pudo marcar la notificación como leída', { id: n.id, error: err });
                errores++;
            }
        }

        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="check-circle"></i> Marcar todas como leídas';
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        this.filtrarNotificaciones();
        NotificacionesRender.actualizarStats();

        if (errores === 0 && exito > 0) {
            mostrarAlerta('success', `Se marcaron ${exito} notificación(es) como leídas correctamente.`);
        } else if (errores > 0 && exito > 0) {
            mostrarAlerta('warning', `Completado con errores: ${exito} marcadas, ${errores} fallaron. Revise las que quedan pendientes.`);
        } else if (errores > 0 && exito === 0) {
            mostrarAlerta('error', `No se pudo marcar ninguna. ${errores} notificación(es) fallaron. Intente de nuevo más tarde.`);
        }
    },

    // ── INIT ───────────────────────────────────────────────

    init() {
        this.cargarNotificaciones();
        const searchInput = document.getElementById('search-noti');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filtrarNotificaciones(), 300));
        }
    }
};
