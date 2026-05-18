/**
 * modules/decoraciones/js/decoraciones.actions.js
 * Acciones del modulo Decoraciones: drawer, modales, guardado, eliminacion.
 * Depende de: DecoracionesState, DecoracionesHelpers, DecoracionesAPI,
 *             DecoracionesRender, DecoracionesComposition, modulos, mostrarAlerta.
 */
window.DecoracionesActions = (() => {

    // ── Tipos de Evento (checkboxes) ──────────────────────

    function cargarTiposEvento(tiposSeleccionados) {
        var container = document.getElementById('tipos-evento-checkbox-container');
        if (!container) return;

        // Init filtro una sola vez
        if (!DecoracionesState._filtroIniciado) {
            DecoracionesState._filtroIniciado = true;
            DecoracionesState._filtroTipos = '';
            initTipoEventoFiltro();
        }

        if (!DecoracionesState.tiposEventoDisponibles.length) {
            container.innerHTML = '<span class="text-light" style="font-size:0.82rem;">No hay tipos de evento disponibles.</span>';
            return;
        }

        var seleccionados = [];
        if (Array.isArray(tiposSeleccionados)) {
            seleccionados = tiposSeleccionados.map(function (t) { return typeof t === 'number' ? t : (t.id || t.tipoEventoId); });
        }

        if (typeof DecoracionesState._filtroTipos === 'undefined') DecoracionesState._filtroTipos = '';

        var filtro = DecoracionesState._filtroTipos.toLowerCase();
        var disponibles = DecoracionesState.tiposEventoDisponibles.filter(function (t) {
            var label = (t.tipoNombre || t.nombre || '').toLowerCase();
            return !filtro || label.indexOf(filtro) !== -1;
        });

        if (!disponibles.length) {
            container.innerHTML = '<span class="text-light" style="font-size:0.82rem;">Ningun tipo de evento coincide con la busqueda.</span>';
            return;
        }

        container.innerHTML = disponibles.map(function (t) {
            var checked = seleccionados.indexOf(t.id) !== -1 ? 'checked' : '';
            var label = formatters.textoSeguro(t.tipoNombre || t.nombre || 'Tipo #' + t.id);
            return '<label class="checkbox-chip' + (checked ? ' is-checked' : '') + '">' +
                '<input type="checkbox" class="tipo-evento-checkbox" value="' + t.id + '" ' + checked + ' onchange="this.parentElement.classList.toggle(\'is-checked\')">' +
                '<span>' + label + '</span>' +
            '</label>';
        }).join('');
    }

    function initTipoEventoFiltro() {
        var input = document.getElementById('tipo-evento-filtro');
        if (!input) return;
        input.addEventListener('input', function () {
            DecoracionesState._filtroTipos = this.value;
            cargarTiposEvento(obtenerTipoEventoIdsSeleccionados());
        });
    }

    function obtenerTipoEventoIdsSeleccionados() {
        var checkboxes = document.querySelectorAll('.tipo-evento-checkbox:checked');
        return Array.from(checkboxes).map(function (cb) { return parseInt(cb.value, 10); });
    }

    // ── Step navigation ───────────────────────────────────
    var _stepActual = 1;

    function cambiarPaso(n) {
        _stepActual = n;

        // Step indicator
        document.querySelectorAll('.decor-step').forEach(function (step) {
            var stepNum = parseInt(step.dataset.step, 10);
            step.classList.remove('active', 'completed');
            if (stepNum === n) step.classList.add('active');
            else if (stepNum < n) step.classList.add('completed');
        });

        // Step content
        document.querySelectorAll('.decor-step-content').forEach(function (content) {
            content.classList.toggle('hidden', parseInt(content.dataset.step, 10) !== n);
        });

        // Footer buttons
        var btnAtras = document.getElementById('btn-decor-atras');
        var btnCancelar = document.getElementById('btn-decor-cancelar');
        var btnSiguiente = document.getElementById('btn-decor-siguiente');
        var btnGuardar = document.getElementById('btn-guardar');
        var footerTitle = document.getElementById('drawer-footer-title');
        var footerCopy = document.getElementById('drawer-footer-copy');
        var feedbackStatus = document.getElementById('drawer-feedback-status');
        var feedbackCopy = document.getElementById('drawer-feedback-copy-text');

        // Reset all footer buttons
        btnAtras.hidden = (n === 1);
        btnSiguiente.classList.toggle('hidden', n === 4);
        btnGuardar.classList.toggle('hidden', n !== 4);

        var stepLabels = {
            1: { title: 'Datos básicos', copy: 'Completá nombre y estado del modelo.', feedback: 'Paso 1 de 4 — Datos básicos' },
            2: { title: 'Compatibilidad', copy: 'Seleccioná los tipos de evento donde estará disponible esta decoración.', feedback: 'Paso 2 de 4 — Compatibilidad' },
            3: { title: 'Composición y precio', copy: 'Armá la composición, definí el precio y revisá la rentabilidad estimada.', feedback: 'Paso 3 de 4 — Composición y precio' },
            4: { title: 'Revisión final', copy: 'Verificá toda la información antes de guardar la plantilla.', feedback: 'Paso 4 de 4 — Listo para guardar' }
        };

        var label = stepLabels[n] || stepLabels[1];
        if (footerTitle) footerTitle.textContent = label.title;
        if (footerCopy) footerCopy.textContent = label.copy;
        if (feedbackStatus) feedbackStatus.textContent = label.feedback;
        if (feedbackCopy) {
            var feedbackTexts = {
                1: 'Completá los datos básicos para continuar.',
                2: 'Elegí los tipos de evento compatibles (opcional).',
                3: 'Agregá productos, definí el precio y verificá la rentabilidad.',
                4: 'Revisá el resumen y guardá la plantilla.'
            };
            feedbackCopy.textContent = feedbackTexts[n] || '';
        }

        // Step 4: build/refresh summary
        if (n === 4) {
            _buildResumenDecor();
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function decorSiguientePaso() {
        if (_stepActual === 1) {
            if (!_validarPaso1()) return;
            cambiarPaso(2);
            return;
        }
        if (_stepActual === 2) {
            cambiarPaso(3);
            return;
        }
        if (_stepActual === 3) {
            if (!_validarPaso3()) return;
            cambiarPaso(4);
            return;
        }
    }

    function decorPasoAnterior() {
        if (_stepActual > 1) cambiarPaso(_stepActual - 1);
    }

    // ── Step validators ───────────────────────────────────

    function _validarPaso1() {
        ocultarAlertaId('drawer-alert');
        var nombre = document.getElementById('input-nombre').value.trim();

        if (!nombre) {
            mostrarAlertaId('drawer-alert', 'error', 'El nombre del modelo es obligatorio.');
            document.getElementById('input-nombre')?.focus();
            return false;
        }

        return true;
    }

    function _validarPaso3() {
        ocultarAlertaId('drawer-alert');
        ocultarAlertaId('decoracion-stock-alert');

        var precio = parseFloat(document.getElementById('input-precio').value);
        if (Number.isNaN(precio) || precio <= 0) {
            mostrarAlertaId('drawer-alert', 'error', 'El precio de venta debe ser mayor a 0.');
            document.getElementById('input-precio')?.focus();
            return false;
        }

        var productos = DecoracionesComposition.obtenerProductosDecoracion();
        if (!productos.length) {
            mostrarAlertaId('drawer-alert', 'error', 'Debés agregar al menos un producto a la composición.');
            return false;
        }

        var errorProductos = DecoracionesHelpers.validarProductosLocalmente(productos);
        if (errorProductos) {
            mostrarAlertaId('decoracion-stock-alert', 'error', errorProductos);
            return false;
        }

        var costoEstimado = DecoracionesHelpers.calcularCostoEstimado(productos);
        if (precio < costoEstimado) {
            mostrarAlertaId('drawer-alert', 'error', 'El precio no puede ser menor al costo estimado de materiales. Mínimo sugerido: $' + formatters.precio(costoEstimado) + '.');
            document.getElementById('input-precio')?.focus();
            return false;
        }

        return true;
    }

    // ── Resumen (step 4) ──────────────────────────────────

    function _buildResumenDecor() {
        var container = document.getElementById('decor-resumen-container');
        if (!container) return;

        var nombre = document.getElementById('input-nombre').value.trim();
        var precio = parseFloat(document.getElementById('input-precio').value) || 0;
        var estado = document.getElementById('select-estado').value || 'ACTIVO';
        var descripcion = document.getElementById('input-descripcion').value.trim();
        var productos = DecoracionesComposition.obtenerProductosDecoracion();

        var costoEstimado = DecoracionesHelpers.calcularCostoEstimado(productos);
        var margen = precio - costoEstimado;
        var totalTipos = new Set(productos.map(function (item) { return item.productoId; })).size;
        var totalUnidades = productos.reduce(function (acc, item) { return acc + Number(item.cantidadRequerida || 0); }, 0);

        // Tipos de evento seleccionados
        var tipoIds = obtenerTipoEventoIdsSeleccionados();
        var tiposLabels = [];
        if (tipoIds.length && DecoracionesState.tiposEventoDisponibles) {
            tiposLabels = DecoracionesState.tiposEventoDisponibles
                .filter(function (t) { return tipoIds.indexOf(t.id) !== -1; })
                .map(function (t) { return formatters.textoSeguro(t.tipoNombre || t.nombre || ''); });
        }

        // Product rows
        var productRows = '';
        if (productos.length) {
            productRows = productos.map(function (item) {
                var prod = DecoracionesState.productosDisponibles.find(function (p) { return String(p.id) === String(item.productoId); });
                var nom = prod ? formatters.textoSeguro(prod.nombre) : 'Producto #' + item.productoId;
                var stock = DecoracionesHelpers.getStockProducto(item.productoId);
                var hayError = DecoracionesHelpers.hayErrorCargaStock(item.productoId);
                var requerido = Number(item.cantidadRequerida || 0);
                var disponible = Number(stock?.cantidadDisponible || 0);
                var critico = !!stock?.stockBajoAlerta;
                var insuficiente = !hayError && disponible < requerido;

                var itemClase = 'is-success';
                var itemStatus = 'Stock suficiente';
                if (hayError) { itemClase = 'is-warning'; itemStatus = 'Validación pendiente'; }
                else if (insuficiente) { itemClase = 'is-danger'; itemStatus = 'Stock insuficiente'; }
                else if (critico) { itemClase = 'is-warning'; itemStatus = 'Stock crítico'; }

                return '<div class="decor-resumen-producto ' + itemClase + '">' +
                    '<span class="decor-resumen-producto-nombre">' + nom + ' <strong>x' + requerido + '</strong></span>' +
                    '<span class="decor-resumen-producto-meta">' + itemStatus + '</span>' +
                '</div>';
            }).join('');
        }

        // Metrics health
        var pendientes = productos.reduce(function (acc, item) {
            return DecoracionesHelpers.hayErrorCargaStock(item.productoId) ? acc + 1 : acc;
        }, 0);
        var riesgos = productos.reduce(function (acc, item) {
            if (DecoracionesHelpers.hayErrorCargaStock(item.productoId)) return acc;
            var stock = DecoracionesHelpers.getStockProducto(item.productoId);
            if (!stock) return acc + 1;
            if (stock.stockBajoAlerta || Number(stock.cantidadDisponible || 0) < Number(item.cantidadRequerida || 0)) return acc + 1;
            return acc;
        }, 0);

        var saludClase = 'is-neutral';
        var saludTexto = 'Sin composición';
        if (productos.length) {
            if (pendientes > 0) { saludClase = 'is-warning'; saludTexto = pendientes + ' pendiente(s)'; }
            else if (riesgos > 0) { saludClase = 'is-danger'; saludTexto = riesgos + ' alerta(s)'; }
            else { saludClase = 'is-success'; saludTexto = 'Estable'; }
        }

        var margenClase = 'is-neutral';
        if (productos.length) {
            if (margen < 0) margenClase = 'is-danger';
            else if (margen === 0) margenClase = 'is-warning';
            else margenClase = 'is-success';
        }

        container.innerHTML =
            '<div class="decor-resumen-section">' +
                '<h3><i data-lucide="tag"></i> Datos básicos</h3>' +
                '<div class="decor-resumen-grid">' +
                    '<div class="decor-resumen-field"><span>Nombre</span><strong>' + formatters.textoSeguro(nombre) + '</strong></div>' +
                    '<div class="decor-resumen-field"><span>Precio</span><strong>$' + formatters.precio(precio) + '</strong></div>' +
                    '<div class="decor-resumen-field"><span>Estado</span><strong>' + estado + '</strong></div>' +
                    (descripcion ? '<div class="decor-resumen-field"><span>Descripción</span><strong>' + formatters.textoSeguro(descripcion.substring(0, 80)) + (descripcion.length > 80 ? '...' : '') + '</strong></div>' : '') +
                '</div>' +
            '</div>' +
            '<div class="decor-resumen-section">' +
                '<h3><i data-lucide="layout"></i> Compatibilidad</h3>' +
                (tiposLabels.length
                    ? '<div class="decor-resumen-tipos">' + tiposLabels.map(function (t) { return '<span class="decor-resumen-tipo-chip">' + t + '</span>'; }).join('') + '</div>'
                    : '<span class="decor-resumen-tipos-empty">Sin restricción — disponible para todos los tipos de evento</span>') +
            '</div>' +
            '<div class="decor-resumen-section">' +
                '<h3><i data-lucide="package"></i> Composición (' + totalTipos + ' tipo' + (totalTipos === 1 ? '' : 's') + ', ' + totalUnidades + ' unidad' + (totalUnidades === 1 ? '' : 'es') + ')</h3>' +
                (productos.length ? '<div class="decor-resumen-productos">' + productRows + '</div>' : '<span class="decor-resumen-tipos-empty">Sin productos en la composición.</span>') +
            '</div>' +
            '<div class="decor-resumen-section">' +
                '<h3><i data-lucide="trending-up"></i> Rentabilidad</h3>' +
                '<div class="decor-resumen-metrics">' +
                    '<div class="decor-resumen-metric ' + saludClase + '"><span>Salud</span><strong>' + saludTexto + '</strong></div>' +
                    '<div class="decor-resumen-metric ' + margenClase + '"><span>Costo est.</span><strong>$' + formatters.precio(costoEstimado) + '</strong></div>' +
                    '<div class="decor-resumen-metric ' + margenClase + '"><span>Margen est.</span><strong>$' + formatters.precio(margen) + '</strong></div>' +
                '</div>' +
            '</div>';

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ── Drawer ────────────────────────────────────────────

    function abrirDrawerCrear() {
        _stepActual = 1;
        DecoracionesState.decoracionEditandoId = null;
        DecoracionesState.composicionOriginalSnapshot = '';
        document.getElementById('drawer-titulo').textContent = 'Nueva Decoración';
        document.getElementById('drawer-subtitulo').textContent = 'Configurá la plantilla paso a paso — composición, stock y disponibilidad.';
        document.getElementById('drawer-mode-chip').textContent = 'Alta nueva';
        document.getElementById('btn-guardar').textContent = 'Guardar Modelo';

        modulos.limpiarForm(['input-nombre', 'input-precio', 'input-descripcion']);
        document.getElementById('select-estado').value = 'ACTIVO';
        DecoracionesComposition.resetProductosDecoracion();
        document.getElementById('precio-warning-note').classList.add('hidden');
        actualizarEstadoDrawer('Paso 1 de 4', 'neutral');
        actualizarResumenFooter('Datos básicos', 'Completá nombre y estado del modelo.');
        ocultarAlertaId('drawer-alert');
        ocultarAlertaId('decoracion-stock-alert');

        // Resetear filtro de tipos de evento
        DecoracionesState._filtroTipos = '';
        var filtroInput = document.getElementById('tipo-evento-filtro');
        if (filtroInput) filtroInput.value = '';

        // Cargar tipos de evento
        cargarTiposEvento([]);

        cambiarPaso(1);
        modulos.abrirModal('drawer-decoracion-overlay');
    }

    async function abrirDrawerEditar(id) {
        try {
            _stepActual = 1;
            const dec = await DecoracionesAPI.obtenerDecoracion(id);
            DecoracionesState.decoracionEditandoId = id;
            DecoracionesState.composicionOriginalSnapshot = DecoracionesHelpers.getComposicionSnapshot(dec.productos || []);
            document.getElementById('drawer-titulo').textContent = 'Editar Decoración';
            document.getElementById('drawer-subtitulo').textContent = 'Ajustá precio, estado y composición sin tocar los eventos ya creados.';
            document.getElementById('drawer-mode-chip').textContent = 'Edición activa';
            document.getElementById('btn-guardar').textContent = 'Actualizar Modelo';

            document.getElementById('input-nombre').value = dec.nombre || '';
            document.getElementById('input-precio').value = dec.precio || '';
            document.getElementById('input-descripcion').value = dec.descripcion || '';
            document.getElementById('select-estado').value = dec.estado || 'ACTIVO';
            DecoracionesComposition.resetProductosDecoracion(dec.productos || []);
            document.getElementById('precio-warning-note').classList.remove('hidden');
            actualizarEstadoDrawer('Editando plantilla existente', 'warning');
            actualizarResumenFooter('Revisión en curso', 'Confirmá que la composición siga operativa antes de guardar cambios.');

            ocultarAlertaId('drawer-alert');
            ocultarAlertaId('decoracion-stock-alert');

            // Resetear filtro de tipos de evento
            DecoracionesState._filtroTipos = '';
            var filtroInput = document.getElementById('tipo-evento-filtro');
            if (filtroInput) filtroInput.value = '';

            // Cargar tipos de evento con los seleccionados
            cargarTiposEvento(dec.tiposCompatibles || []);

            cambiarPaso(1);
            modulos.abrirModal('drawer-decoracion-overlay');
        } catch (err) {
            mostrarAlerta('error', 'No se pudo cargar la decoración: ' + DecoracionesHelpers.mapDecoracionErrorMessage(err));
        }
    }

    function cerrarDrawer(e) {
        if (e && e.target.id !== 'drawer-decoracion-overlay' && e.type === 'click') return;
        if (DecoracionesState.guardando) return;
        modulos.cerrarModal('drawer-decoracion-overlay');
    }

    function actualizarEstadoDrawer(texto, tone = 'neutral') {
        const badge = document.getElementById('drawer-feedback-status');
        if (!badge) return;
        badge.textContent = texto;
        badge.className = `drawer-feedback-status is-${tone}`;
    }

    function actualizarResumenFooter(titulo, descripcion) {
        const footerTitle = document.getElementById('drawer-footer-title');
        const footerCopy = document.getElementById('drawer-footer-copy');
        if (footerTitle) footerTitle.textContent = titulo;
        if (footerCopy) footerCopy.textContent = descripcion;
    }

    async function guardarDecoracion(e) {
        e.preventDefault();
        ocultarAlertaId('drawer-alert');
        ocultarAlertaId('decoracion-stock-alert');

        const nombre = document.getElementById('input-nombre').value.trim();
        const precio = parseFloat(document.getElementById('input-precio').value);
        const descripcion = document.getElementById('input-descripcion').value.trim();
        const estado = document.getElementById('select-estado').value;
        const productos = DecoracionesComposition.obtenerProductosDecoracion();

        if (!nombre || Number.isNaN(precio)) {
            return mostrarAlertaId('drawer-alert', 'error', 'Complete los campos obligatorios.');
        }

        if (precio <= 0) {
            return mostrarAlertaId('drawer-alert', 'error', 'El precio debe ser mayor a 0.');
        }

        const errorProductos = DecoracionesHelpers.validarProductosLocalmente(productos);
        if (errorProductos) {
            return mostrarAlertaId('decoracion-stock-alert', 'error', errorProductos);
        }

        const costoEstimado = DecoracionesHelpers.calcularCostoEstimado(productos);
        if (precio < costoEstimado) {
            return mostrarAlertaId('drawer-alert', 'error', `El precio no puede ser menor al costo estimado de materiales. Mínimo sugerido: $${formatters.precio(costoEstimado)}.`);
        }

        const submitBtn = document.getElementById('btn-guardar');
        const originalButtonText = submitBtn?.textContent || 'Guardar Modelo';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }
        DecoracionesState.guardando = true;
        actualizarEstadoDrawer('Validando y guardando...', 'warning');
        actualizarResumenFooter('Guardando cambios', 'Estamos validando la composición y enviando la plantilla al backend.');

        const bodyBase = {
            nombre,
            precio,
            descripcion: descripcion || null,
            estado
        };

        // Incluir tipoEventoIds en todos los casos
        var tipoEventoIds = obtenerTipoEventoIdsSeleccionados();
        if (tipoEventoIds.length > 0) {
            bodyBase.tipoEventoIds = tipoEventoIds;
        }

        try {
            if (DecoracionesState.decoracionEditandoId) {
                const body = { ...bodyBase };
                const composicionNuevaSnapshot = DecoracionesHelpers.getComposicionSnapshot(productos);
                if (composicionNuevaSnapshot !== DecoracionesState.composicionOriginalSnapshot) {
                    body.productos = productos;
                }
                await DecoracionesAPI.actualizarDecoracion(DecoracionesState.decoracionEditandoId, body);
                mostrarAlerta('success', 'Modelo actualizado correctamente.');
                actualizarEstadoDrawer('Modelo actualizado', 'success');
                actualizarResumenFooter('Cambios aplicados', 'La plantilla quedó actualizada con el estado y composición enviados.');
            } else {
                await DecoracionesAPI.crearDecoracion({ ...bodyBase, productos });
                mostrarAlerta('success', 'Modelo guardado exitosamente.');
                actualizarEstadoDrawer('Modelo creado', 'success');
                actualizarResumenFooter('Plantilla creada', 'La nueva decoración quedó registrada correctamente.');
            }

            cerrarDrawer();
            await cargarDecoraciones();
        } catch (err) {
            actualizarEstadoDrawer('No se pudo guardar', 'danger');
            actualizarResumenFooter('Revisá antes de reenviar', 'Corregí los datos marcados o la composición antes de intentar nuevamente.');
            mostrarAlertaId('drawer-alert', 'error', 'Error: ' + DecoracionesHelpers.mapDecoracionErrorMessage(err));
        } finally {
            DecoracionesState.guardando = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            }
        }
    }

    function abrirModalDetalle(id) {
        const dec = DecoracionesState.decoraciones.find(item => item.id === id);
        if (!dec) {
            mostrarAlerta('error', 'La decoracion ya no existe o fue removida del listado.');
            return;
        }

        DecoracionesState.decoracionDetalleActualId = id;
        document.getElementById('detalle-decoracion-titulo').textContent = dec.nombre || `Decoracion #${id}`;
        const subtitle = document.getElementById('detalle-decoracion-subtitle');
        if (subtitle) subtitle.textContent = `#${id} · ${dec.estado === 'ACTIVO' ? 'Disponible para eventos' : 'Fuera de operación nueva'}`;
        const idLabel = document.getElementById('detalle-decoracion-id-label');
        if (idLabel) idLabel.textContent = `ID #${id} · Creado ${dec.fechaCreacion ? formatFecha(dec.fechaCreacion) : '—'}`;

        document.getElementById('detalle-decoracion-body').innerHTML = DecoracionesRender.renderDetalleCuerpo(dec);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        modulos.abrirModal('modal-detalle-decoracion');
    }

    function cerrarModalDetalle() {
        DecoracionesState.decoracionDetalleActualId = null;
        modulos.cerrarModal('modal-detalle-decoracion');
    }

    function abrirDrawerEditarDesdeDetalle() {
        const id = DecoracionesState.decoracionDetalleActualId;
        if (!id) return;
        cerrarModalDetalle();
        abrirDrawerEditar(id);
    }

    function abrirModalEliminar(id, accion = 'desactivar') {
        const decoracion = DecoracionesState.decoraciones.find(item => item.id === id);
        if (!decoracion) {
            mostrarAlerta('error', 'La decoracion ya no existe o fue removida del listado.');
            return;
        }

        DecoracionesState.decoracionEliminandoId = id;
        DecoracionesState.decoracionAccionPendiente = accion;
        document.getElementById('nombre-eliminar').textContent = decoracion.nombre;

        const titulo = document.getElementById('modal-accion-titulo');
        const mensaje = document.getElementById('modal-accion-mensaje');
        const ayuda = document.getElementById('modal-accion-ayuda');
        const boton = document.getElementById('btn-confirmar-accion-decoracion');

        if (accion === 'reactivar') {
            titulo.textContent = '¿Reactivar modelo?';
            mensaje.innerHTML = `Estás a punto de reactivar el modelo <strong>${formatters.textoSeguro(decoracion.nombre)}</strong>.`;
            ayuda.textContent = 'Volverá a estar disponible para nuevas selecciones en eventos y cotizaciones.';
            boton.textContent = 'Reactivar';
            boton.className = 'btn btn-success';
        } else {
            titulo.textContent = '¿Desactivar modelo?';
            mensaje.innerHTML = `Estás a punto de desactivar el modelo <strong>${formatters.textoSeguro(decoracion.nombre)}</strong>.`;
            ayuda.textContent = 'Los eventos existentes mantendrán su información, pero no podrá seleccionarse para nuevos eventos.';
            boton.textContent = 'Desactivar';
            boton.className = 'btn btn-danger';
        }

        modulos.abrirModal('modal-eliminar');
    }

    function cerrarModalEliminar() {
        modulos.cerrarModal('modal-eliminar');
    }

    async function confirmarEliminar() {
        try {
            if (DecoracionesState.decoracionAccionPendiente === 'reactivar') {
                await DecoracionesAPI.reactivarDecoracion(DecoracionesState.decoracionEliminandoId);
            } else {
                await DecoracionesAPI.eliminarDecoracion(DecoracionesState.decoracionEliminandoId);
            }
            cerrarModalEliminar();
            mostrarAlerta('success', DecoracionesState.decoracionAccionPendiente === 'reactivar'
                ? 'Modelo reactivado correctamente.'
                : 'Modelo desactivado del catalogo.');
            await cargarDecoraciones();
        } catch (err) {
            mostrarAlerta('error', 'Error: ' + DecoracionesHelpers.mapDecoracionErrorMessage(err));
            cerrarModalEliminar();
        }
    }

    return {
        abrirDrawerCrear,
        abrirDrawerEditar,
        cerrarDrawer,
        guardarDecoracion,
        decorSiguientePaso,
        decorPasoAnterior,
        abrirModalDetalle,
        cerrarModalDetalle,
        abrirDrawerEditarDesdeDetalle,
        abrirModalEliminar,
        cerrarModalEliminar,
        confirmarEliminar
    };
})();

// Inline onclick/onsubmit compatibility
window.abrirDrawerCrear = window.DecoracionesActions.abrirDrawerCrear;
window.abrirDrawerEditar = window.DecoracionesActions.abrirDrawerEditar;
window.cerrarDrawer = window.DecoracionesActions.cerrarDrawer;
window.guardarDecoracion = window.DecoracionesActions.guardarDecoracion;
window.decorSiguientePaso = window.DecoracionesActions.decorSiguientePaso;
window.decorPasoAnterior = window.DecoracionesActions.decorPasoAnterior;
window.abrirModalDetalle = window.DecoracionesActions.abrirModalDetalle;
window.cerrarModalDetalle = window.DecoracionesActions.cerrarModalDetalle;
window.abrirDrawerEditarDesdeDetalle = window.DecoracionesActions.abrirDrawerEditarDesdeDetalle;
window.abrirModalEliminar = window.DecoracionesActions.abrirModalEliminar;
window.cerrarModalEliminar = window.DecoracionesActions.cerrarModalEliminar;
window.confirmarEliminar = window.DecoracionesActions.confirmarEliminar;
