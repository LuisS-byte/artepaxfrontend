/**
 * modules/auditoria/js/auditoria.actions.js
 * Acciones del módulo Auditoría: carga, filtros, modal e init
 */
window.AuditoriaActions = {

    // ── USUARIOS ────────────────────────────────────────────

    _cargarUsuariosPromise: null,

    _cargarUsuarios() {
        if (this._cargarUsuariosPromise) return this._cargarUsuariosPromise;
        this._cargarUsuariosPromise = API.usuarios.list().then(function (usuarios) {
            var lista = Array.isArray(usuarios) ? usuarios : (Array.isArray(usuarios?.content) ? usuarios.content : []);
            AuditoriaState.usuarios = lista;
            var map = {};
            lista.forEach(function (u) { map[u.id] = u.nombre; });
            AuditoriaState.usuariosMap = map;
        }).catch(function () {
            // Silencioso — si falla, se muestra solo el ID
        });
        return this._cargarUsuariosPromise;
    },

    // ── CARGA ──────────────────────────────────────────────

    async cargarAuditoria(pagina) {
        pagina = pagina !== undefined ? pagina : AuditoriaState.paginaActual;
        var tabla = document.getElementById('filter-tabla').value;
        var registroInput = document.getElementById('input-registro-id');
        var registroId = registroInput ? registroInput.value.trim() : '';
        var tamanio = parseInt(document.getElementById('select-tamanio').value, 10);

        AuditoriaState.paginaActual = pagina;
        modulos.setTableLoading('tbody-auditoria', 8, 'Cargando registros de auditoría...');

        try {
            AuditoriaState.auditoriaActual = await AuditoriaAPI.cargarAuditoria({
                tabla: tabla,
                registroId: registroId,
                pagina: pagina,
                tamanio: tamanio
            });

            AuditoriaRender.poblarFiltroAcciones();
            this.filtrarLocal();

            // Paginación (fuera del catch principal para no ocultar errores reales)
            var cont = document.getElementById('paginacion-auditoria');
            if (!tabla && !registroId) {
                this._renderPaginacion(pagina, cont, tamanio);
            } else {
                if (cont) cont.innerHTML = '';
            }
        } catch (err) {
            modulos.setTableError('tbody-auditoria', 8, 'Error al cargar registros de auditoría.');
            mostrarAlerta('error', 'Error al cargar auditoría: ' + (err.message || 'desconocido'));
        }
    },

    async _renderPaginacion(pagina, cont, tamanio) {
        var haySiguiente = false;
        try {
            var nextPage = await AuditoriaAPI.cargarAuditoria({
                pagina: pagina + 1,
                tamanio: 1
            });
            haySiguiente = nextPage && nextPage.length > 0;
        } catch (e) {
            haySiguiente = false;
        }

        modulos.renderPaginacion({
            containerId: 'paginacion-auditoria',
            page: pagina,
            totalPages: haySiguiente ? pagina + 2 : pagina + 1,
            totalElements: null,
            onPageChange: function (p) { AuditoriaActions.cargarAuditoria(p); }
        });

        if (!haySiguiente) {
            var btnSig = cont ? cont.querySelector('[data-page="' + (pagina + 1) + '"]') : null;
            if (btnSig) btnSig.disabled = true;
        }
    },

    // ── FILTROS ────────────────────────────────────────────

    onFiltroTablaChange() {
        var tabla = document.getElementById('filter-tabla').value;
        var grupoRegistro = document.getElementById('grupo-registro');
        var inputRegistro = document.getElementById('input-registro-id');

        if (tabla) {
            grupoRegistro.style.display = '';
        } else {
            grupoRegistro.style.display = 'none';
            if (inputRegistro) inputRegistro.value = '';
        }

        AuditoriaState.paginaActual = 0;
        this.cargarAuditoria(0);
    },

    onFiltroRegistroChange() {
        clearTimeout(AuditoriaState.registroDebounce);
        AuditoriaState.registroDebounce = setTimeout(function () {
            AuditoriaState.paginaActual = 0;
            AuditoriaActions.cargarAuditoria(0);
        }, 500);
    },

    onFechaChange() {
        AuditoriaState.fechaDesde = document.getElementById('filter-fecha-desde').value;
        AuditoriaState.fechaHasta = document.getElementById('filter-fecha-hasta').value;
        this.filtrarLocal();
    },

    filtrarLocal() {
        var q = (document.getElementById('search-audit')?.value || '').toLowerCase();
        var accion = document.getElementById('filter-accion')?.value || '';

        var filtrados = AuditoriaState.auditoriaActual.filter(function (a) {
            // Búsqueda textual
            var desc = (a.descripcion || '').toLowerCase();
            var usuario = String(a.usuarioId ?? '');
            var matchQ = !q || desc.includes(q) || usuario.includes(q);

            // Acción
            var matchA = !accion || a.accion === accion;

            // Fecha
            var matchFecha = true;
            if (AuditoriaState.fechaDesde && a.fecha) {
                matchFecha = matchFecha && a.fecha >= AuditoriaState.fechaDesde;
            }
            if (AuditoriaState.fechaHasta && a.fecha) {
                matchFecha = matchFecha && a.fecha <= AuditoriaState.fechaHasta + 'T23:59:59';
            }

            return matchQ && matchA && matchFecha;
        });

        AuditoriaRender.renderTabla(filtrados);
    },

    // ── MODAL DETALLE ──────────────────────────────────────

    abrirDetalle(id) {
        var a = AuditoriaState.auditoriaActual.find(function (x) { return x.id === id; });
        if (!a) return;

        AuditoriaRender.renderDetalle(a);
        modulos.abrirModal('modal-detalle-overlay');
    },

    cerrarModalDetalle(e) {
        if (e && e.target.id !== 'modal-detalle-overlay') return;
        modulos.cerrarModal('modal-detalle-overlay');
    },

    // ── CSV ────────────────────────────────────────────────

    exportarCSV() {
        var visible = document.querySelectorAll('#tbody-auditoria tr');
        if (!visible.length) {
            mostrarAlerta('warning', 'No hay datos visibles para exportar.');
            return;
        }

        var rows = [
            ['ID', 'Fecha', 'Usuario', 'Acción', 'Tabla', 'ID Registro', 'Descripción']
        ];

        AuditoriaState.auditoriaActual.forEach(function (a) {
            var userName = AuditoriaHelpers.getUserName(a.usuarioId);
            rows.push([
                a.id,
                formatFechaHora(a.fecha),
                userName,
                a.accion || '',
                a.tablaAfectada || '',
                a.idRegistro ?? '',
                (a.descripcion || '').replace(/"/g, '""')
            ]);
        });

        var csv = rows.map(function (row) {
            return row.map(function (cell) {
                return '"' + String(cell).replace(/"/g, '""') + '"';
            }).join(',');
        }).join('\n');

        // BOM para que Excel reconozca UTF-8
        var bom = '\uFEFF';
        var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'auditoria_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // ── INIT ───────────────────────────────────────────────

    init() {
        this._cargarUsuarios();
        this.cargarAuditoria();
    }
};
