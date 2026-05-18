(function () {
    function buildDetalleStatusNote({ tone = 'info', icon = 'info', title = '', body = '' }) {
        return `
            <div class="detalle-status-note detalle-status-note--${tone}">
                <div class="detalle-status-note-icon">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="detalle-status-note-content">
                    <strong>${title}</strong>
                    <p>${body}</p>
                </div>
            </div>
        `;
    }

    function buildEmptyStateCard(icon, title, body, actionHtml = '') {
        return `
            <div class="detalle-empty-state">
                <div class="detalle-empty-state-icon">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="detalle-empty-state-content">
                    <strong>${title}</strong>
                    <p>${body}</p>
                </div>
                ${actionHtml ? `<div class="detalle-empty-state-actions">${actionHtml}</div>` : ''}
            </div>
        `;
    }

    function accordionSection(id, icon, title, open = false, content) {
        return `
            <div class="modal-section">
                <button class="accordion-header" onclick="toggleAccordion('acc-${id}', this)" type="button">
                    <div class="accordion-header-left">
                        <i data-lucide="${icon}" class="accordion-header-icon"></i>
                        <span class="accordion-header-title">${title}</span>
                    </div>
                    <i data-lucide="${open ? 'chevron-up' : 'chevron-down'}" class="accordion-header-chevron"></i>
                </button>
                <div id="acc-${id}" class="accordion-body ${open ? 'open' : ''}">
                    <div class="accordion-body-inner">${content}</div>
                </div>
            </div>
        `;
    }

    function toggleAccordion(id, btn) {
        const body = document.getElementById(id);
        const isOpen = body.classList.contains('open');
        if (!isOpen) {
            body.style.maxHeight = body.scrollHeight + 'px';
            body.classList.add('open');
        } else {
            body.style.maxHeight = '0px';
            body.classList.remove('open');
        }
        const chevron = btn.querySelector('.accordion-header-chevron');
        chevron.setAttribute('data-lucide', isOpen ? 'chevron-down' : 'chevron-up');
        lucide.createIcons();
        actualizarBotonAcordeones();
    }

    function toggleAllAccordions() {
        var allBodies = document.querySelectorAll('.accordion-body');
        var anyCollapsed = false;
        allBodies.forEach(function (body) {
            if (!body.classList.contains('open')) anyCollapsed = true;
        });
        allBodies.forEach(function (body) {
            if (anyCollapsed && !body.classList.contains('open')) {
                body.style.maxHeight = body.scrollHeight + 'px';
                body.classList.add('open');
            } else if (!anyCollapsed && body.classList.contains('open')) {
                body.style.maxHeight = '0px';
                body.classList.remove('open');
            }
        });
        var chevrons = document.querySelectorAll('.accordion-header-chevron');
        chevrons.forEach(function (c) {
            c.setAttribute('data-lucide', anyCollapsed ? 'chevron-up' : 'chevron-down');
        });
        lucide.createIcons();
        actualizarBotonAcordeones();
    }

    function actualizarBotonAcordeones() {
        var btn = document.getElementById('btn-toggle-acordeones');
        if (!btn) return;
        var allBodies = document.querySelectorAll('.accordion-body');
        var allOpen = allBodies.length > 0 && Array.from(allBodies).every(function (b) { return b.classList.contains('open'); });
        var icon = btn.querySelector('i');
        var span = btn.querySelector('span');
        if (!icon || !span) return;
        if (allOpen) {
            icon.setAttribute('data-lucide', 'minimize-2');
            span.textContent = 'Colapsar todo';
        } else {
            icon.setAttribute('data-lucide', 'maximize-2');
            span.textContent = 'Expandir todo';
        }
        lucide.createIcons();
    }

    function getDetalleEstadoInfo(estado, saldoPendiente = 0, tieneDevolucionPendiente = false) {
        if (tieneDevolucionPendiente) {
            return {
                tone: 'warning',
                icon: 'rotate-ccw',
                title: 'Este evento tiene impacto financiero pendiente.',
                body: 'Antes de cerrar seguimiento, conviene revisar la devolución pendiente y el historial de pagos.',
                shortAction: 'Revisar pagos'
            };
        }

        switch (estado) {
            case 'COTIZACION':
                return { tone: 'info', icon: 'file-text', title: 'La cotización todavía no se programó.', body: 'Revisá datos, precio y disponibilidad antes de avanzar al calendario operativo.', shortAction: 'Programar evento' };
            case 'PROGRAMADO':
                return { tone: saldoPendiente > 0 ? 'info' : 'success', icon: 'calendar-check', title: 'El evento ya está programado.', body: 'Confirmá anticipo, detalles del cliente y extras antes del montaje.', shortAction: 'Confirmar evento' };
            case 'CONFIRMADO':
                return { tone: 'success', icon: 'badge-check', title: 'El evento está confirmado y listo para operación.', body: 'El próximo paso natural es iniciar montaje cuando llegue la ventana operativa.', shortAction: 'Iniciar montaje' };
            case 'EN_MONTAJE':
                return { tone: 'success', icon: 'hammer', title: 'El equipo está en fase operativa.', body: 'Usá esta vista para monitorear cobros y gastos antes de marcar el evento como finalizado.', shortAction: 'Finalizar evento' };
            case 'PENDIENTE_COBRO':
                return { tone: saldoPendiente > 0 ? 'warning' : 'success', icon: 'wallet', title: 'El evento ya ocurrio y la cobranza sigue abierta.', body: saldoPendiente > 0 ? 'Todavia faltan <strong>$' + formatters.precio(saldoPendiente) + '</strong> por cobrar. Registra los pagos pendientes para completar la cobranza.' : 'El saldo quedo cubierto. El evento esta listo para finalizar automaticamente.', shortAction: 'Gestionar pagos' };
            case 'FINALIZADO':
                return { tone: 'success', icon: 'party-popper', title: 'El evento ya terminó.', body: 'Ahora lo importante es revisar rentabilidad y cierre administrativo del evento.', shortAction: 'Revisar rentabilidad' };
            case 'CANCELACION_PENDIENTE':
                return { tone: 'warning', icon: 'triangle-alert', title: 'La cancelación todavía está en revisión.', body: 'Resolvé si corresponde revertirla o confirmar la baja definitiva para cerrar el caso.', shortAction: 'Resolver cancelación' };
            case 'CANCELADO':
                return { tone: 'danger', icon: 'circle-off', title: 'El evento fue cancelado.', body: 'La vista queda como referencia histórica para auditoría, devoluciones y trazabilidad.', shortAction: 'Sin acciones operativas' };
            default:
                return { tone: 'info', icon: 'info', title: 'Estado del evento disponible.', body: 'Revisá el contexto general del evento y usá las acciones del footer según corresponda.', shortAction: 'Revisar detalle' };
        }
    }

    function buildDetalleHero({ evento, estado, mostrarFinanciero, precioTotal, totalCobrado, saldoPendiente, devolucionPendiente, tieneDevolucionPendiente, pctCobrado, pagosCount, horaStr, totalExtras }) {
        const cliente = formatters.textoSeguro(evento.clienteNombre || `Evento #${evento.id}`);
        const tipoEvento = formatters.textoSeguro(evento.tipoEventoNombre || 'Sin tipo definido');
        const ubicacion = formatters.textoSeguro(evento.ubicacion || 'ubicación pendiente');
        const decoracion = formatters.textoSeguro(evento.decoracionNombre || 'Sin decoración asignada');
        const estadoInfo = getDetalleEstadoInfo(estado, saldoPendiente, tieneDevolucionPendiente);

        var contactoChips = '';
        var telefono = evento.clienteTelefono || evento.clienteTel || '';
        var email = evento.clienteEmail || '';
        if (telefono || email) {
            contactoChips = '<div class="detalle-hero-meta detalle-hero-meta--contacto">';
            if (telefono) contactoChips += '<div class="detalle-meta-chip"><i data-lucide="phone"></i><span>' + formatters.textoSeguro(telefono) + '</span></div>';
            if (email) contactoChips += '<div class="detalle-meta-chip"><i data-lucide="mail"></i><span>' + formatters.textoSeguro(email) + '</span></div>';
            contactoChips += '</div>';
        }

        return `
            <section class="detalle-hero">
                <div class="detalle-hero-main">
                    <div class="detalle-hero-eyebrow">Vista ejecutiva</div>
                    <h3 class="detalle-hero-title">${cliente}</h3>
                    <p class="detalle-hero-subtitle">${tipoEvento}</p>
                    <div class="detalle-hero-meta">
                        <div class="detalle-meta-chip"><i data-lucide="calendar-days"></i><span>${formatFecha(evento.fecha)} · ${horaStr}</span></div>
                        <div class="detalle-meta-chip"><i data-lucide="map-pin"></i><span>${ubicacion}</span></div>
                        <div class="detalle-meta-chip"><i data-lucide="palette"></i><span>${decoracion}</span></div>
                        <div class="detalle-meta-chip"><i data-lucide="credit-card"></i><span>${pagosCount} ${pagosCount === 1 ? 'pago registrado' : 'pagos registrados'}</span></div>
                        ${totalExtras > 0 ? '<div class="detalle-meta-chip detalle-meta-chip--extras"><i data-lucide="package-plus"></i><span>Extras: $' + formatters.precio(totalExtras) + '</span></div>' : ''}
                    </div>
                    ${contactoChips}
                </div>
                <div class="detalle-kpis">
                    <div class="detalle-kpi detalle-kpi-primary"><span class="detalle-kpi-label">Estado actual</span><strong class="detalle-kpi-value">${formatters.textoSeguro(estado || 'Sin estado')}</strong></div>
                    <div class="detalle-kpi"><span class="detalle-kpi-label">Precio total</span><strong class="detalle-kpi-value">$${formatters.precio(precioTotal || evento.precioTotal || 0)}</strong></div>
                    ${mostrarFinanciero ? `
                    <div class="detalle-kpi"><span class="detalle-kpi-label">Cobrado</span><strong class="detalle-kpi-value success">$${formatters.precio(totalCobrado)}</strong></div>
                    <div class="detalle-kpi"><span class="detalle-kpi-label">${tieneDevolucionPendiente ? 'devolución pendiente' : 'Saldo pendiente'}</span><strong class="detalle-kpi-value ${tieneDevolucionPendiente || saldoPendiente > 0 ? 'warning' : 'success'}">$${formatters.precio(tieneDevolucionPendiente ? devolucionPendiente : saldoPendiente)}</strong></div>` : `
                    <div class="detalle-kpi"><span class="detalle-kpi-label">Siguiente paso</span><strong class="detalle-kpi-value">${formatters.textoSeguro(estadoInfo.shortAction)}</strong></div>`}
                </div>
            </section>
            ${buildDetalleStatusNote({
                tone: estadoInfo.tone,
                icon: estadoInfo.icon,
                title: estadoInfo.title,
                body: mostrarFinanciero ? `${estadoInfo.body} ${pctCobrado > 0 ? `Actualmente llevás <strong>${pctCobrado}%</strong> cobrado.` : ''}`.trim() : estadoInfo.body
            })}
        `;
    }

    function generarFooterDetalle(evento) {
        const estado = evento.estadoEventoNombre || '';
        const id = evento.id;
        let left = '';
        let right = '';

        const cancelBtn = '<button class="btn btn-danger" onclick="cerrarModalDetalleEvento(); abrirModalCancelar(' + id + ')"><i data-lucide="x-circle"></i> Cancelar Evento</button>';

        switch (estado) {
            case 'COTIZACION':
                left = cancelBtn;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button><button class="btn btn-outline" onclick="cerrarModalDetalleEvento(); editarEvento(${id})"><i data-lucide="edit-2"></i> Editar</button><button class="btn btn-primary" onclick="cerrarModalDetalleEvento(); confirmarAccion(${id}, 'programar')"><i data-lucide="calendar-check"></i> Programar</button>`;
                break;
            case 'PROGRAMADO':
                left = `<button class="btn btn-outline" onclick="gestionarPagos(${id})"><i data-lucide="credit-card"></i> Pagos</button><button class="btn btn-outline" onclick="gestionarGastos(${id})"><i data-lucide="receipt"></i> Gastos</button><button class="btn btn-outline" onclick="abrirModalExtras(${id})"><i data-lucide="package-plus"></i> Extras</button><button class="btn btn-outline" onclick="cerrarModalDetalleEvento(); editarEvento(${id})"><i data-lucide="edit-2"></i> Editar</button>${cancelBtn}`;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button><button class="btn btn-success" onclick="cerrarModalDetalleEvento(); confirmarAccion(${id}, 'confirmar')"><i data-lucide="check-circle"></i> Confirmar</button>`;
                break;
            case 'CONFIRMADO':
                left = `<button class="btn btn-outline" onclick="gestionarPagos(${id})"><i data-lucide="credit-card"></i> Pagos</button><button class="btn btn-outline" onclick="gestionarGastos(${id})"><i data-lucide="receipt"></i> Gastos</button><button class="btn btn-outline" onclick="abrirModalExtras(${id})"><i data-lucide="package-plus"></i> Extras</button>${cancelBtn}`;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button><button class="btn btn-primary" onclick="cerrarModalDetalleEvento(); confirmarAccion(${id}, 'iniciarMontaje')"><i data-lucide="play-circle"></i> Iniciar Montaje</button>`;
                break;
            case 'EN_MONTAJE':
                left = `<button class="btn btn-outline" onclick="gestionarPagos(${id})"><i data-lucide="credit-card"></i> Pagos</button><button class="btn btn-outline" onclick="gestionarGastos(${id})"><i data-lucide="receipt"></i> Gastos</button>${cancelBtn}`;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button><button class="btn btn-success" onclick="cerrarModalDetalleEvento(); confirmarAccion(${id}, 'finalizar')"><i data-lucide="flag"></i> Finalizar</button>`;
                break;
            case 'PENDIENTE_COBRO':
                left = `<button class="btn btn-outline" onclick="gestionarPagos(${id})"><i data-lucide="credit-card"></i> Pagos</button>`;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button>`;
                break;
            case 'CANCELACION_PENDIENTE':
                left = `<button class="btn btn-outline" onclick="gestionarPagos(${id})"><i data-lucide="credit-card"></i> Pagos</button>`;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button><button class="btn btn-warning" onclick="cerrarModalDetalleEvento(); confirmarAccion(${id}, 'revertirCancelacion')"><i data-lucide="rotate-ccw"></i> Revertir</button><button class="btn btn-danger" onclick="cerrarModalDetalleEvento(); confirmarAccion(${id}, 'confirmarCancelacion')"><i data-lucide="trash-2"></i> Confirmar Baja</button>`;
                break;
            case 'FINALIZADO':
                left = `<button class="btn btn-outline" onclick="verRentabilidad(${id})"><i data-lucide="trending-up"></i> Rentabilidad</button><button class="btn btn-outline" onclick="gestionarPagos(${id})"><i data-lucide="credit-card"></i> Pagos</button>`;
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button>`;
                break;
            default:
                right = `<button class="btn btn-secondary" onclick="cerrarModalDetalleEvento()">Cerrar</button>`;
                break;
        }

        return `<div class="modal-footer-left">${left}</div><div class="modal-footer-right">${right}</div>`;
    }

    function gestionarPagos(id) {
        window.location.href = `../pagos/pagos.html?eventoId=${id}`;
    }

    function gestionarGastos(id) {
        window.location.href = `../gastos/gastos.html?eventoId=${id}`;
    }

    function cerrarModalDetalleEvento() {
        modulos.cerrarModal('modal-detalle-evento');
    }

    async function verDetalle(id) {
        try {
            let evento, pagos, resumen, rentPreCargada;
            try {
                const detalle = await API.eventos.detalle(id);
                evento = { ...detalle, id: detalle.idEvento, estadoEventoNombre: detalle.estadoEvento };
                resumen = detalle.resumenPagos || null;
                rentPreCargada = detalle.rentabilidad || null;
                pagos = await API.pagos.porEvento(id).catch(() => []);
            } catch (_) {
                [evento, pagos, resumen] = await Promise.all([
                    API.eventos.get(id),
                    API.pagos.porEvento(id).catch(() => []),
                    API.pagos.resumen(id).catch(() => null)
                ]);
                rentPreCargada = null;
            }

            const productos = await API.eventos.productos(id).catch(() => []);
            const totalExtras = productos
                .filter(function (p) { return p.origen === 'EXTRA'; })
                .reduce(function (sum, p) { return sum + (p.costoTotal || 0); }, 0);
            const estado = evento.estadoEventoNombre || '';
            const mostrarFinanciero = ['PROGRAMADO', 'CONFIRMADO', 'EN_MONTAJE', 'PENDIENTE_COBRO', 'FINALIZADO'].includes(estado);
            const mostrarRentabilidad = estado === 'FINALIZADO';

            document.getElementById('detalle-titulo').textContent = `Evento #${evento.id}`;
            document.getElementById('detalle-badge-estado').innerHTML = modulos.badgeEstado(estado);

            const totalCobrado = resumen?.totalCobrado || 0;
            const precioTotal = resumen?.precioTotal || evento.precioTotal || 0;
            const saldoPendiente = resumen?.saldoPendiente || 0;
            const devolucionPendiente = resumen?.totalDevolucionPendiente || 0;
            const tieneDevolucionPendiente = !!resumen?.tieneDevolucionPendiente;
            const pctCobrado = precioTotal > 0 ? Math.min(100, Math.round((totalCobrado / precioTotal) * 100)) : 0;
            const horaStr = [evento.horaInicio, evento.horaFin].filter(Boolean).join(' - ') || '-';
            const pagosCount = Array.isArray(pagos) ? pagos.length : 0;

            let html = '';
            html += buildDetalleHero({ evento, estado, mostrarFinanciero, precioTotal, totalCobrado, saldoPendiente, devolucionPendiente, tieneDevolucionPendiente, pctCobrado, pagosCount, horaStr, totalExtras });
            html += '<div class="detalle-toggle-bar"><button class="btn btn-sm btn-ghost" id="btn-toggle-acordeones" onclick="toggleAllAccordions()"><i data-lucide="maximize-2"></i> <span>Expandir todo</span></button></div>';
            html += accordionSection('datos', 'calendar', 'Datos del Evento', true, `
                <div class="detalle-section-stack"><div class="info-grid">
                    <div class="info-item"><label>Cliente</label><span>${formatters.textoSeguro(evento.clienteNombre || '-')}</span></div>
                    <div class="info-item"><label>Tipo de Evento</label><span>${formatters.textoSeguro(evento.tipoEventoNombre || '-')}</span></div>
                    <div class="info-item"><label>Fecha</label><span>${formatFecha(evento.fecha)} — ${horaStr}</span></div>
                    <div class="info-item"><label>Decoración</label><span>${formatters.textoSeguro(evento.decoracionNombre || '-')}</span></div>
                    <div class="info-item full"><label>Ubicación</label><span>${formatters.textoSeguro(evento.ubicacion || '-')}</span></div>
                    <div class="info-item full">
                        <label>Precios</label>
                        <span class="precio-breakdown">
                            <span class="precio-chip">Base $${formatters.precio(evento.precioBase)}</span>
                            ${evento.precioAdicional > 0 ? '<span class="precio-chip precio-chip--extra">Adicional $' + formatters.precio(evento.precioAdicional) + '</span>' : ''}
                            <span class="precio-chip precio-chip--total">Total $${formatters.precio(evento.precioTotal || 0)}</span>
                        </span>
                    </div>
                    ${evento.fechaExpiracion ? `<div class="info-item"><label>Vence Cotización</label><span>${formatFecha(evento.fechaExpiracion)}</span></div>` : ''}
                    ${evento.fechaConfirmacion ? `<div class="info-item"><label>Confirmado el</label><span>${formatFecha(evento.fechaConfirmacion)}</span></div>` : ''}
                    ${evento.fechaCancelacion ? `<div class="info-item"><label>Cancelado el</label><span>${formatFecha(evento.fechaCancelacion)}</span></div>` : ''}
                    ${evento.motivoCancelacion ? `<div class="info-item full"><label>Motivo Cancelación</label><span>${formatters.textoSeguro(evento.motivoCancelacion)}</span></div>` : ''}
                    ${evento.clienteNotificado ? `<div class="info-item"><label>Cliente Notificado</label><span class="badge badge-finalizado" style="font-size:0.7rem;">Sí</span></div>` : ''}
                </div>
                ${evento.nota ? `<div class="detalle-nota-block"><label>Nota del Evento</label><p>${formatters.textoSeguro(evento.nota)}</p></div>` : ''}
                ${evento.notaPrecio ? `<div class="detalle-nota-block"><label>Motivo del Precio</label><p>${formatters.textoSeguro(evento.notaPrecio)}</p></div>` : ''}
                </div>
            `);

            if (productos.length > 0) {
                const productosBase = productos.filter(p => p.origen !== 'EXTRA');
                const productosExtras = productos.filter(p => p.origen === 'EXTRA');
                const headerLabels = { COTIZACION: 'Productos incluidos en la cotización', CANCELADO: 'Productos liberados', PENDIENTE_COBRO: 'Productos consumidos', FINALIZADO: 'Productos consumidos' };
                const label = headerLabels[estado] || 'Productos reservados';

                var productosHtml = '';
                if (productosBase.length > 0) {
                    productosHtml += '<div class="detalle-productos-group">';
                    productosHtml += '<span class="detalle-productos-group-label">' + label + '</span>';
                    productosHtml += '<div class="table-wrapper"><table class="data-table data-table-sm"><thead><tr><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">Costo Unit.</th><th class="text-right">Costo Total</th><th>Estado</th></tr></thead><tbody>';
                    productosHtml += productosBase.map(p => '<tr><td><span class="producto-nombre">' + formatters.textoSeguro(p.nombre) + '</span></td><td class="text-right">' + p.cantidad + '</td><td class="text-right">$' + formatters.precio(p.costoUnitario || 0) + '</td><td class="text-right">$' + formatters.precio(p.costoTotal || 0) + '</td><td><span class="reserva-badge reserva-badge--' + (p.estadoReserva || '').toLowerCase() + '">' + formatters.textoSeguro(p.estadoReserva) + '</span></td></tr>').join('');
                    productosHtml += '</tbody></table></div></div>';
                }
                if (productosExtras.length > 0) {
                    productosHtml += '<div class="detalle-productos-group detalle-productos-group--extras">';
                    productosHtml += '<span class="detalle-productos-group-label"><i data-lucide="plus-circle"></i> Extras agregados (' + productosExtras.length + ')</span>';
                    productosHtml += '<div class="table-wrapper"><table class="data-table data-table-sm"><thead><tr><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">Costo Unit.</th><th class="text-right">Costo Total</th><th>Estado</th></tr></thead><tbody>';
                    productosHtml += productosExtras.map(p => '<tr><td><span class="producto-nombre">' + formatters.textoSeguro(p.nombre) + '</span></td><td class="text-right">' + p.cantidad + '</td><td class="text-right">$' + formatters.precio(p.costoUnitario || 0) + '</td><td class="text-right">$' + formatters.precio(p.costoTotal || 0) + '</td><td><span class="reserva-badge reserva-badge--' + (p.estadoReserva || '').toLowerCase() + '">' + formatters.textoSeguro(p.estadoReserva) + '</span></td></tr>').join('');
                    productosHtml += '</tbody></table></div></div>';
                }

                var tieneExtras = productosExtras.length > 0;
                html += accordionSection('productos', 'package', `Productos (${productos.length})`, false, `
                    <div class="detalle-section-stack">${productosHtml}<p class="section-note" style="margin-top:var(--spacing-sm)">${estado === 'COTIZACION' ? 'Proyección basada en la decoración. Los productos se reservarán al programar.' : ['FINALIZADO', 'PENDIENTE_COBRO'].includes(estado) ? 'Stock consumido al finalizar el evento.' : estado === 'CANCELADO' ? 'Reservas liberadas por cancelación.' : 'Reservas activas que bloquean stock.'}${tieneExtras ? ' Incluye productos agregados como extras.' : ''}</p></div>
                `);
            }

            if (mostrarFinanciero) {
                const debeAbrirFinanciero = saldoPendiente > 0 || tieneDevolucionPendiente;
                html += accordionSection('financiero', 'dollar-sign', 'Resumen Financiero', debeAbrirFinanciero, resumen ? `
                    <div class="detalle-section-stack"><div class="financial-summary detalle-financial-summary"><div class="financial-card"><div class="fc-value">$${formatters.precio(precioTotal)}</div><div class="fc-label">Precio Total</div></div><div class="financial-card"><div class="fc-value success">$${formatters.precio(totalCobrado)}</div><div class="fc-label">Total Cobrado</div></div><div class="financial-card"><div class="fc-value ${saldoPendiente > 0 ? 'warning' : 'success'}">$${formatters.precio(saldoPendiente)}</div><div class="fc-label">Saldo Pendiente</div></div>${tieneDevolucionPendiente ? `<div class="financial-card detalle-financial-card-emphasis"><div class="fc-value warning">$${formatters.precio(devolucionPendiente)}</div><div class="fc-label">Devolución Pendiente</div></div>` : ''}</div><div class="payment-progress"><div class="pp-bar"><div class="pp-bar-fill" style="width: ${pctCobrado}%"></div></div><div class="pp-labels"><span>${pctCobrado}% cobrado</span><span>${saldoPendiente > 0 ? 'Faltan $' + formatters.precio(saldoPendiente) : 'Evento saldado'}</span></div></div>${buildDetalleStatusNote({ tone: tieneDevolucionPendiente ? 'warning' : saldoPendiente > 0 ? 'info' : 'success', icon: tieneDevolucionPendiente ? 'rotate-ccw' : saldoPendiente > 0 ? 'wallet' : 'badge-check', title: tieneDevolucionPendiente ? 'Hay una devolución pendiente por resolver.' : saldoPendiente > 0 ? 'Todavía hay saldo pendiente por cobrar.' : 'La cobranza del evento está al día.', body: tieneDevolucionPendiente ? `Revisá pagos para gestionar <strong>$${formatters.precio(devolucionPendiente)}</strong> y evitar inconsistencias financieras.` : saldoPendiente > 0 ? `El saldo actual es de <strong>$${formatters.precio(saldoPendiente)}</strong>. Podés completar el seguimiento desde el módulo de pagos.` : 'No hay deuda pendiente registrada para este evento.' })}</div>
                ` : buildEmptyStateCard('dollar-sign', 'No hay resumen financiero disponible todavía.', 'Cuando haya movimientos vinculados a este evento, acá vas a ver el avance de cobro y las alertas principales.'));

                html += accordionSection('pagos', 'credit-card', `Pagos (${pagosCount})`, false, pagosCount > 0 ? `
                    <div class="detalle-section-stack"><div class="items-list">${pagos.slice(0, 3).map(p => {
                        const estadoPago = p.estadoPagoNombre || p.estadoPago || p.estadoNombre || '';
                        const conceptoPago = p.conceptoPagoNombre || p.conceptoPago || 'Pago';
                        const metodoPago = p.metodoPagoNombre || p.metodoPago || '-';
                        const esPagado = estadoPago === 'PAGADO';
                        const esDevolucion = estadoPago === 'DEVOLUCION_PENDIENTE';
                        const iconClass = esPagado ? 'green' : esDevolucion ? 'warning' : 'blue';
                        const iconName = esPagado ? 'check-circle' : esDevolucion ? 'rotate-ccw' : 'clock';
                        const amountClass = esPagado ? 'green' : esDevolucion ? 'warning' : '';
                        const estadoBadge = esDevolucion ? ` <span class="badge badge-cancelacion-pendiente" style="font-size:0.6rem;vertical-align:middle;">Dev. Pendiente</span>` : '';
                        return `<div class="list-item"><div class="list-item-icon ${iconClass}"><i data-lucide="${iconName}"></i></div><div class="list-item-body"><div class="item-title">${formatters.textoSeguro(conceptoPago)}${estadoBadge}</div><div class="item-meta">${formatFecha(p.fecha)} ? ${formatters.textoSeguro(metodoPago)}</div></div><div class="list-item-amount ${amountClass}">$${formatters.precio(p.monto)}</div></div>`;
                    }).join('')}</div><a class="view-all-link" href="../pagos/pagos.html?eventoId=${id}">${pagosCount > 3 ? `Ver todos los ${pagosCount} pagos` : 'Ir al módulo de pagos'}<i data-lucide="chevron-right"></i></a></div>
                ` : buildEmptyStateCard('credit-card', 'Todavía no hay pagos registrados.', 'Podés cargar anticipos, pagos finales o devoluciones desde el módulo de pagos.', `<a class="view-all-link" href="../pagos/pagos.html?eventoId=${id}">Abrir pagos <i data-lucide="chevron-right"></i></a>`));

                let gastos = [];
                try { gastos = await API.gastos.porEvento(id); } catch (_) {}
                html += accordionSection('gastos', 'receipt', `Gastos (${gastos.length})`, false, gastos.length > 0 ? `
                    <div class="detalle-section-stack"><div class="items-list">${gastos.slice(0, 3).map(g => `<div class="list-item"><div class="list-item-icon ${g.gastoEstado === 'DESEMBOLSADO' ? 'red' : 'purple'}"><i data-lucide="${g.gastoEstado === 'DESEMBOLSADO' ? 'trending-down' : 'clock'}"></i></div><div class="list-item-body"><div class="item-title">${formatters.textoSeguro(g.gastoConcepto || 'Gasto')}</div><div class="item-meta">${formatFecha(g.gastoFecha)} · ${g.gastoEstado === 'DESEMBOLSADO' ? 'Desembolsado' : 'Proyectado'}</div></div><div class="list-item-amount ${g.gastoEstado === 'DESEMBOLSADO' ? 'red' : ''}">$${formatters.precio(g.gastoMonto)}</div></div>`).join('')}</div><a class="view-all-link" href="../gastos/gastos.html?eventoId=${id}">${gastos.length > 3 ? `Ver todos los ${gastos.length} gastos` : 'Ir al módulo de gastos'}<i data-lucide="chevron-right"></i></a></div>
                ` : buildEmptyStateCard('receipt', 'No hay gastos vinculados a este evento.', 'Cuando registrés materiales, viáticos o mano de obra, van a aparecer acá con mejor contexto operativo.', `<a class="view-all-link" href="../gastos/gastos.html?eventoId=${id}">Abrir gastos <i data-lucide="chevron-right"></i></a>`));
            }

            // ── Cronograma ──────────────────────────────
            var cronogramaItems = null;
            var tieneCronograma = evento.tieneCronograma;
            if (tieneCronograma === undefined) {
                try {
                    cronogramaItems = await API.cronogramas.porEvento(id);
                    tieneCronograma = !!(cronogramaItems && cronogramaItems.length > 0);
                } catch (_) { tieneCronograma = false; }
            }

            if (tieneCronograma) {
                try {
                    if (!cronogramaItems) cronogramaItems = await API.cronogramas.porEvento(id);
                    if (cronogramaItems && cronogramaItems.length > 0) {
                        html += accordionSection('cronograma', 'clipboard-list', `Cronograma (${cronogramaItems.length})`, false, `
                            <div class="detalle-section-stack"><div class="table-wrapper"><table class="data-table data-table-sm"><thead><tr><th>Actividad</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr></thead><tbody>
                                ${cronogramaItems.map(c => {
                                    var estadoBadge = '';
                                    var estadoVal = c.estado || c.cronoEstado || '';
                                    switch (estadoVal) {
                                        case 'COMPLETADO': estadoBadge = '<span class="badge badge-finalizado">Completado</span>'; break;
                                        case 'EN_PROGRESO': estadoBadge = '<span class="badge badge-programado">En Progreso</span>'; break;
                                        case 'CANCELADO': estadoBadge = '<span class="badge badge-cancelado">Cancelado</span>'; break;
                                        default: estadoBadge = '<span class="badge badge-cotizacion">Pendiente</span>';
                                    }
                                    return '<tr><td><strong>' + formatters.textoSeguro(c.actividad || 'Sin nombre') + '</strong>' + (c.observacion ? '<br><small class="text-light">' + formatters.textoSeguro(c.observacion) + '</small>' : '') + '</td><td>' + formatFecha(c.fechaInicio) + '</td><td>' + formatFecha(c.fechaFin) + '</td><td>' + estadoBadge + '</td></tr>';
                                }).join('')}
                            </tbody></table></div></div>
                        `);
                    }
                } catch (_) {}
            }

            // ── Timeline ──────────────────────────────
            function addTimelineStep(list, icon, label, date, cls) {
                list.push({ icon: icon, label: label, date: date ? formatFecha(date) : '\u2014', cls: cls || 'neutral' });
            }

            var timelineItems = [];
            addTimelineStep(timelineItems, 'plus-circle', 'Evento creado', evento.fechaCreacion);

            var estadosAvanzados = ['PROGRAMADO', 'CONFIRMADO', 'EN_MONTAJE', 'PENDIENTE_COBRO', 'FINALIZADO', 'CANCELACION_PENDIENTE'];
            if (estadosAvanzados.includes(estado)) {
                addTimelineStep(timelineItems, 'calendar-check', 'Programado');
            }

            if (evento.fechaConfirmacion && ['CONFIRMADO', 'EN_MONTAJE', 'PENDIENTE_COBRO', 'FINALIZADO'].includes(estado)) {
                addTimelineStep(timelineItems, 'badge-check', 'Confirmado', evento.fechaConfirmacion, 'success');
            }

            if (['EN_MONTAJE', 'PENDIENTE_COBRO', 'FINALIZADO'].includes(estado)) {
                addTimelineStep(timelineItems, 'play-circle', 'En Montaje');
            }

            if (['PENDIENTE_COBRO', 'FINALIZADO'].includes(estado)) {
                addTimelineStep(timelineItems, 'flag', 'Finalizado', null, 'success');
            }

            if (evento.fechaCancelacion) {
                var cancelLabel = estado === 'CANCELADO' ? 'Cancelado' : 'Cancelacion iniciada';
                addTimelineStep(timelineItems, 'circle-off', cancelLabel, evento.fechaCancelacion, 'danger');
            }

            html += accordionSection('timeline', 'git-branch', 'Linea de Tiempo', false, `
                <div class="detalle-section-stack"><div class="detalle-timeline">
                    ${timelineItems.map(function (t) { return `
                    <div class="detalle-timeline-step ${t.cls}">
                        <div class="detalle-timeline-marker"><i data-lucide="${t.icon}"></i></div>
                        <div class="detalle-timeline-body">
                            <strong>${t.label}</strong>
                            <span>${t.date}</span>
                        </div>
                    </div>`;
                    }).join('')}
                </div></div>
            `);

            if (mostrarRentabilidad) {
                const rent = rentPreCargada || await API.eventos.rentabilidad(id).catch(() => null);
                html += accordionSection('rentabilidad', 'trending-up', 'Rentabilidad del Evento', true, rent ? (function () {
                    var p = formatters.precio;
                    var ingreso = rent.ingresoCobrado || 0;
                    var precioAcordado = rent.precioAcordado || 0;
                    var costoMat = rent.costoMateriales || 0;
                    var costoMO = rent.costoManoObra || 0;
                    var gastosDes = rent.gastosDesembolsados || 0;
                    var gastosProy = rent.gastosProyectados || 0;
                    var totalCostos = costoMat + costoMO + gastosDes + gastosProy;
                    var ganancia = rent.gananciaNeta || 0;
                    var positiva = ganancia >= 0;
                    var margen = precioAcordado > 0 ? ((ganancia / precioAcordado) * 100).toFixed(1) + '%' : '\u2014';
                    var pctCostos = precioAcordado > 0 ? Math.min(100, Math.round((totalCostos / precioAcordado) * 100)) : 0;
                    var barColor = pctCostos > 80 ? 'var(--danger)' : pctCostos > 60 ? 'var(--warning)' : 'var(--success)';
                    return '<div class="detalle-section-stack">' +
                        '<div class="financial-summary detalle-financial-summary">' +
                            '<div class="financial-card"><div class="fc-value success">$' + p(ingreso) + '</div><div class="fc-label">Ingreso Cobrado</div></div>' +
                            '<div class="financial-card"><div class="fc-value">$' + p(totalCostos) + '</div><div class="fc-label">Costos Totales</div></div>' +
                            '<div class="financial-card"><div class="fc-value" style="color:' + (positiva ? 'var(--success)' : 'var(--danger)') + ';font-weight:700;">$' + p(Math.abs(ganancia)) + (positiva ? '' : ' (perdida)') + '</div><div class="fc-label">Ganancia Neta</div></div>' +
                            '<div class="financial-card"><div class="fc-value" style="color:' + (positiva ? 'var(--success)' : 'var(--danger)') + '">' + margen + '</div><div class="fc-label">Margen</div></div>' +
                        '</div>' +
                        '<div class="info-grid renta-grid-detalle">' +
                            '<div class="info-item"><label>Precio Acordado</label><span>$' + p(precioAcordado) + '</span></div>' +
                            '<div class="info-item"><label>Materiales</label><span>$' + p(costoMat) + '</span></div>' +
                            '<div class="info-item"><label>Mano de Obra</label><span>$' + p(costoMO) + '</span></div>' +
                            '<div class="info-item"><label>Gastos Desembolsados</label><span>$' + p(gastosDes) + '</span></div>' +
                            (gastosProy > 0 ? '<div class="info-item"><label>Gastos Proyectados</label><span>$' + p(gastosProy) + '</span></div>' : '') +
                        '</div>' +
                        '<div class="renta-bar-detalle">' +
                            '<div class="renta-bar-label">Costo vs Ingreso</div>' +
                            '<div class="renta-bar-track"><div class="renta-bar-fill" style="width:' + pctCostos + '%;background:' + barColor + ';"></div></div>' +
                            '<div class="renta-bar-labels"><span>' + pctCostos + '% en costos</span><span style="color:' + barColor + ';">$' + p(totalCostos) + ' de $' + p(ingreso) + '</span></div>' +
                        '</div>' +
                        buildDetalleStatusNote({ tone: positiva ? 'success' : 'danger', icon: positiva ? 'trending-up' : 'triangle-alert', title: positiva ? 'El evento cerro con rentabilidad positiva.' : 'El evento cerro con margen negativo.', body: positiva ? 'Usa este resumen para comparar costos reales vs. cobros y detectar eventos mas rentables.' : 'Conviene revisar costos, extras y cobranzas para entender por que el margen termino en rojo.' }) +
                    '</div>';
                })() : buildEmptyStateCard('trending-up', 'No hay rentabilidad calculada todavia.', 'Cuando el evento tenga informacion financiera disponible, aca vas a ver ingresos, costos y ganancia neta.'));
            }

            document.getElementById('detalle-evento-contenido').innerHTML = html;
            const footer = document.getElementById('detalle-footer');
            footer.className = 'modal-footer sticky';
            footer.innerHTML = generarFooterDetalle(evento);
            modulos.abrirModal('modal-detalle-evento');
            lucide.createIcons();
            actualizarBotonAcordeones();
        } catch (err) {
            mostrarAlerta('error', 'No se pudo cargar el detalle: ' + err.message);
        }
    }

    window.EventosDetail = Object.freeze({
        verDetalle,
        buildDetalleHero,
        getDetalleEstadoInfo,
        buildDetalleStatusNote,
        buildEmptyStateCard,
        accordionSection,
        toggleAccordion,
        toggleAllAccordions,
        generarFooterDetalle,
        gestionarPagos,
        gestionarGastos,
        cerrarModalDetalleEvento
    });
})();
