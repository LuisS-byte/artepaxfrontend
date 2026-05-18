/**
 * js/shared/sidebar.js
 * Inyección dinámica de tipografías, Lucide icons y renderizado centralizado de la sidebar.
 * Secciones colapsables con estado persistido en localStorage.
 */

(function() {
    // Inyectar Google Fonts dinámicamente para no bloquear el render
    const links = [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css' }
    ];
    links.forEach(l => {
        const el = document.createElement('link');
        Object.entries(l).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
    });

    // Inyectar Lucide Icons CDN
    const lucideScript = document.createElement('script');
    lucideScript.src = 'https://unpkg.com/lucide@latest';
    lucideScript.defer = true;
    document.head.appendChild(lucideScript);

    // Inyectar Flatpickr JS CDN
    const flatpickrScript = document.createElement('script');
    flatpickrScript.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
    flatpickrScript.defer = true;
    document.head.appendChild(flatpickrScript);

    // Inyectar Flatpickr Locale Español CDN
    const flatpickrLocale = document.createElement('script');
    flatpickrLocale.src = 'https://npmcdn.com/flatpickr/dist/l10n/es.js';
    flatpickrLocale.defer = true;
    flatpickrLocale.onload = () => {
        if (window.modulos && window.modulos.initFechas) {
            window.modulos.initFechas();
        }
    };
    document.head.appendChild(flatpickrLocale);
})();

/* ── Helpers de secciones colapsables ──────────────────── */

function _getNavKey(label) {
    return 'sidebar-collapse-' + label.replace(/\s+/g, '-').toLowerCase();
}

function _isSectionOpen(label, activeId) {
    var saved = localStorage.getItem(_getNavKey(label));
    if (saved !== null) return saved === 'true';
    // Por defecto abierto SOLO si contiene el ítem activo
    return false;
}

function _sectionHasActive(items, activeId) {
    return items.some(function (item) { return item.id === activeId; });
}

/* ── Toggle de sección ─────────────────────────────────── */

function toggleSidebarSection(btn) {
    var label = btn.dataset.section;
    var container = btn.nextElementSibling;
    var chevron = btn.querySelector('.sidebar-chevron');
    var isOpen = container.classList.toggle('open');
    chevron.classList.toggle('collapsed', !isOpen);
    try { localStorage.setItem(_getNavKey(label), String(isOpen)); } catch (e) {}
}

/* ── Render principal ──────────────────────────────────── */

