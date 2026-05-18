/**
 * modules/cronograma/js/cronograma.drawer-personal.js
 * Apertura, cierre, resumen y listado del drawer de personal del Cronograma.
 * Incluye autocomplete de usuarios con caché.
 */

var _usuariosCache = null;
var _usuarioAutocompleteCtrl = null;

function _cargarUsuarios() {
    if (_usuariosCache) return Promise.resolve(_usuariosCache);
    return API.usuarios.list().then(function (usuarios) {
        _usuariosCache = Array.isArray(usuarios) ? usuarios : [];
        return _usuariosCache;
    });
}

function _initAutocompleteUsuario() {
    var input = document.getElementById('autocomplete-usuario-input');
    var results = document.getElementById('autocomplete-usuario-results');
    var clear = document.getElementById('autocomplete-usuario-clear');
    var hidden = document.getElementById('select-usuario-id');
    var activeIdx = -1;

    function getFiltered() {
        var q = (input.value || '').trim().toLowerCase();
        if (!_usuariosCache) return [];
        if (!q) return _usuariosCache.slice(0, 50);
        return _usuariosCache.filter(function (u) {
            var name = (u.nombre || '').toLowerCase();
            var email = (u.email || '').toLowerCase();
            return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
        }).slice(0, 50);
    }

    function renderResults() {
        var items = getFiltered();
        activeIdx = -1;
        if (!items.length) {
            results.innerHTML = '<div class="autocomplete-empty">Sin resultados</div>';
            results.classList.remove('hidden');
            return;
        }
        results.innerHTML = items.map(function (item, i) {
            var name = formatters.textoSeguro(item.nombre || '');
            var meta = item.email ? formatters.textoSeguro(item.email) : 'ID ' + item.id;
            return '<button type="button" class="autocomplete-result" data-index="' + i + '" data-value="' + item.id + '">' +
                '<span class="autocomplete-result-name">' + name + '</span>' +
                '<span class="autocomplete-result-meta">' + meta + '</span>' +
                '</button>';
        }).join('');
        results.classList.remove('hidden');
        input.setAttribute('aria-expanded', 'true');
    }

    function selectItem(value) {
        if (!_usuariosCache) return;
        var item = _usuariosCache.find(function (u) { return String(u.id) === String(value); });
        if (!item) return;
        input.value = item.nombre || ('Usuario #' + item.id);
        hidden.value = String(item.id);
        clear.classList.remove('hidden');
        results.classList.add('hidden');
        input.setAttribute('aria-expanded', 'false');
    }

    function clearSelection() {
        input.value = '';
        hidden.value = '';
        clear.classList.add('hidden');
        results.classList.add('hidden');
        input.setAttribute('aria-expanded', 'false');
        activeIdx = -1;
    }

    input.addEventListener('input', function () {
        renderResults();
        if (hidden.value) {
            hidden.value = '';
            clear.classList.add('hidden');
        }
    });

    input.addEventListener('focus', function () {
        if (_usuariosCache && _usuariosCache.length > 0) renderResults();
    });

    input.addEventListener('blur', function () {
        setTimeout(function () { results.classList.add('hidden'); input.setAttribute('aria-expanded', 'false'); }, 150);
    });

    input.addEventListener('keydown', function (e) {
        var items = results.querySelectorAll('.autocomplete-result');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = Math.min(activeIdx + 1, items.length - 1);
            items.forEach(function (el, i) { el.classList.toggle('autocomplete-result--active', i === activeIdx); });
            if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = Math.max(activeIdx - 1, -1);
            items.forEach(function (el, i) { el.classList.toggle('autocomplete-result--active', i === activeIdx); });
            if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
            return;
        }
        if (e.key === 'Enter' && activeIdx >= 0 && items[activeIdx]) {
            e.preventDefault();
            selectItem(items[activeIdx].dataset.value);
            return;
        }
        if (e.key === 'Escape') {
            results.classList.add('hidden');
            input.setAttribute('aria-expanded', 'false');
        }
    });

    results.addEventListener('mousedown', function (e) {
        var btn = e.target.closest('.autocomplete-result');
        if (btn) selectItem(btn.dataset.value);
    });

    if (clear) {
        clear.addEventListener('click', function () { clearSelection(); input.focus(); });
    }

    return { clear: clearSelection, select: selectItem };
}

