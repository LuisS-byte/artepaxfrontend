/**
 * modules/auditoria/js/auditoria.render.js
 * Render layer del módulo Auditoría: tabla, filtro de acciones y modal de detalle
 */
window.AuditoriaRender = {

    /**
     * Renderiza las filas de la tabla de auditoría.
     */
    renderTabla(datos) {
        if (datos.length === 0) {
            modulos.setTableEmpty('tbody-auditoria', 8, 'No se encontraron registros.');
            return;
        }

        var tbody = document.getElementById('tbody-auditoria');
        tbody.innerHTML = datos.map(function (a) {
            var userName = AuditoriaHelpers.getUserName(a.usuarioId);
            return [
                '<tr>',
                '<td class="td-id">#', a.id, '</td>',
                '<td class="td-fecha">', formatFechaHora(a.fecha), '</td>',
                '<td class="td-usuario" title="#', a.usuarioId ?? '', '">', userName, '</td>',
                '<td><span class="badge-accion ', AuditoriaHelpers.badgeClase(a.accion), '">', escapeHtml(a.accion || '—'), '</span></td>',
                '<td><span class="td-tabla">', escapeHtml(a.tablaAfectada || '—'), '</span></td>',
                '<td class="td-id">', a.idRegistro ?? '—', '</td>',
                '<td class="td-desc" title="', escapeHtml(a.descripcion || ''), '">',
                escapeHtml(a.descripcion || '—'),
                '</td>',
                '<td><button class="btn btn-outline btn-sm" onclick="abrirDetalle(', a.id, ')">Ver detalle</button></td>',
                '</tr>'
            ].join('');
        }).join('');
    },

    /**
     * Puebla el select #filter-accion con las acciones disponibles
     * en los datos actualmente cargados.
     */
    poblarFiltroAcciones() {
        var acciones = new Set(AuditoriaState.auditoriaActual.map(function (a) { return a.accion; }).filter(Boolean));
        var sel = document.getElementById('filter-accion');
        if (!sel) return;
        var valorActual = sel.value;
        sel.innerHTML = '<option value="">Todas las acciones</option>';
        acciones.forEach(function (acc) {
            var opt = document.createElement('option');
            opt.value = acc;
            opt.textContent = acc;
            sel.appendChild(opt);
        });
        if (valorActual && acciones.has(valorActual)) sel.value = valorActual;
    },

    /**
     * Renderiza el cuerpo del modal de detalle con diff visual.
     */
    renderDetalle(auditoria) {
        var diffHtml = AuditoriaHelpers.renderDiff(auditoria.valorAnterior, auditoria.valorNuevo);
        var userName = AuditoriaHelpers.getUserName(auditoria.usuarioId);
        var anteriorStr = AuditoriaHelpers.formatJson(auditoria.valorAnterior);
        var nuevoStr    = AuditoriaHelpers.formatJson(auditoria.valorNuevo);

        document.getElementById('modal-detalle-body').innerHTML = [
            '<div class="audit-detail-grid">',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">ID registro</div>',
            '<div class="audit-detail-value">', auditoria.id, '</div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Fecha</div>',
            '<div class="audit-detail-value">', formatFechaHora(auditoria.fecha), '</div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Usuario</div>',
            '<div class="audit-detail-value">', userName, '</div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Acción</div>',
            '<div class="audit-detail-value"><span class="badge-accion ', AuditoriaHelpers.badgeClase(auditoria.accion), '">', escapeHtml(auditoria.accion || '—'), '</span></div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Tabla afectada</div>',
            '<div class="audit-detail-value"><span class="td-tabla">', escapeHtml(auditoria.tablaAfectada || '—'), '</span></div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">ID del registro</div>',
            '<div class="audit-detail-value">', auditoria.idRegistro ?? '—', '</div>',
            '</div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Descripción</div>',
            '<div class="audit-detail-value">', escapeHtml(auditoria.descripcion || '—'), '</div>',
            '</div>',
            '<hr class="audit-divider">',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Cambios detectados</div>',
            diffHtml,
            '</div>',
            '<hr class="audit-divider">',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Valor anterior (crudo)</div>',
            '<div class="audit-json-block ', anteriorStr === '(sin valor)' ? 'empty' : '', '">', anteriorStr, '</div>',
            '</div>',
            '<div class="audit-detail-section">',
            '<div class="audit-detail-label">Valor nuevo (crudo)</div>',
            '<div class="audit-json-block ', nuevoStr === '(sin valor)' ? 'empty' : '', '">', nuevoStr, '</div>',
            '</div>'
        ].join('');
    }
};
