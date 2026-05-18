/**
 * modules/inventario/js/inventario.helpers.js
 * Helpers puros del módulo Inventario.
 * No dependen de estado, no llaman API, no tocan DOM.
 * Todas son funciones globales (window.*) por compatibilidad con onclick/onchange en HTML.
 */

/* ------------------------------------------------------------------ */
/*  Evento / Movimiento helpers                                       */
/* ------------------------------------------------------------------ */

function getEventoMovimientoInfo(row) {
    const eventoId = row.eventoId ?? row.idEvento ?? null;
    const eventoNombre = (row.eventoNombre || '').trim();

    if (!eventoId && !eventoNombre) {
        return {
            label: 'Sin evento vinculado',
            detail: 'Movimiento manual o sin contexto de evento',
            cta: ''
        };
    }

    return {
        label: eventoNombre || `Evento #${eventoId}`,
        detail: eventoId ? `Evento #${eventoId}` : 'Sin ID disponible',
        cta: eventoId
            ? `<button class="action-chip action-chip--link action-chip--xs" onclick="irADetalleEvento(${eventoId})">
                    <i data-lucide="external-link"></i>
                    Ver evento
               </button>`
            : ''
    };
}

/* ------------------------------------------------------------------ */
/*  Origen / Badge helpers                                            */
/* ------------------------------------------------------------------ */

function getOrigenBadge(origen) {
    const value = (origen || '').trim().toUpperCase();
    const badges = {
        REPOSICION: { clase: 'origin-badge origin-badge--success', label: 'Reposición' },
        AJUSTE_MANUAL: { clase: 'origin-badge origin-badge--info', label: 'Ajuste manual' },
        'DAÑO': { clase: 'origin-badge origin-badge--danger', label: 'Daño' },
        PERDIDA: { clase: 'origin-badge origin-badge--warning', label: 'Pérdida' },
        EVENTO: { clase: 'origin-badge origin-badge--accent', label: 'Evento' }
    };

    const badge = badges[value] || { clase: 'origin-badge', label: origen || 'Sin origen' };
    return `<span class="${badge.clase}">${badge.label}</span>`;
}

function getMotivoFallback(row) {
    const origen = (row.tipoOrigen || '').trim().toUpperCase();
    const tipo = (row.tipoMovimiento || '').trim().toUpperCase();

    if (origen === 'REPOSICION') return 'Ingreso por reposición de stock.';
    if (origen === 'AJUSTE_MANUAL' && tipo === 'ENTRADA') return 'Ajuste positivo por conteo físico.';
    if (origen === 'AJUSTE_MANUAL' && tipo === 'SALIDA') return 'Ajuste negativo por conteo físico.';
    if (origen === 'DAÑO') return 'Salida registrada por productos dañados.';
    if (origen === 'PERDIDA') return 'Salida registrada por pérdida de inventario.';
    if (origen === 'EVENTO') return 'Consumo asociado a un evento.';
    return 'Sin observación adicional.';
}

function getBadgeEstadoProducto(estado) {
    return modulos.badgeEstado(estado || 'ACTIVO', {
        ACTIVO: { clase: 'badge-confirmado', label: 'Activo' },
        INACTIVO: { clase: 'badge-cancelado', label: 'Inactivo' }
    });
}

/* ------------------------------------------------------------------ */
/*  Render helpers (retornan strings HTML, no tocan DOM)              */
/* ------------------------------------------------------------------ */

function renderMotivoCell(row) {
    const motivo = (row.motivo || '').trim();
    const texto = motivo || getMotivoFallback(row);
    const safeText = formatters.textoSeguro(texto);
    const safeTitle = formatters.textoSeguro(motivo || texto);

    return `
        <td>
            <div class="motivo-stack">
                ${getOrigenBadge(row.tipoOrigen)}
                <span class="motivo-copy${motivo ? '' : ' is-muted'}" title="${safeTitle}">${safeText}</span>
            </div>
        </td>`;
}

function renderFilterChip(label, onClick) {
    return `<span class="filter-chip">
        ${label}
        <button class="filter-chip-remove" onclick="${onClick}" aria-label="Quitar filtro">&times;</button>
    </span>`;
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                      */
/* ------------------------------------------------------------------ */

function toComparableDate(value, isEndOfDay) {
    isEndOfDay = isEndOfDay || false;
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return new Date(`${raw}T${isEndOfDay ? '23:59:59' : '00:00:00'}`);
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