window.CronogramaDrawerPersonal = {
    async abrirDrawerPersonal(cronogramaId) {
        ocultarAlertaId('drawer-personal-alert');
        document.getElementById('form-personal').reset();
        // Limpiar autocomplete
        if (_usuarioAutocompleteCtrl) _usuarioAutocompleteCtrl.clear();

        try {
            const actividad = await API.cronogramas.get(cronogramaId);
            CronogramaState.set({ cronogramaPersonalActual: actividad });
            this.renderResumenPersonal();
            modulos.abrirModal('drawer-personal-overlay');
            await this.cargarPersonalAsignado();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (err) {
            mostrarAlerta('error', 'No se pudo abrir la asignacion de personal: ' + err.message);
        }
    },

    renderResumenPersonal() {
        const pa = CronogramaState.get().cronogramaPersonalActual;
        const container = document.getElementById('personal-cronograma-resumen');
        if (!pa) {
            container.innerHTML = '';
            return;
        }

        const bloqueada = ESTADOS_FINALES.includes(pa.cronoEstado);
        const estados = getEstadosSiguientes(pa).join(', ') || 'Sin transiciones';
        container.innerHTML = `
            <div class="drawer-summary-grid">
                <div class="drawer-summary-main">
                    <span class="summary-eyebrow">Actividad actual</span>
                    <h3>${formatters.textoSeguro(pa.actividad || `Actividad #${pa.id}`)}</h3>
                    <p>${modulos.formatearFecha(pa.fechaInicio)} - ${modulos.formatearFecha(pa.fechaFin)}</p>
                </div>
                <div class="drawer-summary-stat">
                    <span>Estado</span>
                    <strong>${formatters.textoSeguro(pa.cronoEstado || '-')}</strong>
                </div>
                <div class="drawer-summary-stat">
                    <span>Transiciones</span>
                    <strong>${formatters.textoSeguro(estados)}</strong>
                </div>
            </div>
            <div class="policy-banner ${bloqueada ? '' : 'is-ok'}" style="margin-top:16px; margin-bottom:0;">
                <i data-lucide="users"></i>
                <div>
                    <strong>${bloqueada ? 'Asignacion bloqueada' : 'Asignacion habilitada'}</strong>
                    <p>${bloqueada ? 'Esta actividad ya quedó cerrada y no admite nuevos cambios de personal.' : 'Podés sumar o ajustar personal mientras la actividad siga activa.'}</p>
                </div>
            </div>`;

        const disabled = bloqueada;
        document.getElementById('autocomplete-usuario-input').disabled = disabled;
        document.getElementById('input-pago-asignado').disabled = disabled;
        document.getElementById('input-pago-tipo').disabled = disabled;
        document.getElementById('btn-asignar-personal').disabled = disabled;
    },

    cerrarDrawerPersonal(e) {
        if (e && e.target.id !== 'drawer-personal-overlay') return;
        modulos.cerrarModal('drawer-personal-overlay');
        CronogramaState.resetPersonalDrawer();
    },

    async cargarPersonalAsignado() {
        const pa = CronogramaState.get().cronogramaPersonalActual;
        const lista = document.getElementById('lista-personal-asignado');
        if (!pa) {
            lista.innerHTML = '<div class="personal-empty">Selecciona una actividad.</div>';
            return;
        }

        lista.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';

        try {
            const asignados = await API.cronogramas.listarUsuarios(pa.id);
            const resumen = getPersonalSummary(asignados);

            if (!asignados || asignados.length === 0) {
                lista.innerHTML = '<div class="personal-empty">No hay personal asignado todavia.</div>';
                return;
            }

            lista.innerHTML = `
                <div class="personal-empty" style="background:rgba(21,101,192,0.06); border-style:solid; border-color:rgba(21,101,192,0.12); color:var(--neutral-700);">
                    <strong>${resumen.cantidad}</strong> persona(s) asignada(s) · costo estimado <strong>${formatCurrency(resumen.totalCosto)}</strong>
                </div>
                ${asignados.map(item => `
                    <div class="personal-item">
                        <div class="personal-info">
                            <span class="personal-nombre">${formatters.textoSeguro(item.usuarioNombre || `Usuario #${item.usuarioId}`)}</span>
                            <span class="personal-meta">Usuario #${item.usuarioId}</span>
                            <div class="personal-costos">
                                <span class="personal-cost-chip">${formatCurrency(item.pagoAsignado)}</span>
                                <span class="personal-cost-chip secondary">${item.pagoTipo === 'POR_HORA' ? 'Por hora' : 'Pago fijo'}</span>
                            </div>
                        </div>
                        <button class="action-chip action-chip--danger" data-action="quitarPersonal" data-usuario-id="${item.usuarioId}" data-usuario-nombre="${escapeStr(item.usuarioNombre || `Usuario #${item.usuarioId}`)}" ${ESTADOS_FINALES.includes(pa.cronoEstado) ? 'disabled' : ''}>
                            <i data-lucide="user-minus"></i>
                            Quitar
                        </button>
                    </div>`).join('')}`;

            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (err) {
            lista.innerHTML = `<div class="personal-empty">${formatters.textoSeguro(err.message || 'No se pudo cargar el personal asignado.')}</div>`;
        }
    },

    async asignarPersonal(e) {
        e.preventDefault();
        const pa = CronogramaState.get().cronogramaPersonalActual;
        if (!pa) return;
        if (ESTADOS_FINALES.includes(pa.cronoEstado)) {
            return mostrarAlertaId('drawer-personal-alert', 'warning', 'No se puede asignar personal a una actividad finalizada o cancelada.');
        }

        const usuarioId = Number(document.getElementById('select-usuario-id').value);
        const pagoAsignado = Number(document.getElementById('input-pago-asignado').value);
        const pagoTipo = document.getElementById('input-pago-tipo').value;

        if (!usuarioId || usuarioId < 1) {
            return mostrarAlertaId('drawer-personal-alert', 'error', 'Seleccioná un usuario de la lista.');
        }
        if (Number.isNaN(pagoAsignado) || pagoAsignado <= 0) {
            return mostrarAlertaId('drawer-personal-alert', 'error', 'El pago asignado debe ser mayor a cero.');
        }
        if (!['FIJO', 'POR_HORA'].includes(pagoTipo)) {
            return mostrarAlertaId('drawer-personal-alert', 'error', 'Seleccioná un tipo de pago válido.');
        }

        const submitBtn = document.getElementById('btn-asignar-personal');
        submitBtn.disabled = true;

        try {
            const body = buildAsignarUsuarioPayload({ usuarioId, pagoAsignado, pagoTipo });
            await API.cronogramas.asignarUsuario(pa.id, body);
            mostrarAlertaId('drawer-personal-alert', 'success', 'Asignación guardada correctamente.');
            document.getElementById('form-personal').reset();
            if (_usuarioAutocompleteCtrl) _usuarioAutocompleteCtrl.clear();
            await this.cargarPersonalAsignado();
        } catch (err) {
            mostrarAlertaId('drawer-personal-alert', 'error', err.message || 'No se pudo guardar la asignación.');
        } finally {
            submitBtn.disabled = false;
        }
    },

    // Inicializa el autocomplete de usuarios (llamar una vez al cargar el módulo)
    init() {
        _cargarUsuarios().then(function () {
            _usuarioAutocompleteCtrl = _initAutocompleteUsuario();
        }).catch(function () {
            console.warn('No se pudieron cargar los usuarios para el autocomplete.');
        });
    }
};
