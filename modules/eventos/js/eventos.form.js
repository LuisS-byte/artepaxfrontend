(function () {
    const { esEdicionParcialEvento } = window.EventosPermissions;
    const state = window.EventosState.getState();
    const validators = window.EventosValidators;
    const payloadBuilder = window.EventosPayload;

    // ── Step state (local, no contamina EventosState) ─────
    var _stepActual = 1;
    var _debounceDisponibilidad = null;
    var _ultimaDisponibilidadOk = null; // null = no checkeado, true/false

    // ── Helpers ────────────────────────────────────────────

    function getCamposBloqueables() {
        return ['select-cliente', 'select-decoracion', 'input-fecha', 'input-hora-inicio', 'input-hora-fin'];
    }

    function resetDrawerVisualState() {
        const tipoEventoGroup = document.getElementById('select-tipo-evento').closest('.form-group');
        if (tipoEventoGroup) tipoEventoGroup.classList.remove('hidden');

        getCamposBloqueables().forEach(function (id) {
            const el = document.getElementById(id);
            if (el) { el.disabled = false; el.title = ''; }
        });
    }

    // ── Step navigation ────────────────────────────────────

    function cambiarPaso(n) {
        _stepActual = n;
        _ultimaDisponibilidadOk = null;

        // Steps indicator
        document.querySelectorAll('.evento-step').forEach(function (step) {
            var s = parseInt(step.dataset.step, 10);
            step.classList.toggle('active', s === n);
            step.classList.toggle('completed', s < n);
        });

        // Step content
        document.querySelectorAll('.evento-step-content').forEach(function (content) {
            content.classList.toggle('hidden', parseInt(content.dataset.step, 10) !== n);
        });

        // Footer buttons
        var btnAtras = document.getElementById('btn-evento-atras');
        var btnCancelar = document.getElementById('btn-evento-cancelar');
        var btnSiguiente = document.getElementById('btn-evento-siguiente');
        var btnGuardar = document.getElementById('btn-guardar-evento');

        if (n === 1) {
            btnAtras.hidden = true;
            btnCancelar.hidden = false;
            btnSiguiente.hidden = false;
            btnGuardar.classList.add('hidden');
        } else if (n === 2) {
            btnAtras.hidden = false;
            btnCancelar.hidden = false;
            btnSiguiente.hidden = false;
            btnGuardar.classList.add('hidden');
        } else {
            btnAtras.hidden = false;
            btnCancelar.hidden = false;
            btnSiguiente.classList.add('hidden');
            btnGuardar.classList.remove('hidden');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Auto-focus en el primer campo del paso
        if (n === 1) {
            var cliente = document.getElementById('select-cliente');
            if (cliente) setTimeout(function () { cliente.focus(); }, 100);
        } else if (n === 2) {
            var fecha = document.getElementById('input-fecha');
            if (fecha) setTimeout(function () { fecha.focus(); fecha.select(); }, 100);
        } else if (n === 3) {
            var nota = document.getElementById('input-nota');
            if (nota) setTimeout(function () { nota.focus(); }, 100);
        }
    }

    function eventoSiguientePaso() {
        if (_stepActual === 1) {
            if (!_validarPaso1()) return;
            cambiarPaso(2);
            // Trigger disponibilidad preview si ya hay datos de agenda
            _checkDisponibilidadPreview();
            return;
        }
        if (_stepActual === 2) {
            if (!_validarPaso2()) return;
            // Build resumen for step 3
            _buildResumen();
            cambiarPaso(3);
            return;
        }
    }

    function eventoStepAnterior() {
        if (_stepActual > 1) cambiarPaso(_stepActual - 1);
    }

    // ── Step validators ────────────────────────────────────

    function _validarPaso1() {
        validators.clearFieldErrors();
        var ok = true;

        if (!parseInt(document.getElementById('select-cliente').value, 10)) {
            validators.showFieldError('select-cliente', 'Seleccioná un cliente.');
            ok = false;
        }
        if (!parseInt(document.getElementById('select-decoracion').value, 10)) {
            validators.showFieldError('select-decoracion', 'Seleccioná una decoración.');
            ok = false;
        }
        if (!parseInt(document.getElementById('select-tipo-evento').value, 10)) {
            validators.showFieldError('select-tipo-evento', 'Seleccioná un tipo de evento.');
            ok = false;
        }

        if (!ok) {
            document.querySelector('.evento-step-content[data-step="1"]')?.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return ok;
    }

    function _validarPaso2() {
        validators.clearFieldErrors();
        var ok = true;
        var fecha = document.getElementById('input-fecha').value;
        var horaInicio = document.getElementById('input-hora-inicio').value || null;
        var horaFin = document.getElementById('input-hora-fin').value || null;

        if (!fecha) {
            validators.showFieldError('input-fecha', 'La fecha es obligatoria.');
            ok = false;
        }
        if ((horaInicio && !horaFin) || (!horaInicio && horaFin)) {
            validators.showFieldError('input-hora-inicio', 'Ambas horas deben completarse juntas.');
            validators.showFieldError('input-hora-fin', 'Ambas horas deben completarse juntas.');
            ok = false;
        }
        if (horaInicio && horaFin && horaFin <= horaInicio) {
            validators.showFieldError('input-hora-inicio', 'Debe ser anterior a la hora de fin.');
            validators.showFieldError('input-hora-fin', 'Debe ser posterior a la hora de inicio.');
            ok = false;
        }

        // Si hay disponibilidad checkeada y es false, bloquear
        if (ok && _ultimaDisponibilidadOk === false) {
            mostrarAlertaId('drawer-alert-evento', 'error', 'Ya existe un evento en esa fecha, hora y ubicación. Ajustá la fecha, el horario o la ubicación.');
            ok = false;
        }

        if (!ok) {
            document.querySelector('.evento-step-content[data-step="2"]')?.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return ok;
    }

    // ── Disponibilidad preview (en vivo, paso 2) ──────────

    function _checkDisponibilidadPreview() {
        var fecha = document.getElementById('input-fecha').value;
        var horaInicio = document.getElementById('input-hora-inicio').value || null;
        var horaFin = document.getElementById('input-hora-fin').value || null;
        var ubicacion = document.getElementById('input-ubicacion').value.trim() || null;

        var preview = document.getElementById('disponibilidad-preview');
        if (!preview) return;

        // Sin datos suficientes — ocultar preview
        if (!fecha || !horaInicio || !horaFin || !ubicacion) {
            preview.classList.add('hidden');
            _ultimaDisponibilidadOk = null;
            return;
        }

        // Mostrar estado "checking"
        preview.className = 'disponibilidad-card is-checking';
        preview.classList.remove('hidden');
        document.getElementById('disponibilidad-texto').textContent = 'Verificando disponibilidad...';
        document.getElementById('disponibilidad-detalle').textContent = '';
        document.getElementById('disponibilidad-icon').innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div>';

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Debounce
        if (_debounceDisponibilidad) clearTimeout(_debounceDisponibilidad);
        _debounceDisponibilidad = setTimeout(function () {
            _ejecutarChequeoDisponibilidad(fecha, horaInicio, horaFin, ubicacion);
        }, 400);
    }

    async function _ejecutarChequeoDisponibilidad(fecha, horaInicio, horaFin, ubicacion) {
        try {
            var params = { fecha: fecha, horaInicio: horaInicio, horaFin: horaFin, ubicacion: ubicacion };
            if (state.eventoEditandoId) params.eventoIdExcluir = state.eventoEditandoId;

            var disponible = await API.eventos.disponibilidad(params);
            _ultimaDisponibilidadOk = disponible;

            var preview = document.getElementById('disponibilidad-preview');
            var icon = document.getElementById('disponibilidad-icon');
            var texto = document.getElementById('disponibilidad-texto');
            var detalle = document.getElementById('disponibilidad-detalle');

            if (disponible) {
                preview.className = 'disponibilidad-card is-available';
                icon.innerHTML = '<i data-lucide="check-circle"></i>';
                texto.textContent = 'Fecha y horario disponibles';
                detalle.textContent = 'No hay eventos que choquen en esa fecha y horario.';
            } else {
                preview.className = 'disponibilidad-card is-unavailable';
                icon.innerHTML = '<i data-lucide="alert-circle"></i>';
                texto.textContent = 'Conflicto de horario';
                detalle.textContent = 'Ya existe un evento en esa fecha y horario. Ajustá la fecha, el horario o la ubicación.';
                validators.marcarCamposConflicto();
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (_) {
            // Silently fail — no bloquear al usuario por error de red en preview
            _ultimaDisponibilidadOk = null;
            var preview = document.getElementById('disponibilidad-preview');
            if (preview) preview.classList.add('hidden');
        }
    }

    // ── Resumen (paso 3) ────────────────────────────────────

    function _buildResumen() {
        var container = document.getElementById('evento-resumen-container');
        if (!container) return;

        var cliente = document.getElementById('select-cliente');
        var decoracion = document.getElementById('select-decoracion');
        var tipoEvento = document.getElementById('select-tipo-evento');
        var fecha = document.getElementById('input-fecha').value;
        var horaInicio = document.getElementById('input-hora-inicio').value || '—';
        var horaFin = document.getElementById('input-hora-fin').value || '—';
        var ubicacion = document.getElementById('input-ubicacion').value.trim() || '—';

        var clienteLabel = cliente ? cliente.options[cliente.selectedIndex]?.text || '—' : '—';
        var decoracionLabel = decoracion ? decoracion.options[decoracion.selectedIndex]?.text || '—' : '—';
        var tipoLabel = tipoEvento ? tipoEvento.options[tipoEvento.selectedIndex]?.text || '—' : '—';

        // Precio desde la decoración seleccionada
        var decoId = parseInt(decoracion?.value, 10);
        var decoData = (state.decoracionesDisponibles || []).find(function (d) { return d.id === decoId; });
        var precioLabel = decoData
            ? '<strong>$' + (typeof formatters !== 'undefined' && formatters.precio ? formatters.precio(decoData.precio || 0) : (decoData.precio || 0).toFixed(2)) + '</strong>'
            : '—';

        var estadoBadge = _ultimaDisponibilidadOk === false
            ? '<span class="evento-resumen-badge is-warning">Conflicto de horario</span>'
            : '<span class="evento-resumen-badge">Disponibilidad verificada</span>';

        container.innerHTML =
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Cliente</span>' +
                '<span class="evento-resumen-value">' + formatters.textoSeguro(clienteLabel) + '</span>' +
            '</div>' +
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Decoración</span>' +
                '<span class="evento-resumen-value">' + formatters.textoSeguro(decoracionLabel) + '</span>' +
            '</div>' +
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Precio</span>' +
                '<span class="evento-resumen-value">' + precioLabel + '</span>' +
            '</div>' +
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Tipo</span>' +
                '<span class="evento-resumen-value">' + formatters.textoSeguro(tipoLabel) + '</span>' +
            '</div>' +
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Fecha</span>' +
                '<span class="evento-resumen-value">' + formatters.textoSeguro(fecha) + ' · ' + formatters.textoSeguro(horaInicio) + ' - ' + formatters.textoSeguro(horaFin) + '</span>' +
            '</div>' +
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Ubicación</span>' +
                '<span class="evento-resumen-value">' + formatters.textoSeguro(ubicacion) + '</span>' +
            '</div>' +
            '<div class="evento-resumen-row">' +
                '<span class="evento-resumen-label">Disponibilidad</span>' +
                '<span class="evento-resumen-value">' + estadoBadge + '</span>' +
            '</div>';
    }

    // ── Drawer open / close ─────────────────────────────────

    async function abrirDrawerCrear(deps) {
        state.eventoEditandoId = null;
        document.getElementById('drawer-titulo-evento').textContent = 'Nueva Cotización';
        document.getElementById('btn-guardar-evento').textContent = 'Guardar Cotización';
        modulos.limpiarForm(['input-fecha', 'input-hora-inicio', 'input-hora-fin', 'input-ubicacion', 'input-nota']);
        ocultarAlertaId('drawer-alert-evento');
        validators.clearFieldErrors();
        resetDrawerVisualState();

        await deps.cargarOpcionesFormularioEvento();
        document.getElementById('select-cliente').value = '';
        document.getElementById('select-decoracion').value = '';
        document.getElementById('select-tipo-evento').value = '';
        state.formularioModificado = false;

        // Limpiar inputs de autocomplete
        var tipoInput = document.getElementById('autocomplete-tipo-evento-input');
        if (tipoInput) tipoInput.value = '';
        var decoInput = document.getElementById('autocomplete-decoracion-input');
        if (decoInput) decoInput.value = '';

        // Limpiar decoraciones hasta que se seleccione un tipo
        await cargarDecoracionesCompatibles(null);

        // Reset disponibilidad + decoracion preview
        var preview = document.getElementById('disponibilidad-preview');
        if (preview) preview.classList.add('hidden');
        var decoPreview = document.getElementById('decoracion-preview');
        if (decoPreview) decoPreview.classList.add('hidden');
        _ultimaDisponibilidadOk = null;

        cambiarPaso(1);
        modulos.abrirModal('drawer-evento-overlay');
    }

    async function editarEvento(id, deps) {
        try {
            const evento = await API.eventos.get(id);
            state.eventoEditandoId = id;
            document.getElementById('drawer-titulo-evento').textContent = 'Editar Cotización';
            document.getElementById('btn-guardar-evento').textContent = 'Actualizar Cotización';
            ocultarAlertaId('drawer-alert-evento');
            validators.clearFieldErrors();

            await deps.cargarOpcionesFormularioEvento();

            // Setear tipoEvento y cargar decoraciones compatibles
            document.getElementById('select-tipo-evento').value = String(evento.tipoEventoId || '');
            await cargarDecoracionesCompatibles(evento.tipoEventoId);

            document.getElementById('select-cliente').value = String(evento.clienteId || '');
            document.getElementById('select-decoracion').value = String(evento.decoracionId || '');

            // Sincronizar autocomplete inputs con los valores seteados
            var tipo = state.tiposEventoDisponibles.find(function (t) { return t.id === evento.tipoEventoId; });
            var tipoInput = document.getElementById('autocomplete-tipo-evento-input');
            if (tipo && tipoInput) tipoInput.value = tipo.tipoNombre || tipo.nombre || '';
            var deco = state.decoracionesDisponibles.find(function (d) { return d.id === evento.decoracionId; });
            var decoInput = document.getElementById('autocomplete-decoracion-input');
            if (deco && decoInput) decoInput.value = deco.nombre || '';
            var cliente = state.clientesDisponibles.find(function (c) { return c.id === evento.clienteId; });
            var clienteInput = document.getElementById('autocomplete-cliente-input');
            if (cliente && clienteInput) clienteInput.value = cliente.nombre || '';

            const tipoEventoGroup = document.getElementById('select-tipo-evento').closest('.form-group');
            if (tipoEventoGroup) tipoEventoGroup.classList.add('hidden');

            document.getElementById('input-fecha').value = evento.fecha || '';
            document.getElementById('input-hora-inicio').value = evento.horaInicio || '';
            document.getElementById('input-hora-fin').value = evento.horaFin || '';
            document.getElementById('input-ubicacion').value = evento.ubicacion || '';
            document.getElementById('input-nota').value = evento.nota || '';

            const estadoEvento = (evento.estadoEventoNombre || '').trim();
            const esProgramado = esEdicionParcialEvento(estadoEvento);

            if (esProgramado) {
                mostrarAlertaId('drawer-alert-evento', 'warning', 'Evento programado: solo se permite editar ubicación y notas.');
            }

            getCamposBloqueables().forEach(function (idCampo) {
                const el = document.getElementById(idCampo);
                if (el) {
                    el.disabled = esProgramado;
                    el.title = esProgramado ? 'Bloqueado en eventos programados' : '';
                }
            });

            state.formularioModificado = false;

            // Reset disponibilidad + decoracion preview
            var preview = document.getElementById('disponibilidad-preview');
            if (preview) preview.classList.add('hidden');
            var decoPreview = document.getElementById('decoracion-preview');
            if (decoPreview) decoPreview.classList.add('hidden');
            _ultimaDisponibilidadOk = null;

            // Edición: ir directo al paso 2 si tiene datos de agenda
            if (!esProgramado && evento.fecha) {
                cambiarPaso(2);
                _checkDisponibilidadPreview();
            } else {
                cambiarPaso(1);
            }

            modulos.abrirModal('drawer-evento-overlay');
        } catch (err) {
            mostrarAlerta('error', 'No se pudo cargar la Cotización: ' + err.message);
        }
    }

    // ── Disponibilidad (backend call, usada en submit) ──────

    async function validarDisponibilidad(payload, eventoIdExcluir) {
        if (!(payload.fecha && payload.horaInicio && payload.horaFin && payload.ubicacion)) return true;

        const params = {
            fecha: payload.fecha,
            horaInicio: payload.horaInicio,
            horaFin: payload.horaFin,
            ubicacion: payload.ubicacion
        };

        if (eventoIdExcluir) params.eventoIdExcluir = eventoIdExcluir;
        return API.eventos.disponibilidad(params);
    }

    // ── Guardar (desde paso 3) ─────────────────────────────

    async function guardarEvento(event, deps) {
        if (event && event.preventDefault) event.preventDefault();
        ocultarAlertaId('drawer-alert-evento');

        const submitBtn = document.getElementById('btn-guardar-evento');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Guardando...';

        const restore = function () {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        };

        // Re-validar todo antes de enviar
        const validation = validators.validateEventoForm();
        if (!validation.isValid) {
            cambiarPaso(1);
            restore();
            return;
        }

        const crearPayload = payloadBuilder.buildCrearPayload(validation.values);

        try {
            if (state.eventoEditandoId) {
                const eventoActual = (state.todosLosEventos ?? []).find(function (e) { return e.id === state.eventoEditandoId; })
                    ?? state.eventos.find(function (e) { return e.id === state.eventoEditandoId; });
                const esParcial = eventoActual?.estadoEventoNombre === 'PROGRAMADO';

                const actualizarPayload = payloadBuilder.buildActualizarPayload(validation.values, esParcial);

                if (!esParcial) {
                    const disponible = await validarDisponibilidad(actualizarPayload, state.eventoEditandoId);
                    if (disponible === false) {
                        validators.marcarCamposConflicto();
                        mostrarAlertaId('drawer-alert-evento', 'error', 'Ya existe un evento en esa fecha, hora y ubicación. Ajustá la fecha, el horario o la ubicación.');
                        cambiarPaso(2);
                        restore();
                        return;
                    }
                }

                await API.eventos.actualizar(state.eventoEditandoId, actualizarPayload);
                mostrarAlerta('success', 'Cotización actualizada correctamente.');
            } else {
                const disponible = await validarDisponibilidad(crearPayload);
                if (disponible === false) {
                    validators.marcarCamposConflicto();
                    mostrarAlertaId('drawer-alert-evento', 'error', 'Ya existe un evento en esa fecha, hora y ubicación. Ajustá la fecha, el horario o la ubicación.');
                    cambiarPaso(2);
                    restore();
                    return;
                }

                await API.eventos.crear(crearPayload);
                mostrarAlerta('success', 'Cotización creada correctamente.');
            }

            state.formularioModificado = false;
            if (deps) {
                await deps.cerrarDrawerEvento();
                deps.refrescarVista();
            }
        } catch (err) {
            mostrarAlertaId('drawer-alert-evento', 'error', 'Error: ' + err.message);
        } finally {
            restore();
        }
    }

    async function cerrarDrawerEvento(e) {
        if (e && e.target.id !== 'drawer-evento-overlay' && e.type === 'click') return;
        if (state.formularioModificado) {
            const descartar = await new Promise(function (resolve) {
                state.resolveDescarte = resolve;
                modulos.abrirModal('modal-descartar-cambios');
            });
            if (!descartar) return;
        }

        state.formularioModificado = false;
        state.eventoEditandoId = null;
        _stepActual = 1;
        _ultimaDisponibilidadOk = null;
        resetDrawerVisualState();
        validators.clearFieldErrors();
        ocultarAlertaId('drawer-alert-evento');
        modulos.cerrarModal('drawer-evento-overlay');
    }

    // ── Autocomplete helper ──────────────────────────────────

    function _initAutocomplete(config) {
        var input = document.getElementById(config.inputId);
        var results = document.getElementById(config.resultsId);
        var clear = document.getElementById(config.clearId);
        var hiddenSelect = document.getElementById(config.hiddenSelectId);
        var dataSource = config.dataSource; // function that returns array
        var labelFn = config.labelFn; // (item) => display label
        var metaFn = config.metaFn; // (item) => optional meta string
        var onSelect = config.onSelect; // (item) => called after selection

        var activeIdx = -1;

        function getFiltered() {
            var q = (input.value || '').trim().toLowerCase();
            if (!q) return dataSource().slice(0, 50);
            return dataSource().filter(function (item) {
                var label = (labelFn(item) || '').toLowerCase();
                return label.indexOf(q) !== -1;
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
                var name = formatters.textoSeguro(labelFn(item));
                var meta = metaFn ? formatters.textoSeguro(metaFn(item)) : '';
                return '<button type="button" class="autocomplete-result" data-index="' + i + '" data-value="' + item.id + '">' +
                    '<span class="autocomplete-result-name">' + name + '</span>' +
                    (meta ? '<span class="autocomplete-result-meta">' + meta + '</span>' : '') +
                    '</button>';
            }).join('');

            results.classList.remove('hidden');
            input.setAttribute('aria-expanded', 'true');
        }

        function selectItem(value) {
            var item = dataSource().find(function (i) { return String(i.id) === String(value); });
            if (!item) return;

            input.value = labelFn(item);
            hiddenSelect.value = String(item.id);
            if (clear) clear.classList.remove('hidden');
            results.classList.add('hidden');
            input.setAttribute('aria-expanded', 'false');
            if (onSelect) onSelect(item);
        }

        function clearSelection() {
            input.value = '';
            hiddenSelect.value = '';
            if (clear) clear.classList.add('hidden');
            results.classList.add('hidden');
            input.setAttribute('aria-expanded', 'false');
            activeIdx = -1;
            if (onSelect) onSelect(null);
        }

        // ── Eventos ──

        input.addEventListener('input', function () {
            renderResults();
            if (hiddenSelect.value) {
                hiddenSelect.value = '';
                if (clear) clear.classList.add('hidden');
            }
        });

        input.addEventListener('focus', function () {
            if (dataSource().length > 0) renderResults();
        });

        input.addEventListener('blur', function () {
            // Delay to allow click on result
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

        // Result click delegation
        results.addEventListener('mousedown', function (e) {
            var btn = e.target.closest('.autocomplete-result');
            if (btn) selectItem(btn.dataset.value);
        });

        // Clear button
        if (clear) {
            clear.addEventListener('click', function () { clearSelection(); input.focus(); });
        }

        // Expose clear for external use
        return { clear: clearSelection, select: selectItem, refresh: renderResults };
    }

    // ── Init ────────────────────────────────────────────────

    var _clienteAutocomplete = null;
    var _decoAutocomplete = null;
    var _tipoEventoAutocomplete = null;

    function initEventosForm() {
        validators.initEventosValidators();

        // Inicializar autocompletes
        _clienteAutocomplete = _initAutocomplete({
            inputId: 'autocomplete-cliente-input',
            resultsId: 'autocomplete-cliente-results',
            clearId: 'autocomplete-cliente-clear',
            hiddenSelectId: 'select-cliente',
            dataSource: function () { return state.clientesDisponibles || []; },
            labelFn: function (c) { return c.nombre; },
            metaFn: function (c) { return c.telefono ? '\u260E ' + c.telefono : ''; },
            onSelect: function () { _actualizarDecoracionPreview(); } // no-op, cliente no tiene precio
        });

        _decoAutocomplete = _initAutocomplete({
            inputId: 'autocomplete-decoracion-input',
            resultsId: 'autocomplete-decoracion-results',
            clearId: 'autocomplete-decoracion-clear',
            hiddenSelectId: 'select-decoracion',
            dataSource: function () { return state.decoracionesDisponibles || []; },
            labelFn: function (d) { return d.nombre; },
            metaFn: function (d) { return '$' + (typeof formatters !== 'undefined' && formatters.precio ? formatters.precio(d.precio || 0) : (d.precio || 0).toFixed(2)); },
            onSelect: function () { _actualizarDecoracionPreview(); }
        });

        _tipoEventoAutocomplete = _initAutocomplete({
            inputId: 'autocomplete-tipo-evento-input',
            resultsId: 'autocomplete-tipo-evento-results',
            clearId: 'autocomplete-tipo-evento-clear',
            hiddenSelectId: 'select-tipo-evento',
            dataSource: function () { return state.tiposEventoDisponibles || []; },
            labelFn: function (t) { return t.tipoNombre || t.nombre || ''; },
            metaFn: null,
            onSelect: function () {
                var tipoId = parseInt(document.getElementById('select-tipo-evento').value, 10);
                cargarDecoracionesCompatibles(tipoId);
            }
        });

        // Cambio de tipo de evento (tambien via autocomplete) → recargar decoraciones compatibles
        document.getElementById('select-tipo-evento').addEventListener('change', function () {
            var tipoId = parseInt(this.value, 10);
            cargarDecoracionesCompatibles(tipoId);
        });

        // Disponibilidad en vivo (paso 2)
        ['input-fecha', 'input-hora-inicio', 'input-hora-fin', 'input-ubicacion'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', _checkDisponibilidadPreview);
                el.addEventListener('input', _checkDisponibilidadPreview);
            }
        });

        document.addEventListener('input', function (event) {
            if (event.target.closest('#form-evento')) state.formularioModificado = true;
        });
        document.addEventListener('change', function (event) {
            if (event.target.closest('#form-evento')) state.formularioModificado = true;
        });
    }

    // ── Nuevo Cliente (modal inline) ────────────────────────

    function abrirModalNuevoCliente() {
        document.getElementById('input-nuevo-cliente-nombre').value = '';
        document.getElementById('input-nuevo-cliente-telefono').value = '';
        document.getElementById('input-nuevo-cliente-email').value = '';
        var alertEl = document.getElementById('nuevo-cliente-alert');
        if (alertEl) { alertEl.classList.add('hidden'); alertEl.innerHTML = ''; }
        modulos.abrirModal('modal-nuevo-cliente');
        setTimeout(function () { document.getElementById('input-nuevo-cliente-nombre').focus(); }, 100);
    }

    function cerrarModalNuevoCliente() {
        modulos.cerrarModal('modal-nuevo-cliente');
    }

    async function guardarNuevoCliente() {
        var nombre = document.getElementById('input-nuevo-cliente-nombre').value.trim();
        var telefono = document.getElementById('input-nuevo-cliente-telefono').value.trim();
        var email = document.getElementById('input-nuevo-cliente-email').value.trim();

        if (!nombre || nombre.length < 2) {
            mostrarAlertaId('nuevo-cliente-alert', 'error', 'El nombre debe tener al menos 2 caracteres.');
            return;
        }

        var btn = document.getElementById('btn-guardar-nuevo-cliente');
        if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

        try {
            var nuevoCliente = await API.clientes.crear({
                nombre: nombre,
                telefono: telefono || null,
                email: email || null
            });

            // Recargar catálogo de clientes
            state.clientesDisponibles = await API.clientes.list();
            state.clientesDisponibles = state.clientesDisponibles.filter(function (c) { return c.activo !== false; });

            // Refrescar autocomplete y seleccionar el nuevo
            if (_clienteAutocomplete) {
                _clienteAutocomplete.select(nuevoCliente.id);
            }

            mostrarAlerta('success', 'Cliente creado correctamente.');
            cerrarModalNuevoCliente();
        } catch (err) {
            mostrarAlertaId('nuevo-cliente-alert', 'error', 'Error al crear cliente: ' + err.message);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Crear Cliente'; }
        }
    }

    // ── Decoración preview (precio) ────────────────────────

    function _actualizarDecoracionPreview() {
        var preview = document.getElementById('decoracion-preview');
        var precioEl = document.getElementById('decoracion-preview-precio');
        if (!preview || !precioEl) return;

        var select = document.getElementById('select-decoracion');
        var decoId = parseInt(select?.value, 10);
        if (!decoId) { preview.classList.add('hidden'); return; }

        var decoracion = (state.decoracionesDisponibles || []).find(function (d) { return d.id === decoId; });
        if (!decoracion) { preview.classList.add('hidden'); return; }

        var precio = Number(decoracion.precio || 0);
        precioEl.textContent = '$' + (typeof formatters !== 'undefined' && formatters.precio ? formatters.precio(precio) : precio.toFixed(2));
        preview.classList.remove('hidden');

        // Productos incluidos
        var productosContainer = document.getElementById('decoracion-productos-lista');
        var productosWrapper = document.getElementById('decoracion-preview-productos');
        if (!productosContainer || !productosWrapper) return;

        var productos = decoracion.productos || [];
        if (!productos.length) {
            productosWrapper.classList.add('hidden');
            return;
        }

        productosWrapper.classList.remove('hidden');
        productosContainer.innerHTML = productos.map(function (p) {
            var nombre = formatters.textoSeguro(p.productoNombre || 'Producto');
            var cantidad = p.cantidadRequerida || 1;
            return '<span class="decoracion-producto-chip">' + nombre + ' <strong>x' + cantidad + '</strong></span>';
        }).join('');
    }

    // ── Exports ─────────────────────────────────────────────

    window.eventoSiguientePaso = eventoSiguientePaso;
    window.eventoStepAnterior = eventoStepAnterior;
    window.abrirModalNuevoCliente = abrirModalNuevoCliente;
    window.cerrarModalNuevoCliente = cerrarModalNuevoCliente;
    window.guardarNuevoCliente = guardarNuevoCliente;

    window.EventosForm = Object.freeze({
        initEventosForm,
        abrirDrawerCrear,
        editarEvento,
        guardarEvento,
        cerrarDrawerEvento
    });
})();
