/**
 * modules/documentos/js/documentos.render.js
 * Capa de render del módulo Documentos — cola de eventos, KPIs contextuales,
 * tablas, columnas, skeleton, paginación y filtros globales.
 */
(function () {
    'use strict';

    // =========================================================================
    //   HELPERS DE NORMALIZACIÓN
    // =========================================================================

    function normalizarTextoBusqueda(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function getStatsEvento(eventoId) {
        return DocumentosState.docsStatsPorEvento[String(eventoId)] || null;
    }

    // =========================================================================
    //   SKELETON
    // =========================================================================

    function renderSkeleton(tbodyId, colWidths) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = [1, 2, 3, 4].map(() => `
            <tr>${colWidths.map(w => `<td><div class="skeleton-bar" style="width:${w}%"></div></td>`).join('')}</tr>
        `).join('');
    }

    // =========================================================================
    //   BADGES DE ESTADO DE ENVÍO
    // =========================================================================

    function getBadgeEstadoEnvio(row) {
        return modulos.badgeEstado(row.docuEstadoEnvio || 'PENDIENTE', {
            PENDIENTE: { clase: 'badge-documento-pendiente', label: 'Pendiente' },
            ENVIADO: { clase: 'badge-confirmado', label: 'Enviado' },
            FALLIDO: { clase: 'badge-cancelado', label: 'Fallido' },
            REENVIADO: { clase: 'badge-programado', label: 'Reenviado' }
        });
    }

    // =========================================================================
    //   ACCIONES POR DOCUMENTO
    // =========================================================================

    function renderAccionesDocumento(row) {
        let html = '<div class="acciones-wrapper">';

        const intentos = row.docuIntentosEnvio ?? 0;
        if (intentos >= 3) {
            html += '<span class="text-muted text-sm">Límite alcanzado</span>';
        } else {
            const tooltip = `Quedan ${3 - intentos} intento(s) disponible(s)`;
            html += `<button class="btn btn-outline btn-sm" onclick="abrirModalReenviar(${row.idDocumento})" title="${tooltip.replace(/"/g, '&quot;')}">Reenviar</button>`;
        }
        html += '</div>';
        return html;
    }

    // =========================================================================
    //   COLUMNAS DE TABLAS
    // =========================================================================

    const COLUMNAS_DOCS = [
        {
            label: 'Tipo',
            render: row => `<td><div class="doc-name-cell"><strong>${formatters.textoSeguro(row.docuTipo || '-')}</strong></div></td>`
        },
        {
            label: 'Fecha Generación',
            render: row => `<td><span class="text-sm">${modulos.formatearFecha(row.docuFechaGeneracion)}</span></td>`
        },
        {
            label: 'Fecha Envío',
            render: row => `<td><span class="text-sm">${row.docuFechaEnvio ? modulos.formatearFecha(row.docuFechaEnvio) : '-'}</span></td>`
        },
        {
            label: 'Estado de Envío',
            render: row => `<td>${getBadgeEstadoEnvio(row)}</td>`
        },
        {
            label: 'Intentos',
            render: row => `<td><span class="text-sm">${row.docuIntentosEnvio ?? 0} / 3</span></td>`
        },
        {
            label: 'Acciones',
            render: row => `<td class="acciones-cell">${renderAccionesDocumento(row)}</td>`
        }
    ];

    const COLUMNAS_DOCS_GLOBAL = [
        { label: 'Cliente', render: row => `<td><strong>${formatters.textoSeguro(row.clienteNombre || '-')}</strong></td>` },
        { label: 'Tipo', render: row => `<td>${formatters.textoSeguro(row.docuTipo || '-')}</td>` },
        { label: 'Evento', render: row => `<td><span class="text-sm">#${row.idEvento || '-'} - ${formatters.textoSeguro(row.estadoEventoNombre || 'Sin estado')}</span></td>` },
        { label: 'Estado envío', render: row => `<td>${getBadgeEstadoEnvio(row)}</td>` },
        { label: 'Intentos', render: row => `<td>${row.docuIntentosEnvio ?? 0} / 3</td>` },
        { label: 'Fecha generación', render: row => `<td>${modulos.formatearFecha(row.docuFechaGeneracion)}</td>` },
        { label: 'Acciones', render: row => `<td class="acciones-cell">${renderAccionesDocumento(row)}</td>` }
    ];

    const COLUMNAS_PLANTILLAS = [
        { label: 'Tipo', render: row => `<td><strong>${formatters.textoSeguro(row.tipoDocumento || '-')}</strong></td>` },
        { label: 'Estado', render: row => `<td>${modulos.badgeEstado(row.activo ? 'ACTIVO' : 'INACTIVO')}</td>` },
        { label: 'Fecha creación', render: row => `<td><span class="text-sm">${modulos.formatearFecha(row.fechaCreacion)}</span></td>` },
        { label: 'Acciones', render: row => `<td class="acciones-cell"><button class="btn btn-outline btn-sm" onclick="abrirEditarPlantilla(${row.idPlantilla})">Editar</button></td>` }
    ];

    // =========================================================================
    //   COLA DE EVENTOS — FILTRADO
    // =========================================================================

    function getEventosOrdenados() {
        return [...DocumentosState.eventosDisponibles].sort((a, b) => {
            const aId = Number(a.id || 0);
            const bId = Number(b.id || 0);
            return bId - aId;
        });
    }

    function getEventosFiltrados() {
        const query = normalizarTextoBusqueda(DocumentosState.busquedaEventosDoc);

        return getEventosOrdenados().filter(evento => {
            const est = (evento.estadoEventoNombre || '').toUpperCase();
            const filtro = DocumentosState.filtroEventosDoc;
            const saldo = Number(DocumentosState.eventosSaldoPendiente[String(evento.id)] || 0);

            if (filtro === 'cotizacion' && est !== 'COTIZACION') return false;
            if (filtro === 'con-deuda' && saldo <= 0) return false;
            if (filtro === 'activos' && !['PROGRAMADO', 'CONFIRMADO', 'EN_MONTAJE', 'PENDIENTE_COBRO'].includes(est)) return false;
            if (filtro === 'finalizados' && est !== 'FINALIZADO') return false;

            // Búsqueda textual
            if (query) {
                const bag = normalizarTextoBusqueda([
                    evento.clienteNombre,
                    evento.estadoEventoNombre,
                    `#${evento.id}`,
                    evento.id
                ].join(' '));
                if (!bag.includes(query)) return false;
            }

            return true;
        });
    }

    // =========================================================================
    //   COLA DE EVENTOS — RENDER
    // =========================================================================

    function renderStatsCola() {
        const el = document.getElementById('cola-doc-count');
        if (!el) return;
        const visibles = getEventosFiltrados().length;
        el.textContent = visibles;
    }

    function renderColaEventos() {
        const container = document.getElementById('lista-eventos-doc');
        if (!container) return;

        renderStatsCola();

        if (DocumentosState.colaCargando && !DocumentosState.eventosDisponibles.length) {
            container.innerHTML = '<div class="doc-queue-empty">Cargando eventos...</div>';
            return;
        }

        const eventos = getEventosFiltrados();
        if (!eventos.length) {
            container.innerHTML = '<div class="doc-queue-empty">No hay eventos que coincidan con los filtros actuales.</div>';
            return;
        }

        container.innerHTML = eventos.map(evento => {
            const stats = getStatsEvento(evento.id);
            const active = String(evento.id) === String(DocumentosState.eventoSeleccionadoId) ? ' active' : '';
            const est = (evento.estadoEventoNombre || '').toUpperCase();

            let helper = '';
            let helperClass = 'muted';
            if (stats) {
                if (stats.tieneProblemas) {
                    helper = `${stats.pendientes + stats.fallidos} pendiente(s) o fallido(s)`;
                    helperClass = 'warning';
                } else if (stats.total > 0) {
                    helper = `${stats.total} documento(s) — ${stats.enviados} enviado(s)`;
                    helperClass = 'success';
                } else {
                    helper = 'Sin documentos generados';
                    helperClass = 'muted';
                }
            } else {
                helper = est === 'COTIZACION' ? 'Disponible para cotización' : 'Seleccionar para gestionar';
            }

            return `
                <button type="button" class="doc-queue-item${active}" onclick="seleccionarEventoDoc(${evento.id})">
                    <div class="doc-queue-item-top">
                        <div>
                            <strong>${formatters.textoSeguro(evento.clienteNombre || `Evento #${evento.id}`)}</strong>
                            <span class="doc-queue-id">Evento #${evento.id} · ${modulos.formatearFecha(evento.fecha)}</span>
                        </div>
                        ${modulos.badgeEstado(evento.estadoEventoNombre || '—')}
                    </div>
                    ${stats ? `
                    <div class="doc-queue-metrics">
                        <span>Total: ${stats.total}</span>
                        <span>Enviados: ${stats.enviados}</span>
                        ${stats.fallidos ? `<span style="color:var(--danger)">Fallidos: ${stats.fallidos}</span>` : ''}
                        ${stats.pendientes ? `<span style="color:var(--warning-text)">Pendientes: ${stats.pendientes}</span>` : ''}
                    </div>` : ''}
                    <div class="doc-queue-footer">
                        <span class="doc-queue-helper ${helperClass}">${helper}</span>
                        <span class="doc-queue-cta">${active ? 'Gestionando' : 'Gestionar'}</span>
                    </div>
                </button>`;
        }).join('') + '</div>';
    }

    // =========================================================================
    //   CACHE DE STATS POR EVENTO
    // =========================================================================

    function cachearStatsDocumentos(eventoId, docs) {
        DocumentosState.docsStatsPorEvento[String(eventoId)] = {
            total: docs.length,
            enviados: docs.filter(d => ['ENVIADO', 'REENVIADO'].includes(d.docuEstadoEnvio)).length,
            pendientes: docs.filter(d => d.docuEstadoEnvio === 'PENDIENTE').length,
            fallidos: docs.filter(d => d.docuEstadoEnvio === 'FALLIDO').length,
            tieneProblemas: docs.some(d => ['FALLIDO', 'PENDIENTE'].includes(d.docuEstadoEnvio))
        };
    }

    // =========================================================================
    //   KPIs GLOBALES DEL HEADER
    // =========================================================================

    function actualizarKpisDocumentos() {
        const elEventos = document.getElementById('kpi-doc-eventos');
        const elRiesgo = document.getElementById('kpi-doc-riesgo');
        if (elEventos) elEventos.textContent = DocumentosState.eventosDisponibles.length;
        if (elRiesgo) elRiesgo.textContent = DocumentosState.documentosGlobales.filter(
            item => ['PENDIENTE', 'FALLIDO'].includes(item.docuEstadoEnvio)
        ).length;
    }

    // =========================================================================
    //   CONTEXTO DEL EVENTO SELECCIONADO (resumen + KPIs + banner)
    // =========================================================================

    function renderContextoDocumentos() {
        const container = document.getElementById('evento-doc-summary');
        const kpisContainer = document.getElementById('doc-contextual-kpis');
        const bannerContainer = document.getElementById('doc-contextual-banner');

        if (!DocumentosState.eventoSeleccionadoResumen) {
            if (container) container.innerHTML = '';
            if (kpisContainer) kpisContainer.innerHTML = '';
            if (bannerContainer) bannerContainer.classList.add('hidden');
            return;
        }

        const evento = DocumentosState.eventoSeleccionadoResumen;
        const saldoPendiente = Number(DocumentosState.resumenPagoEvento?.saldoPendiente || 0);
        const docs = DocumentosState.documentosActuales;
        const stats = getStatsEvento(evento.id) || { total: 0, enviados: 0, pendientes: 0, fallidos: 0 };

        // ── Detail header ──
        if (container) {
            container.innerHTML = `
                <div class="doc-detail-header-main">
                    <div>
                        <span class="doc-detail-kicker">Seguimiento documental</span>
                        <h2>${formatters.textoSeguro(evento.clienteNombre || `Evento #${evento.id}`)}</h2>
                    </div>
                    ${modulos.badgeEstado(evento.estadoEventoNombre || '—')}
                </div>
                <p class="doc-detail-subtitle">${formatters.textoSeguro(evento.ubicacion || 'Ubicación pendiente')} · ${modulos.formatearFecha(evento.fecha)}</p>
                <div class="doc-detail-meta">
                    <span class="doc-pill"><i data-lucide="file-text"></i> Documentos: ${docs.length}</span>
                    <span class="doc-pill ${saldoPendiente > 0 ? 'doc-pill--warning' : 'doc-pill--success'}"><i data-lucide="wallet"></i> Saldo: $${formatters.precio(saldoPendiente)}</span>
                </div>`;
        }

        // ── Contextual KPIs ──
        if (kpisContainer) {
            kpisContainer.innerHTML = `
                <div class="doc-contextual-kpi">
                    <span class="doc-contextual-kpi-label">Generados</span>
                    <strong class="doc-contextual-kpi-value">${stats.total}</strong>
                </div>
                <div class="doc-contextual-kpi ${stats.enviados > 0 ? 'doc-contextual-kpi--success' : ''}">
                    <span class="doc-contextual-kpi-label">Enviados</span>
                    <strong class="doc-contextual-kpi-value">${stats.enviados}</strong>
                </div>
                <div class="doc-contextual-kpi ${stats.pendientes > 0 ? 'doc-contextual-kpi--warning' : ''}">
                    <span class="doc-contextual-kpi-label">Pendientes</span>
                    <strong class="doc-contextual-kpi-value">${stats.pendientes}</strong>
                </div>
                <div class="doc-contextual-kpi ${stats.fallidos > 0 ? 'doc-contextual-kpi--danger' : ''}">
                    <span class="doc-contextual-kpi-label">Fallidos</span>
                    <strong class="doc-contextual-kpi-value">${stats.fallidos}</strong>
                </div>`;
        }

        // ── Contextual banner ──
        if (bannerContainer) {
            let bannerHtml = '';
            let bannerClass = 'hidden';

            if (stats.total === 0) {
                bannerHtml = `<i data-lucide="info"></i> <span>Todavía no hay documentos generados para este evento. Usá las cards de abajo para generar el primer documento.</span>`;
                bannerClass = 'doc-banner doc-banner--info';
            } else if (stats.fallidos > 0) {
                bannerHtml = `<i data-lucide="alert-triangle"></i> <span><strong>${stats.fallidos} documento(s) fallido(s)</strong> — revisá el estado y reenviálos si es necesario. Los envíos fallidos consumen intentos.</span>`;
                bannerClass = 'doc-banner doc-banner--danger';
            } else if (stats.pendientes > 0) {
                bannerHtml = `<i data-lucide="clock"></i> <span><strong>${stats.pendientes} documento(s) pendiente(s) de envío</strong> — podés reenviarlos desde la tabla de documentos.</span>`;
                bannerClass = 'doc-banner doc-banner--warning';
            } else if (stats.total > 0) {
                bannerHtml = `<i data-lucide="check-circle"></i> <span>Todos los documentos fueron procesados correctamente.</span>`;
                bannerClass = 'doc-banner doc-banner--success';
            }

            bannerContainer.className = bannerClass;
            bannerContainer.innerHTML = bannerHtml;
            bannerContainer.classList.remove('hidden');
        }
    }

    // =========================================================================
    //   ACCIONES DE GENERACIÓN POR EVENTO
    // =========================================================================

    /**
     * Renderiza las cards de acción documental con jerarquía visual
     * según prioridad UX y estado del evento.
     *
     * Jerarquía por estado (matriz UX):
     *   COTIZACION     → exclusive (solo cotización)
     *   PROGRAMADO     → aviso si saldo > 0 (único disponible)
     *   CONFIRMADO     → confirmación (primary) + aviso (primary) si saldo > 0
     *   EN_MONTAJE     → confirmación (primary) + aviso (primary) si saldo > 0
     *   PENDIENTE_COBRO → aviso si saldo > 0 (único disponible)
     *   FINALIZADO     → aviso DESTACADO (primary), confirmación degradada (secondary)
     *   CANCELADO      → todo bloqueado
     */
    function renderAccionesEvento() {
        const actions = document.getElementById('documentos-actions');
        if (!DocumentosState.eventoSeleccionadoResumen) {
            if (actions) actions.innerHTML = '';
            return;
        }

        const estado = DocumentosState.eventoSeleccionadoResumen.estadoEventoNombre || '';
        const saldoPendiente = Number(DocumentosState.resumenPagoEvento?.saldoPendiente || 0);

        if (actions) {
            const entries = Object.entries(DocumentosPolicy.DOC_POLICY);

            // Si es CANCELADO, renderizar todo bloqueado con mensaje
            if (estado === 'CANCELADO') {
                actions.innerHTML = `
                    <div class="doc-gen-card doc-gen-card--blocked">
                        <div class="doc-icon"><i data-lucide="ban"></i></div>
                        <div class="doc-info">
                            <h3>Evento cancelado</h3>
                            <p>No se pueden generar documentos para eventos cancelados.</p>
                        </div>
                    </div>`;
                if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
                return;
            }

            actions.innerHTML = entries.map(([tipo, cfg]) => {
                const existe = DocumentosState.documentosActuales.some(doc => doc.docuTipo === tipo);
                const enCurso = DocumentosState.generacionesEnCurso.has(tipo);
                const habilitado = DocumentosPolicy.puedeGenerarTipo(tipo, estado, saldoPendiente) && !enCurso;

                // Prioridad efectiva para este (tipo, estado)
                const priority = DocumentosPolicy.getDocPriority(tipo, estado);
                const icon = DocumentosPolicy.getDocIcon(tipo);
                const reason = DocumentosPolicy.getDisabledReason(tipo, estado, saldoPendiente, existe, enCurso);

                // Clases CSS según estado visual
                let cardClass = 'doc-gen-card';
                let btnClass = 'btn';
                let iconClass = 'doc-icon';

                if (existe) {
                    cardClass += ' doc-gen-card--exists';
                    btnClass += ' btn-secondary';
                    iconClass += ' doc-icon--exists';
                } else if (habilitado) {
                    if (priority === 'exclusive') {
                        cardClass += ' doc-gen-card--exclusive';
                        btnClass += ' btn-primary';
                    } else if (priority === 'primary') {
                        cardClass += ' doc-gen-card--primary';
                        btnClass += ' btn-primary';
                    } else {
                        cardClass += ' doc-gen-card--secondary';
                        btnClass += ' btn-secondary';
                    }
                } else {
                    cardClass += ' doc-gen-card--blocked';
                    btnClass += ' btn-secondary';
                }

                // Texto del botón
                let btnText = 'Generar';
                if (enCurso) btnText = 'Generando...';
                else if (existe) btnText = 'Ya generado';

                return `
                    <div class="${cardClass}">
                        <div class="${iconClass}"><i data-lucide="${icon}"></i></div>
                        <div class="doc-info">
                            <h3>${cfg.titulo}</h3>
                            <p>${existe ? '<span class="doc-exists-badge"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:text-bottom;"></i> Documento generado — podés reenviarlo desde la tabla.</span>' : reason}</p>
                        </div>
                        ${!existe ? `<button class="${btnClass}" ${habilitado && !enCurso ? '' : 'disabled'} onclick="${tipo === 'AVISO_SALDO_PENDIENTE' ? 'generarAvisoSaldoPendiente()' : `generarDocumento('${tipo}')`}" title="${habilitado && !enCurso ? '' : reason.replace(/"/g, '&quot;')}">${btnText}</button>` : ''}
                    </div>`;
            }).join('');
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    // =========================================================================
    //   PAGINACIÓN GLOBAL
    // =========================================================================

    function renderPaginacionGlobal() {
        const container = document.getElementById('paginacion-documentos-global');
        if (DocumentosState.totalPaginasGlobal <= 1) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = `
            <div class="pagination">
                <button class="btn btn-secondary btn-sm" onclick="cargarDocumentosGlobales(${DocumentosState.paginaGlobalActual - 1})" ${DocumentosState.paginaGlobalActual === 0 ? 'disabled' : ''}>Anterior</button>
                <span class="pagination-info">Página ${DocumentosState.paginaGlobalActual + 1} de ${DocumentosState.totalPaginasGlobal}</span>
                <button class="btn btn-secondary btn-sm" onclick="cargarDocumentosGlobales(${DocumentosState.paginaGlobalActual + 1})" ${DocumentosState.paginaGlobalActual >= DocumentosState.totalPaginasGlobal - 1 ? 'disabled' : ''}>Siguiente</button>
            </div>`;
    }

    // =========================================================================
    //   FILTROS GLOBALES — chips y contador
    // =========================================================================

    function actualizarChipsFiltrosGlobales() {
        const container = document.getElementById('active-filters-global');
        if (!container) return;
        const chips = [];
        const estado = DocumentosState.filtrosGlobales.estado;
        const query = DocumentosState.filtrosGlobales.query;

        if (estado !== 'todos') {
            chips.push(`<span class="filter-chip filter-chip--estado"><span>Estado: ${estado}</span><button class="filter-chip-remove" onclick="limpiarFiltroEstadoGlobal()" title="Quitar filtro"><i data-lucide="x"></i></button></span>`);
        }
        if (query) {
            chips.push(`<span class="filter-chip filter-chip--search"><span>"${formatters.textoSeguro(query)}"</span><button class="filter-chip-remove" onclick="limpiarBusquedaGlobal()" title="Quitar búsqueda"><i data-lucide="x"></i></button></span>`);
        }

        if (chips.length > 0) {
            chips.push(`<button class="filter-chip--clear" onclick="limpiarTodosFiltrosGlobales()" style="background:none;border:none;color:var(--neutral-500);font-size:0.75rem;cursor:pointer;text-decoration:underline;">Limpiar todo</button>`);
            container.innerHTML = chips.join('');
            container.classList.remove('hidden');
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
            return;
        }

        container.classList.add('hidden');
        container.innerHTML = '';
    }

    function actualizarResultsCountGlobales() {
        const container = document.getElementById('results-count-global');
        if (!container) return;

        const estado = DocumentosState.filtrosGlobales.estado;
        const query = DocumentosState.filtrosGlobales.query;
        const count = DocumentosState.documentosGlobales.length;

        if (estado !== 'todos' || query) {
            container.innerHTML = `Mostrando <strong>${count}</strong> resultado${count !== 1 ? 's' : ''}`;
            container.classList.remove('hidden');
            return;
        }

        container.classList.add('hidden');
    }

    // =========================================================================
    //   EXPORTS
    // =========================================================================

    window.DocumentosRender = {
        renderSkeleton,
        getBadgeEstadoEnvio,
        renderAccionesDocumento,
        COLUMNAS_DOCS,
        COLUMNAS_DOCS_GLOBAL,
        COLUMNAS_PLANTILLAS,
        actualizarKpisDocumentos,
        // Cola de eventos
        renderColaEventos,
        renderStatsCola,
        cachearStatsDocumentos,
        // Contexto del evento seleccionado
        renderContextoDocumentos,
        renderAccionesEvento,
        // Paginación y filtros globales
        renderPaginacionGlobal,
        actualizarChipsFiltrosGlobales,
        actualizarResultsCountGlobales
    };
})();