function renderSidebar(activeId, subtitle) {
    subtitle = subtitle || 'Gestión de Eventos';
    var isDashboard = activeId === 'dashboard';
    var basePath = isDashboard ? 'modules/' : '../';
    var homePath = isDashboard ? 'index.html' : '../../index.html';

    var menuStructure = [
        /* ── Panel Principal ── */
        { section: true, label: 'Panel Principal', items: [
            { id: 'dashboard', href: homePath, icon: 'layout-dashboard', label: 'Dashboard' },
            { id: 'clientes', href: basePath + 'clientes/clientes.html', icon: 'users', label: 'Clientes' },
            { id: 'eventos', href: basePath + 'eventos/eventos.html', icon: 'calendar-check', label: 'Eventos' }
        ]},

        /* ── Operación Financiera ── */
        { section: true, label: 'Operación Financiera', items: [
            { id: 'pagos', href: basePath + 'pagos/pagos.html', icon: 'wallet', label: 'Pagos' },
            { id: 'gastos', href: basePath + 'gastos/gastos.html', icon: 'receipt', label: 'Gastos' },
            { id: 'cronograma', href: basePath + 'cronograma/cronograma.html', icon: 'calendar-clock', label: 'Cronograma' },
            { id: 'documentos', href: basePath + 'documentos/documentos.html', icon: 'file-text', label: 'Documentos' }
        ]},

        /* ── Catálogo y Stock ── */
        { section: true, label: 'Catálogo y Stock', items: [
            { id: 'decoraciones', href: basePath + 'decoraciones/decoraciones.html', icon: 'palette', label: 'Decoraciones' },
            { id: 'inventario', href: basePath + 'inventario/inventario.html', icon: 'package', label: 'Inventario' },
            { id: 'catalogos', href: basePath + 'catalogos/catalogos.html', icon: 'book-open', label: 'Catálogos' }
        ]},

        /* ── Administración ── */
        { section: true, label: 'Administración', items: [
            { id: 'usuarios', href: basePath + 'usuarios/usuarios.html', icon: 'shield', label: 'Usuarios' },
            { id: 'notificaciones', href: basePath + 'notificaciones/notificaciones.html', icon: 'bell', label: 'Notificaciones' },
            { id: 'auditoria', href: basePath + 'auditoria/auditoria.html', icon: 'search', label: 'Auditoría' },
            { id: 'configuracion', href: basePath + 'configuracion/configuracion.html', icon: 'settings', label: 'Configuración' }
        ]}
    ];

    var navHTML = menuStructure.map(function (section) {
        var hasActive = _sectionHasActive(section.items, activeId);
        // Abrir si: tiene el item activo, o el usuario ya lo dejó abierto manualmente
        var defaultOpen = hasActive ? true : undefined;
        var saved = localStorage.getItem(_getNavKey(section.label));
        var isOpen = saved !== null ? saved === 'true' : (defaultOpen !== undefined ? defaultOpen : false);

        var itemsHTML = section.items.map(function (entry) {
            var activeClass = entry.id === activeId ? ' class="active"' : '';
            return '<a href="' + entry.href + '"' + activeClass + '>' +
                '<i data-lucide="' + entry.icon + '" class="icon"></i><span>' + entry.label + '</span></a>';
        }).join('');

        var chevronClass = 'sidebar-chevron' + (isOpen ? '' : ' collapsed');

        return '<div class="sidebar-section">' +
            '<button type="button" class="sidebar-section-toggle" onclick="toggleSidebarSection(this)" data-section="' + section.label + '">' +
            '<span>' + section.label + '</span>' +
            '<i data-lucide="chevron-down" class="' + chevronClass + '"></i>' +
            '</button>' +
            '<div class="sidebar-section-items' + (isOpen ? ' open' : '') + '">' +
            itemsHTML +
            '</div></div>';
    }).join('');

    var sidebarHTML =
        '<div class="sidebar-logo">' +
            '<h1>Artepax <span>Fiesta</span></h1>' +
            '<p>' + subtitle + '</p>' +
        '</div>' +
        '<nav class="sidebar-nav">' + navHTML + '</nav>' +
        '<div class="sidebar-footer">' +
            '<button class="btn-logout" onclick="logout()">' +
                '<i data-lucide="log-out" class="icon"></i> Cerrar sesión' +
            '</button>' +
        '</div>';

    var container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        } else {
            var s = document.querySelector('script[src*="lucide"]');
            if (s) s.addEventListener('load', function () { lucide.createIcons(); });
        }
    }

    // Overlay mobile
    if (!document.getElementById('sidebar-overlay')) {
        var overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }

    // Hamburguesa
    var topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('hamburger-btn')) {
        var btn = document.createElement('button');
        btn.className = 'hamburger-btn';
        btn.id = 'hamburger-btn';
        btn.setAttribute('aria-label', 'Abrir menú');
        btn.innerHTML = '<span></span><span></span><span></span>';
        btn.onclick = toggleSidebar;
        topbar.insertBefore(btn, topbar.firstChild);
    }
}

function toggleSidebar() {
    var sidebar = document.getElementById('sidebar-container');
    var overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    var isOpen = sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
    if (!isOpen) document.body.classList.remove('sidebar-open');
}

// Cerrar sidebar con Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        var sidebar = document.getElementById('sidebar-container');
        if (sidebar && sidebar.classList.contains('open')) toggleSidebar();
    }
});

// Auto-cerrar sidebar al navegar en mobile
document.addEventListener('click', function (e) {
    var link = e.target.closest('.sidebar-nav a');
    if (!link) return;
    var sidebar = document.getElementById('sidebar-container');
    if (sidebar && sidebar.classList.contains('open')) toggleSidebar();
});
