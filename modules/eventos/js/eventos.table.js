(function () {
    const { EVENTO_ESTADOS, EVENTO_ACCIONES } = window.EventosConstants;
    const { EVENTO_ACTION_LABELS } = window.EventosLabels;
    const {
        getAccionesPermitidasEvento,
        getAccionesPrimariasEvento
    } = window.EventosPermissions;

    const ACTION_UI_CONFIG = {
        [EVENTO_ACCIONES.EDITAR]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.EDITAR], icon: 'edit-2', action: id => `editarEvento(${id})`, cls: 'menu-item--primary' },
        [EVENTO_ACCIONES.EDITAR_PARCIAL]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.EDITAR_PARCIAL], icon: 'edit-2', action: id => `editarEvento(${id})`, cls: 'menu-item--primary' },
        [EVENTO_ACCIONES.EXTRAS]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.EXTRAS], icon: 'package-plus', action: id => `abrirModalExtras(${id})`, cls: 'menu-item--primary' },
        [EVENTO_ACCIONES.CANCELAR]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.CANCELAR], icon: 'x-circle', action: id => `abrirModalCancelar(${id})`, cls: 'menu-item--danger', buttonClass: 'btn-danger' },
        [EVENTO_ACCIONES.PROGRAMAR]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.PROGRAMAR], action: id => `confirmarAccion(${id}, 'programar')`, buttonClass: 'btn-primary' },
        [EVENTO_ACCIONES.CONFIRMAR]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.CONFIRMAR], action: id => `confirmarAccion(${id}, 'confirmar')`, buttonClass: 'btn-success' },
        [EVENTO_ACCIONES.INICIAR_MONTAJE]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.INICIAR_MONTAJE], action: id => `confirmarAccion(${id}, 'iniciarMontaje')`, buttonClass: 'btn-primary' },
        [EVENTO_ACCIONES.FINALIZAR]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.FINALIZAR], action: id => `confirmarAccion(${id}, 'finalizar')`, buttonClass: 'btn-success' },
        [EVENTO_ACCIONES.PAGOS]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.PAGOS], action: id => `gestionarPagos(${id})`, buttonClass: 'btn-warning' },
        [EVENTO_ACCIONES.REVERTIR_CANCELACION]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.REVERTIR_CANCELACION], action: id => `confirmarAccion(${id}, 'revertirCancelacion')`, buttonClass: 'btn-warning' },
        [EVENTO_ACCIONES.CONFIRMAR_CANCELACION]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.CONFIRMAR_CANCELACION], icon: 'trash', action: id => `confirmarAccion(${id}, 'confirmarCancelacion')`, cls: 'menu-item--danger' },
        [EVENTO_ACCIONES.RENTABILIDAD]: { label: EVENTO_ACTION_LABELS[EVENTO_ACCIONES.RENTABILIDAD], action: id => `verRentabilidad(${id})`, buttonClass: 'btn-outline' }
    };

    function getClienteAvatarClass(nombre) {
        if (!nombre) return 'client-avatar--1';
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        return 'client-avatar--' + ((Math.abs(hash) % 8) + 1);
    }

    function getClienteIniciales(nombre) {
        if (!nombre) return '?';
        const partes = nombre.trim().split(/\s+/);
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return partes[0].substring(0, 2).toUpperCase();
    }

    function generarAcciones(evento) {
        const estado = (evento.estadoEventoNombre || '').trim();
        const id = evento.id;
        const accionesPermitidas = getAccionesPermitidasEvento(estado);

        if (!accionesPermitidas.length) {
            return `<span class="badge" style="background:var(--neutral-200);color:var(--neutral-700);font-size:0.7rem;">${escapeHtml(estado || 'sin estado')}</span>`;
        }

        const accionesPrimarias = getAccionesPrimariasEvento(estado);
        const accionesSecundarias = accionesPermitidas.filter(accion => (
            accion !== EVENTO_ACCIONES.DETALLE && !accionesPrimarias.includes(accion)
        ));

        let html = `<div class="acciones-wrapper">`;
        html += `<button class="btn-icon" onclick="verDetalle(${id})" title="Ver detalle completo del evento"><i data-lucide="eye"></i></button>`;

        accionesPrimarias.forEach(accion => {
            const config = ACTION_UI_CONFIG[accion];
            if (!config) return;
            html += `<button class="btn btn-sm ${config.buttonClass || 'btn-primary'}" onclick="${config.action(id)}">${config.label}</button>`;
        });

        if (accionesSecundarias.length > 0) {
            html += `<div class="kebab-wrapper">`;
            html += `<button class="btn-icon kebab-btn" aria-haspopup="true" aria-expanded="false" onclick="toggleKebab(event, this)" title="más acciones"><i data-lucide="more-vertical"></i></button>`;
            html += `<div class="kebab-menu" role="menu">`;
            accionesSecundarias.forEach(accion => {
                const config = ACTION_UI_CONFIG[accion];
                if (!config) return;
                html += `<button class="kebab-item ${config.cls || ''}" onclick="${config.action(id)}; closeAllKebabs()">`;
                html += `<i data-lucide="${config.icon || 'circle'}"></i><span>${config.label}</span>`;
                html += `</button>`;
            });
            html += `</div></div>`;
        }

        html += `</div>`;
        return html;
    }

    const COLUMNAS_EVENTOS = [
        { label: 'ID', render: row => `<td><span class="text-muted" style="font-variant-numeric:tabular-nums;">#${row.id}</span></td>` },
        {
            label: 'Cliente',
            render: row => {
                const iniciales = getClienteIniciales(row.clienteNombre);
                const avatarClass = getClienteAvatarClass(row.clienteNombre);
                return `<td><div class="client-cell"><div class="client-avatar ${avatarClass}">${iniciales}</div><div class="client-info"><span class="client-name">${formatters.textoSeguro(row.clienteNombre)}</span></div></div></td>`;
            }
        },
        {
            label: 'Fecha del Evento',
            render: row => {
                const hora = row.horaInicio ? row.horaInicio.substring(0, 5) : '';
                return `<td><div class="date-cell"><span class="date-cell-primary">${formatFecha(row.fecha)}</span>${hora ? `<span class="date-cell-time">${hora}${row.horaFin ? ' - ' + row.horaFin.substring(0, 5) : ''}</span>` : ''}</div></td>`;
            }
        },
        { label: 'Ubicación', render: row => `<td><span class="table-cell-text text-sm">${formatters.textoSeguro(row.ubicacion || '—')}</span></td>` },
        {
            label: 'Decoración',
            render: row => `<td><div class="deco-cell">${row.decoracionNombre ? `<span class="deco-dot"></span>` : ''}<span class="table-cell-text text-sm">${formatters.textoSeguro(row.decoracionNombre || '—')}</span></div></td>`
        },
        {
            label: 'Estado',
            render: row => {
                const badge = modulos.badgeEstado(row.estadoEventoNombre);
                const expText = (row.estadoEventoNombre === EVENTO_ESTADOS.COTIZACION && row.fechaExpiracion)
                    ? `<small class="estado-cell-note">Vence ${formatFecha(row.fechaExpiracion)}</small>`
                    : '';
                return `<td><div class="estado-cell">${badge}${expText}</div></td>`;
            }
        },
        { label: 'Acciones', render: row => `<td class="acciones-cell">${generarAcciones(row)}</td>` }
    ];

    function toggleKebab(event, button) {
        event.stopPropagation();
        const menu = button.nextElementSibling;
        const isOpen = menu.classList.contains('open');
        closeAllKebabs();
        if (!isOpen) {
            menu.classList.add('open');
            button.setAttribute('aria-expanded', 'true');
        } else {
            button.setAttribute('aria-expanded', 'false');
        }
    }

    function closeAllKebabs() {
        document.querySelectorAll('.kebab-menu.open').forEach(menu => {
            menu.classList.remove('open');
            const button = menu.previousElementSibling;
            if (button) button.setAttribute('aria-expanded', 'false');
        });
    }

    function initEventosTable() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeAllKebabs();
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.kebab-wrapper')) closeAllKebabs();
        });
    }

    function renderEventosTable(datos) {
        modulos.renderTabla(datos, 'tabla-eventos', COLUMNAS_EVENTOS);

        const tbody = document.getElementById('tabla-eventos');
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((tr, index) => {
            if (datos[index]) {
                const estado = (datos[index].estadoEventoNombre || '').trim();
                tr.classList.add('row--' + estado);
            }
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderEventosTableEmpty() {
        const tbody = document.getElementById('tabla-eventos');
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><div class="empty-state-card"><div class="empty-icon"><i data-lucide="search-x"></i></div><h3>Sin resultados</h3><p>No se encontraron eventos con los filtros seleccionados.</p></div></td></tr>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderEventosTableLoading() {
        const tbody = document.getElementById('tabla-eventos');
        const colWidths = [6, 22, 16, 18, 18, 14, 18];
        tbody.innerHTML = [1, 2, 3, 4, 5].map(() => `
            <tr>
                ${colWidths.map(w => `<td><div class="skeleton-bar" style="width:${w}%"></div></td>`).join('')}
            </tr>`).join('');
    }

    window.EventosTable = Object.freeze({
        initEventosTable,
        renderEventosTable,
        renderEventosTableEmpty,
        renderEventosTableLoading,
        toggleKebab,
        closeAllKebabs
    });
})();
