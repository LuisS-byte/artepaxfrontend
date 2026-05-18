/**
 * js/shared/notificaciones-bell.js
 * Campana de notificaciones global en la topbar.
 *
 * Comportamiento:
 * - Se inyecta automáticamente en .topbar-actions antes de .user-info
 * - Muestra badge rojo con cantidad de PENDIENTES
 * - Dropdown con últimas notificaciones, priorizando pendientes
 * - Marcar individual como leída sin recargar
 * - Deep link a evento si eventoId existe
 * - Enlace "Ver todas" al módulo de notificaciones
 * - Degradación elegante: si no hay .topbar, no hace nada
 * - Si falla API, badge se oculta y dropdown muestra error controlado
 *
 * Dependencias: API (js/shared/api.js), Lucide Icons (sidebar.js),
 *               modulos.formatearFecha (js/shared/modulos.js) — opcional
 */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════
       State
    ═══════════════════════════════════════════════════════ */
    var notificaciones = [];
    var isOpen = false;
    var isLoading = false;

    /* ═══════════════════════════════════════════════════════
       DOM references (set in init)
    ═══════════════════════════════════════════════════════ */
    var wrapper;
    var badgeEl;
    var dropdown;
    var backdrop;
    var bodyEl;

    /* ═══════════════════════════════════════════════════════
       Helpers
    ═══════════════════════════════════════════════════════ */

    function safeHtml(text) {
        if (!text && text !== 0) return '';
        var d = document.createElement('div');
        d.textContent = String(text);
        return d.innerHTML;
    }

    /**
     * Determina si la página actual está en la raíz (dashboard)
     * o dentro de modules/. Útil para rutas relativas correctas.
     */
    function isRootPage() {
        return window.location.pathname.indexOf('/modules/') === -1;
    }

    function notifModulePath() {
        return isRootPage()
            ? 'modules/notificaciones/notificaciones.html'
            : '../notificaciones/notificaciones.html';
    }

    function hasAuthToken() {
        try {
            var tokenKey = window.APP_CONFIG && window.APP_CONFIG.TOKEN_KEY;
            return !!(tokenKey && window.localStorage.getItem(tokenKey));
        } catch (e) {
            return false;
        }
    }

    function eventoModulePath(eventoId) {
        var base = isRootPage()
            ? 'modules/eventos/eventos.html'
            : '../eventos/eventos.html';
        return base + '?eventoId=' + encodeURIComponent(eventoId);
    }

    function getNotificacionById(id) {
        for (var i = 0; i < notificaciones.length; i++) {
            if (notificaciones[i].id === id) return notificaciones[i];
        }
        return null;
    }

    /**
     * Formatea fecha para el dropdown. Usa modulos.formatearFecha
     * si está disponible, con fallo a relativo o local.
     */
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            var d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';

            var now = new Date();
            var diff = now - d;
            var mins = Math.floor(diff / 60000);

            if (mins < 1) return 'Ahora';
            if (mins < 60) return 'Hace ' + mins + ' min';

            var hours = Math.floor(mins / 60);
            if (hours < 24) return 'Hace ' + hours + 'h';

            var days = Math.floor(hours / 24);
            if (days < 7) return 'Hace ' + days + 'd';

            // Si modulos.formatearFecha está disponible, úsalo
            if (window.modulos && window.modulos.formatearFecha) {
                return window.modulos.formatearFecha(dateStr);
            }

            return d.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit'
            });
        } catch (e) {
            return '—';
        }
    }

    /**
     * Retorna nombre de icono Lucide según tipo de notificación.
     * Compatible con NotificacionesHelpers.iconoPorTipo.
     */
    function iconByType(tipo) {
        if (!tipo) return 'bell';
        var t = tipo.toUpperCase();
        if (t.indexOf('STOCK') !== -1 || t.indexOf('INVENTARIO') !== -1) return 'package';
        if (t.indexOf('PAGO') !== -1 || t.indexOf('SALDO') !== -1) return 'wallet';
        if (t.indexOf('EVENTO') !== -1 || t.indexOf('RECORDATORIO') !== -1) return 'calendar';
        if (t.indexOf('MONTAJE') !== -1) return 'hammer';
        if (t.indexOf('CANCEL') !== -1) return 'x-circle';
        if (t.indexOf('CONFIRM') !== -1) return 'check-circle';
        if (t.indexOf('COTIZACION') !== -1 || t.indexOf('EXPIRA') !== -1) return 'clock';
        return 'bell';
    }

    /* ═══════════════════════════════════════════════════════
       Badge
    ═══════════════════════════════════════════════════════ */

    function pendingCount() {
        var count = 0;
        for (var i = 0; i < notificaciones.length; i++) {
            if (notificaciones[i].estadoNotificacion === 'PENDIENTE') count++;
        }
        return count;
    }

    function updateBadge() {
        var count = pendingCount();
        if (count > 0) {
            badgeEl.textContent = count > 99 ? '99+' : count;
            badgeEl.classList.remove('hidden');
        } else {
            badgeEl.classList.add('hidden');
        }
    }

    /* ═══════════════════════════════════════════════════════
       Dropdown render
    ═══════════════════════════════════════════════════════ */

    function createIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    function renderDropdown() {
        if (!bodyEl) return;

        if (isLoading) {
            bodyEl.innerHTML =
                '<div class="noti-dropdown-empty"><div class="spinner"></div><p>Cargando...</p></div>';
            return;
        }

        // Mostrar pendientes primero; si no hay, últimas 10
        var pendientes = [];
        var leidas = [];
        for (var i = 0; i < notificaciones.length; i++) {
            var n = notificaciones[i];
            if (n.estadoNotificacion === 'PENDIENTE') {
                pendientes.push(n);
            } else {
                leidas.push(n);
            }
        }
        var showItems = pendientes.length > 0
            ? pendientes
            : leidas.slice(0, 10);

        if (showItems.length === 0) {
            bodyEl.innerHTML =
                '<div class="noti-dropdown-empty">' +
                    '<i data-lucide="bell-off"></i>' +
                    '<p>No hay notificaciones</p>' +
                '</div>';
            createIcons();
            return;
        }

        var html = '';
        for (var j = 0; j < showItems.length; j++) {
            var item = showItems[j];
            var esPendiente = item.estadoNotificacion === 'PENDIENTE';
            var icono = iconByType(item.tipoNotificacion);
            var fecha = formatDate(item.fechaEnvio);

            var eventoLink = item.eventoId
                ? '<a href="' + eventoModulePath(item.eventoId) + '" class="noti-dropdown-item-link" onclick="event.stopPropagation()">Ver evento #' + item.eventoId + '</a>'
                : '';

            var markBtn = esPendiente
                ? '<button class="noti-mark-read" onclick="event.stopPropagation(); window.NotifiBell && window.NotifiBell.marcarLeida(' + item.id + ')" title="Marcar como leída" data-noti-id="' + item.id + '">' +
                      '<i data-lucide="check"></i>' +
                  '</button>'
                : '';

            html +=
                '<div class="noti-dropdown-item' + (esPendiente ? ' noti-dropdown-item--pendiente' : '') + '" data-noti-id="' + item.id + '" onclick="window.NotifiBell && window.NotifiBell.abrirNotificacion(' + item.id + ')">' +
                    '<div class="noti-dropdown-item-icon">' +
                        '<i data-lucide="' + icono + '"></i>' +
                    '</div>' +
                    '<div class="noti-dropdown-item-content">' +
                        '<div class="noti-dropdown-item-msg">' + safeHtml(item.mensaje || '—') + '</div>' +
                        '<div class="noti-dropdown-item-meta">' +
                            '<span class="noti-dropdown-item-time">' + fecha + '</span>' +
                            eventoLink +
                        '</div>' +
                    '</div>' +
                    '<div class="noti-dropdown-item-action">' +
                        markBtn +
                    '</div>' +
                '</div>';
        }

        bodyEl.innerHTML = html;
        createIcons();
    }

    /* ═══════════════════════════════════════════════════════
       Load notifications from API
    ═══════════════════════════════════════════════════════ */

    async function loadNotificaciones() {
        isLoading = true;
        if (isOpen) renderDropdown();

        try {
            var data = await API.notificaciones.mias();
            // Asegurar que sea array
            notificaciones = Array.isArray(data) ? data : [];
            updateBadge();
            if (isOpen) renderDropdown();
        } catch (err) {
            console.warn('[noti-bell] Error cargando notificaciones:', err);
            if (isOpen) {
                bodyEl.innerHTML =
                    '<div class="noti-dropdown-empty" style="color:var(--danger)">' +
                        '<i data-lucide="alert-triangle"></i>' +
                        '<p>Error al cargar notificaciones</p>' +
                    '</div>';
                createIcons();
            }
        } finally {
            isLoading = false;
        }
    }

    /* ═══════════════════════════════════════════════════════
       Toggle / close
    ═══════════════════════════════════════════════════════ */

    function toggleDropdown(e) {
        e.stopPropagation();
        isOpen = !isOpen;
        dropdown.classList.toggle('open', isOpen);
        backdrop.classList.toggle('active', isOpen);

        // Siempre renderizar al abrir para reflejar el estado actual.
        if (isOpen) {
            renderDropdown();
        }
    }

    function closeDropdown() {
        isOpen = false;
        dropdown.classList.remove('open');
        backdrop.classList.remove('active');
    }

    /* ═══════════════════════════════════════════════════════
       Mark as read
    ═══════════════════════════════════════════════════════ */

    async function marcarLeida(id) {
        try {
            await API.notificaciones.leer(id);

            // Actualización optimista local
            for (var i = 0; i < notificaciones.length; i++) {
                if (notificaciones[i].id === id) {
                    notificaciones[i].estadoNotificacion = 'LEIDA';
                    break;
                }
            }
            updateBadge();

            // Re-render dropdown si está abierto para reflejar cambios
            if (isOpen) renderDropdown();
        } catch (err) {
            console.warn('[noti-bell] Error marcando como leída:', err);
        }
    }

    function abrirNotificacion(id) {
        var notificacion = getNotificacionById(id);
        closeDropdown();

        if (notificacion && notificacion.eventoId) {
            window.location.href = eventoModulePath(notificacion.eventoId);
            return;
        }

        window.location.href = notifModulePath();
    }

    /* ═══════════════════════════════════════════════════════
       Init: inject into topbar
    ═══════════════════════════════════════════════════════ */

    function init() {
        if (!hasAuthToken()) return;

        var topbarActions = document.querySelector('.topbar-actions');
        if (!topbarActions) return; // degradación elegante

        var userInfo = topbarActions.querySelector('.user-info');
        if (!userInfo) return;

        // ── Crear backdrop: overlay invisible para cerrar dropdown ──
        backdrop = document.createElement('div');
        backdrop.className = 'noti-backdrop';
        backdrop.addEventListener('click', closeDropdown);
        document.body.appendChild(backdrop);

        // ── Crear wrapper ──
        wrapper = document.createElement('div');
        wrapper.className = 'noti-bell-wrapper';

        // ── Crear botón campana ──
        var bellBtn = document.createElement('button');
        bellBtn.className = 'noti-bell-btn';
        bellBtn.setAttribute('aria-label', 'Notificaciones');
        bellBtn.setAttribute('title', 'Notificaciones');
        bellBtn.innerHTML = '<i data-lucide="bell"></i>';

        badgeEl = document.createElement('span');
        badgeEl.className = 'noti-bell-badge hidden';
        badgeEl.textContent = '0';
        bellBtn.appendChild(badgeEl);

        bellBtn.addEventListener('click', toggleDropdown);
        wrapper.appendChild(bellBtn);

        // ── Crear dropdown ──
        dropdown = document.createElement('div');
        dropdown.className = 'noti-dropdown';
        dropdown.innerHTML =
            '<div class="noti-dropdown-header">' +
                '<h3>Notificaciones</h3>' +
                '<a href="' + notifModulePath() + '" class="view-all-link">Ver todas</a>' +
            '</div>' +
            '<div class="noti-dropdown-body"></div>' +
            '<div class="noti-dropdown-footer">' +
                '<a href="' + notifModulePath() + '">Ir al centro de notificaciones</a>' +
            '</div>';

        wrapper.appendChild(dropdown);
        bodyEl = dropdown.querySelector('.noti-dropdown-body');

        if (bodyEl) {
            bodyEl.addEventListener('wheel', function (e) {
                var canScroll = bodyEl.scrollHeight > bodyEl.clientHeight;
                if (!canScroll) return;

                var atTop = bodyEl.scrollTop <= 0;
                var atBottom = Math.ceil(bodyEl.scrollTop + bodyEl.clientHeight) >= bodyEl.scrollHeight;
                var scrollingUp = e.deltaY < 0;
                var scrollingDown = e.deltaY > 0;

                if ((scrollingUp && !atTop) || (scrollingDown && !atBottom)) {
                    e.stopPropagation();
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { passive: false });
        }

        // ── Insertar en topbar-actions ANTES de user-info ──
        topbarActions.insertBefore(wrapper, userInfo);

        // ── Inicializar iconos Lucide ──
        createIcons();
        // Fallback: esperar a que Lucide termine de cargar
        var iconInterval = setInterval(function () {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
                clearInterval(iconInterval);
            }
        }, 200);
        setTimeout(function () { clearInterval(iconInterval); }, 5000);

        // ── Cargar notificaciones ──
        loadNotificaciones();
    }

    /* ═══════════════════════════════════════════════════════
       Boot: DOMContentLoaded
    ═══════════════════════════════════════════════════════ */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ═══════════════════════════════════════════════════════
       Public API (para onclick desde dropdown)
    ═══════════════════════════════════════════════════════ */

    window.NotifiBell = {
        marcarLeida: marcarLeida,
        abrirNotificacion: abrirNotificacion
    };
})();
