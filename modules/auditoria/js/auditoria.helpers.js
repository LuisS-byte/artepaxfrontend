/**
 * modules/auditoria/js/auditoria.helpers.js
 * Helpers puros del módulo Auditoría
 */
window.AuditoriaHelpers = {

    /**
     * Retorna el nombre del usuario dado su ID, o fallback.
     */
    getUserName(usuarioId) {
        if (usuarioId == null) return '—';
        var user = AuditoriaState.usuariosMap[usuarioId];
        return user ? escapeHtml(user) : '#' + usuarioId;
    },

    /**
     * Convierte un nombre de campo camelCase a algo más legible.
     * ej: "estadoEventoNombre" → "Estado evento nombre", "fechaInicio" → "Fecha inicio"
     */
    _beautifyFieldName(key) {
        if (!key) return key;
        // Separar camelCase y snake_case
        var readable = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .trim()
            .toLowerCase();
        // Capitalizar primera letra
        return readable.charAt(0).toUpperCase() + readable.slice(1);
    },

    /**
     * Convierte un valor a string readable para display en diff.
     * Evita mostrar JSON crudo.
     */
    _valDisplay(val, depth) {
        depth = depth || 0;
        if (depth > 2) return '(…)';
        if (val === null || val === undefined) return '<span class="diff-none">—</span>';
        if (typeof val === 'boolean') return val ? '<span class="diff-bool diff-true">Sí</span>' : '<span class="diff-bool diff-false">No</span>';
        if (typeof val === 'number') {
            // IDs pequeños mostrar como #ID
            if (Number.isInteger(val) && val > 0 && val < 10000) return '#' + val;
            // Probable precio/monto
            if (!Number.isInteger(val) || val >= 10000) return '$' + Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return String(val);
        }
        if (typeof val === 'string') {
            // Fechas ISO → formato legible
            if (/^\d{4}-\d{2}-\d{2}(T| )/.test(val)) return formatFechaHora(val);
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return formatFecha(val);
            if (val.length > 60) return escapeHtml(val.slice(0, 60)) + '…';
            return escapeHtml(val);
        }
        if (Array.isArray(val)) {
            if (val.length === 0) return '<span class="diff-none">Vacío</span>';
            if (typeof val[0] !== 'object') return escapeHtml(val.join(', '));
            return '<span class="diff-none">' + val.length + ' elemento(s)</span>';
        }
        if (typeof val === 'object') {
            var keys = Object.keys(val);
            if (keys.length === 0) return '<span class="diff-none">Vacío</span>';
            // Mostrar como mini-lista de campos clave
            var items = keys.slice(0, 4).map(function (k) {
                var v = val[k];
                var display = (v === null || v === undefined) ? '—' :
                    (typeof v === 'object') ? '…' :
                    (typeof v === 'boolean') ? (v ? 'Sí' : 'No') :
                    String(v);
                return '<span class="diff-obj-key">' + escapeHtml(k) + '</span> <span class="diff-obj-val">' + escapeHtml(display) + '</span>';
            });
            if (keys.length > 4) items.push('<span class="diff-obj-more">+ ' + (keys.length - 4) + ' más</span>');
            return '<span class="diff-obj">' + items.join('<span class="diff-obj-sep"> · </span>') + '</span>';
        }
        return escapeHtml(String(val));
    },

    /**
     * Renderiza diff visual entre valorAnterior y valorNuevo.
     * Parsea ambos JSONs y compara campos.
     */
    renderDiff(valorAnterior, valorNuevo) {
        var anterior = valorAnterior ? this._parseJson(valorAnterior) : null;
        var nuevo    = valorNuevo ? this._parseJson(valorNuevo) : null;

        // Caso: ambos vacios
        if (!anterior && !nuevo) {
            return '<div class="diff-empty">Sin cambios registrados</div>';
        }

        // Caso: solo anterior (eliminacion) o solo nuevo (creacion)
        if (!anterior && nuevo) {
            return '<div class="diff-note"><span class="diff-badge diff-badge--new">CREADO</span> Registro nuevo. Revisá el snapshot completo abajo.</div>';
        }
        if (anterior && !nuevo) {
            return '<div class="diff-note"><span class="diff-badge diff-badge--removed">ELIMINADO</span> Registro eliminado. Revisá el snapshot completo abajo.</div>';
        }

        // Ambos existen: comparar campos
        var todasLasKeys = Object.keys(anterior).concat(Object.keys(nuevo))
            .filter(function (k, i, arr) { return arr.indexOf(k) === i; })
            .sort();

        var filasCambiadas = [];
        var filasSinCambio = [];

        todasLasKeys.forEach(function (key) {
            var valAnt = anterior[key];
            var valNue = nuevo[key];
            var strAnt = valAnt !== undefined ? JSON.stringify(valAnt) : undefined;
            var strNue = valNue !== undefined ? JSON.stringify(valNue) : undefined;
            var fieldName = this._beautifyFieldName(key);

            if (strAnt === strNue) {
                filasSinCambio.push([
                    '<tr class="diff-row diff-unchanged">',
                    '<td class="diff-field">', fieldName, '</td>',
                    '<td class="diff-val" colspan="2">', this._valDisplay(valAnt), '</td>',
                    '</tr>'
                ].join(''));
            } else {
                filasCambiadas.push([
                    '<tr class="diff-row diff-changed">',
                    '<td class="diff-field"><span class="diff-change-dot"></span>', fieldName, '</td>',
                    '<td class="diff-val diff-old">', valAnt !== undefined ? this._valDisplay(valAnt) : '<span class="diff-none">—</span>', '</td>',
                    '<td class="diff-val diff-new">', valNue !== undefined ? this._valDisplay(valNue) : '<span class="diff-none">—</span>', '</td>',
                    '</tr>'
                ].join(''));
            }
        }, this);

        // Mostrar primero los cambios, después lo que no cambió (colapsado)
        var html = filasCambiadas.join('');

        if (filasSinCambio.length > 0) {
            html += [
                '<tr class="diff-row diff-collapse-toggle">',
                '<td colspan="3">',
                '<button type="button" class="diff-toggle-btn" onclick="AuditoriaHelpers._toggleUnchanged(this)">',
                'Mostrar ', filasSinCambio.length, ' campo(s) sin cambios',
                '</button>',
                '</td>',
                '</tr>',
                '<tbody class="diff-unchanged-body hidden">',
                filasSinCambio.join(''),
                '</tbody>'
            ].join('');
        }

        if (!filasCambiadas.length && !filasSinCambio.length) {
            return '<div class="diff-empty">Snapshots sin diferencias detectadas</div>';
        }

        return [
            '<table class="diff-table">',
            '<thead><tr><th class="diff-field">Campo</th><th class="diff-old">Anterior</th><th class="diff-new">Nuevo</th></tr></thead>',
            '<tbody>',
            html,
            '</tbody>',
            '</table>'
        ].join('');
    },

    _toggleUnchanged(btn) {
        var body = btn.closest('tr').nextElementSibling;
        if (body && body.classList.contains('diff-unchanged-body')) {
            var hidden = body.classList.toggle('hidden');
            btn.textContent = hidden ? 'Mostrar ' + body.children.length + ' campo(s) sin cambios' : 'Ocultar campos sin cambios';
        }
    },

    /**
     * Parsea un valor que puede ser string JSON, objeto, o null
     */
    _parseJson(valor) {
        if (!valor) return null;
        if (typeof valor === 'object') return valor;
        try {
            return JSON.parse(valor);
        } catch (e) {
            return null;
        }
    },

    /**
     * Formatea un valor JSON para display en el modal de detalle (fallback raw).
     */
    formatJson(valor) {
        if (valor === null || valor === undefined || valor === '') return '(sin valor)';
        var formatted;
        if (typeof valor === 'string') {
            try {
                formatted = JSON.stringify(JSON.parse(valor), null, 2);
            } catch (e) {
                formatted = valor;
            }
        } else if (typeof valor === 'object') {
            formatted = JSON.stringify(valor, null, 2);
        } else {
            formatted = String(valor);
        }
        return escapeHtml(formatted);
    },

    /**
     * Retorna la clase CSS para el badge según la acción de auditoría.
     */
    badgeClase(accion) {
        if (!accion) return 'badge-accion--default';
        var a = accion.toLowerCase();
        if (a.includes('crear') || a.includes('registrar'))              return 'badge-accion--crear';
        if (a.includes('editar') || a.includes('actualizar') || a.includes('update')) return 'badge-accion--actualizar';
        if (a.includes('eliminar') || a.includes('delete'))               return 'badge-accion--eliminar';
        if (a.includes('anular'))    return 'badge-accion--eliminar';
        if (a.includes('cancelar'))  return 'badge-accion--cancelar';
        if (a.includes('confirmar')) return 'badge-accion--confirmar';
        if (a.includes('finalizar')) return 'badge-accion--finalizar';
        return 'badge-accion--default';
    }
};
