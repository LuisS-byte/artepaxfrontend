/**
 * modules/inventario/js/inventario.actions.js
 * Interaction layer del módulo Inventario.
 * Fase 5A: UI helpers, filtros, búsquedas.
 * Dependencias globales: InventarioState, render (aplicarRender*), helpers.
 */

/* ================================================================ */
/*  FILTER CLEAR HELPERS                                            */
/* ================================================================ */

function limpiarFiltroEstadoProducto() {
    const el = document.getElementById('filter-estado-producto');
    if (el) el.value = 'todos';
    aplicarRenderProductos();
}

function limpiarFiltroTipoMov() {
    const el = document.getElementById('filter-tipo-mov');
    if (el) el.value = '';
    aplicarRenderMovimientosGlobales();
}

function limpiarFiltroOrigenMov() {
    const el = document.getElementById('filter-origen-mov');
    if (el) el.value = '';
    aplicarRenderMovimientosGlobales();
}

function limpiarFiltroFechaDesde() {
    const el = document.getElementById('filter-fecha-desde');
    if (el) el.value = '';
    aplicarRenderMovimientosGlobales();
}

function limpiarFiltroFechaHasta() {
    const el = document.getElementById('filter-fecha-hasta');
    if (el) el.value = '';
    aplicarRenderMovimientosGlobales();
}

function limpiarTodosFiltrosMov() {
    document.getElementById('filter-tipo-mov').value = '';
    document.getElementById('filter-origen-mov').value = '';
    document.getElementById('filter-fecha-desde').value = '';
    document.getElementById('filter-fecha-hasta').value = '';
    aplicarRenderMovimientosGlobales();
}

/* ================================================================ */
/*  SEARCH CLEAR BUTTONS                                            */
/* ================================================================ */

function limpiarBusquedaStock() {
    const input = document.getElementById('search-stock');
    if (!input) return;
    input.value = '';
    input.focus();
    aplicarRenderStock();
}

function limpiarBusquedaProductos() {
    const input = document.getElementById('search-productos');
    if (!input) return;
    input.value = '';
    input.focus();
    aplicarRenderProductos();
}

function limpiarBusquedaMovimientos() {
    const input = document.getElementById('search-movimientos');
    if (!input) return;
    input.value = '';
    input.focus();
    aplicarRenderMovimientos();
}

/* ================================================================ */
/*  FILTERS PRODUCTOS (general clear)                               */
/* ================================================================ */

function limpiarFiltrosProductos() {
    const search = document.getElementById('search-productos');
    const estado = document.getElementById('filter-estado-producto');
    if (search) search.value = '';
    if (estado) estado.value = 'todos';
    aplicarRenderProductos();
}

/* ================================================================ */
/*  MOBILE FILTER TOGGLE                                            */
/* ================================================================ */

function toggleFilterBar(barId) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    bar.classList.toggle('open');
}

/* ================================================================ */
/*  STEP INDICATOR                                                   */
/* ================================================================ */

function actualizarStepIndicator(step) {
    InventarioState.stepActual = step;
    const container = document.getElementById('move-step-indicator');
    if (container) container.dataset.stepActive = step;
    const steps = document.querySelectorAll('#move-step-indicator .move-step');
    steps.forEach(s => {
        s.classList.remove('active');
        if (s.dataset.step === step) s.classList.add('active');
    });
    // Update active step label
    var labels = {
        select: 'Paso 1 \u00B7 Seleccionar producto',
        data: 'Paso 2 \u00B7 Ingresar datos',
        confirm: 'Paso 3 \u00B7 Confirmar'
    };
    var labelEl = document.getElementById('move-step-label');
    if (labelEl) labelEl.textContent = labels[step] || '';
}

/* ================================================================ */
/*  AYUDA MOVIMIENTO — Stock hint contextual                         */
/* ================================================================ */

function actualizarAyudaMovimiento() {
    const productoId = document.getElementById('select-producto')?.value;
    const ayuda = document.getElementById('movimiento-stock-hint');
    if (!ayuda) return;

    // Track step
    if (productoId) {
        if (document.getElementById('input-cantidad')?.value) {
            actualizarStepIndicator('confirm');
        } else {
            actualizarStepIndicator('data');
        }
    } else {
        actualizarStepIndicator('select');
    }

    // Clear classes
    ayuda.className = 'stock-hint';

    if (!productoId) {
        ayuda.className = 'stock-hint stock-hint--info';
        ayuda.textContent = InventarioState.tipoMovimientoActual === 'ajuste'
            ? 'El ajuste usa el conteo físico real y tiene en cuenta lo que ya está comprometido.'
            : 'Seleccioná un producto para ver stock físico y disponibilidad operativa.';
        return;
    }

    const stock = getStockProductoLocal(productoId);
    if (!stock) {
        ayuda.className = 'stock-hint stock-hint--info';
        ayuda.textContent = 'No hay datos de stock disponibles para este producto en este momento.';
        return;
    }

    if (InventarioState.tipoMovimientoActual === 'salida') {
        ayuda.className = 'stock-hint stock-hint--warning';
        ayuda.textContent = `Disponible operativo: ${stock.cantidadDisponible}. Reservado en eventos: ${stock.cantidadReservada || 0}.`;
        return;
    }

    if (InventarioState.tipoMovimientoActual === 'ajuste') {
        ayuda.className = 'stock-hint stock-hint--accent';
        ayuda.textContent = `Stock físico actual: ${stock.cantidadTotal}. Reservado activo: ${stock.cantidadReservada || 0}.`;
        return;
    }

    ayuda.className = 'stock-hint stock-hint--info';
    ayuda.textContent = `Stock físico actual: ${stock.cantidadTotal}. Disponible operativo: ${stock.cantidadDisponible}.`;
}

/* ================================================================ */
/*  AUTOCOMPLETE — Producto en movimiento drawer                     */
/* ================================================================ */

/**
 * Select a product from the autocomplete dropdown.
 * Sets the hidden select value, updates stock hint, step indicator, and confirmation.
 */
function seleccionarProductoMovimiento(productoId, productoNombre) {
    var hiddenSelect = document.getElementById('select-producto');
    var autocompleteInput = document.getElementById('producto-autocomplete-input');
    var clearBtn = document.getElementById('producto-autocomplete-clear');
    var resultsEl = document.getElementById('producto-autocomplete-results');

    if (hiddenSelect) hiddenSelect.value = productoId;
    if (autocompleteInput) autocompleteInput.value = productoNombre || '';
    if (clearBtn) clearBtn.classList.remove('hidden');
    if (resultsEl) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
    }
    if (autocompleteInput) {
        autocompleteInput.setAttribute('aria-expanded', 'false');
        autocompleteInput.focus();
    }

    actualizarAyudaMovimiento();
    renderConfirmacionMovimiento();
}

/**
 * Clear the autocomplete product selection and reset to empty state.
 */
function limpiarAutocompleteProducto() {
    var hiddenSelect = document.getElementById('select-producto');
    var autocompleteInput = document.getElementById('producto-autocomplete-input');
    var clearBtn = document.getElementById('producto-autocomplete-clear');
    var resultsEl = document.getElementById('producto-autocomplete-results');

    if (hiddenSelect) hiddenSelect.value = '';
    if (autocompleteInput) {
        autocompleteInput.value = '';
        autocompleteInput.focus();
        autocompleteInput.setAttribute('aria-expanded', 'false');
    }
    if (clearBtn) clearBtn.classList.add('hidden');
    if (resultsEl) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
    }

    actualizarAyudaMovimiento();
    ocultarConfirmacionMovimiento();
}

/**
 * Render the confirmation summary panel in the movement drawer.
 * Shows: selected product, movement type, quantity, origin, and stock impact.
 */
function renderConfirmacionMovimiento() {
    var container = document.getElementById('movimiento-confirmacion');
    var rowsContainer = document.getElementById('confirm-summary-rows');
    if (!container || !rowsContainer) return;

    var productoId = document.getElementById('select-producto')?.value;
    var cantidad = document.getElementById('input-cantidad')?.value;
    var tipoOrigen = document.getElementById('select-tipo-origen')?.value;
    var tipo = InventarioState.tipoMovimientoActual;

    // Only show when product AND cantidad are filled (step >= confirm)
    if (!productoId || !cantidad || parseInt(cantidad, 10) <= 0) {
        container.classList.add('hidden');
        return;
    }

    var producto = (InventarioState.productosData || []).find(function(p) {
        return String(p.id) === String(productoId);
    }) || (InventarioState.stockData || []).find(function(s) {
        return String(s.idProducto) === String(productoId);
    });

    var nombreProducto = producto ? (producto.nombre || 'Producto #' + productoId) : 'Producto #' + productoId;
    var tipoLabel = tipo === 'entrada' ? 'Entrada' : tipo === 'salida' ? 'Salida' : 'Ajuste';
    var tipoIcon = tipo === 'entrada' ? 'arrow-down' : tipo === 'salida' ? 'arrow-up' : 'rotate-ccw';

    // Map origin code to label
    var origenLabels = {
        REPOSICION: 'Reposici&oacute;n',
        AJUSTE_MANUAL: 'Ajuste Manual',
        'DAÑO': 'Da&ntilde;o',
        PERDIDA: 'P&eacute;rdida',
        EVENTO: 'Evento'
    };
    var origenLabel = origenLabels[tipoOrigen] || tipoOrigen || '—';

    // Compute stock impact
    var stock = (InventarioState.stockData || []).find(function(s) {
        return String(s.idProducto) === String(productoId);
    });
    var disponibleActual = stock ? stock.cantidadDisponible : '?';
    var reservadoActual = stock ? (stock.cantidadReservada || 0) : '?';
    var totalActual = stock ? stock.cantidadTotal : '?';

    var impactHtml = '';
    if (tipo === 'entrada') {
        var nuevoTotal = (stock ? Number(stock.cantidadTotal) : 0) + parseInt(cantidad, 10);
        var nuevoDisp = (stock ? Number(stock.cantidadDisponible) : 0) + parseInt(cantidad, 10);
        impactHtml = '<div class="confirm-summary-impact">' +
            '<strong>Impacto:</strong> Stock total pasar&aacute; de <strong>' + totalActual + '</strong> a <strong>' + nuevoTotal + '</strong>. ' +
            'Disponible operativo: <strong>' + nuevoDisp + '</strong>.</div>';
    } else if (tipo === 'salida') {
        var nuevoTotalOut = Math.max(0, (stock ? Number(stock.cantidadTotal) : 0) - parseInt(cantidad, 10));
        var nuevoDispOut = Math.max(0, (stock ? Number(stock.cantidadDisponible) : 0) - parseInt(cantidad, 10));
        impactHtml = '<div class="confirm-summary-impact">' +
            '<strong>Impacto:</strong> Stock total pasar&aacute; de <strong>' + totalActual + '</strong> a <strong>' + nuevoTotalOut + '</strong>. ' +
            'Disponible operativo: <strong>' + nuevoDispOut + '</strong>.</div>';
    } else if (tipo === 'ajuste') {
        impactHtml = '<div class="confirm-summary-impact">' +
            '<strong>Nota:</strong> El ajuste establece el stock f&iacute;sico total a <strong>' + cantidad + '</strong>. ' +
            'Reserva activa actual: <strong>' + reservadoActual + '</strong>.</div>';
    }

    var rowsHtml =
        '<div class="confirm-summary-row">' +
            '<span class="confirm-summary-label">Producto</span>' +
            '<span class="confirm-summary-value"><i data-lucide="' + tipoIcon + '" style="width:14px;height:14px;vertical-align:text-bottom"></i> ' + formatters.textoSeguro(nombreProducto) + '</span>' +
        '</div>' +
        '<div class="confirm-summary-row">' +
            '<span class="confirm-summary-label">Movimiento</span>' +
            '<span class="confirm-summary-value">' + tipoLabel + '</span>' +
        '</div>' +
        '<div class="confirm-summary-row">' +
            '<span class="confirm-summary-label">Cantidad</span>' +
            '<span class="confirm-summary-value"><strong>' + cantidad + '</strong> unidades</span>' +
        '</div>' +
        (tipo !== 'ajuste' ? '<div class="confirm-summary-row">' +
            '<span class="confirm-summary-label">Origen</span>' +
            '<span class="confirm-summary-value">' + origenLabel + '</span>' +
        '</div>' : '') +
        '<div class="confirm-summary-row" style="border-top:1px solid var(--neutral-200);padding-top:0.55rem">' +
            '<span class="confirm-summary-label">Stock actual</span>' +
            '<span class="confirm-summary-value">' +
                '<span class="stock-hint">Disp: <strong>' + disponibleActual + '</strong> &middot; Reserv: <strong>' + reservadoActual + '</strong> &middot; Total: <strong>' + totalActual + '</strong></span>' +
            '</span>' +
        '</div>' +
        impactHtml;

    rowsContainer.innerHTML = rowsHtml;
    container.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function ocultarConfirmacionMovimiento() {
    var container = document.getElementById('movimiento-confirmacion');
    if (container) container.classList.add('hidden');
}

/* ================================================================ */
/*  DRAWER MOVIMIENTO                                                */
/* ================================================================ */

function abrirDrawerMovimiento(tipo, productoId) {
    InventarioState.tipoMovimientoActual = tipo;
    InventarioState.stepActual = 'select';

    document.getElementById('drawer-titulo').textContent = tipo === 'entrada'
        ? 'Registrar Entrada'
        : tipo === 'salida'
            ? 'Registrar Salida'
            : 'Registrar Ajuste';
    document.getElementById('btn-guardar-mov').textContent = tipo === 'entrada'
        ? 'Confirmar Entrada'
        : tipo === 'salida'
            ? 'Confirmar Salida'
            : 'Confirmar Ajuste';

    // Clear autocomplete + hidden select + other form fields
    var autocompleteInput = document.getElementById('producto-autocomplete-input');
    if (autocompleteInput) {
        autocompleteInput.value = '';
        autocompleteInput.setAttribute('aria-expanded', 'false');
    }
    var clearBtn = document.getElementById('producto-autocomplete-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    var resultsEl = document.getElementById('producto-autocomplete-results');
    if (resultsEl) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
    }
    var hiddenSelect = document.getElementById('select-producto');
    if (hiddenSelect) hiddenSelect.value = '';

    modulos.limpiarForm(['input-cantidad', 'input-motivo', 'select-tipo-origen']);
    configurarFormularioMovimiento(tipo);
    ocultarAlertaId('drawer-alert');
    actualizarStepIndicator('select');
    ocultarConfirmacionMovimiento();

    // Preselect product if provided (deep-link support)
    if (productoId) {
        var producto = (InventarioState.productosData || []).find(function(p) {
            return String(p.id) === String(productoId);
        });
        if (producto) {
            if (autocompleteInput) autocompleteInput.value = producto.nombre;
            if (clearBtn) clearBtn.classList.remove('hidden');
            if (hiddenSelect) hiddenSelect.value = productoId;
            actualizarAyudaMovimiento();
        } else {
            // Product ID provided but not yet loaded — try setting select value anyway
            if (hiddenSelect) hiddenSelect.value = productoId;
            actualizarAyudaMovimiento();
        }
    }

    // Reset hint
    var ayuda = document.getElementById('movimiento-stock-hint');
    if (ayuda) {
        ayuda.className = 'stock-hint stock-hint--info';
        if (tipo === 'salida') ayuda.className = 'stock-hint stock-hint--warning';
        if (tipo === 'ajuste') ayuda.className = 'stock-hint stock-hint--accent';
    }

    modulos.abrirModal('drawer-movimiento-overlay');
    // Recreate icons for the autocomplete field
    if (window.lucide) lucide.createIcons();
}

function configurarFormularioMovimiento(tipo) {
    const selectTipoOrigen = document.getElementById('select-tipo-origen');
    const grupoTipoOrigen = document.getElementById('grupo-tipo-origen');
    const labelCantidad = document.getElementById('label-cantidad');
    const inputCantidad = document.getElementById('input-cantidad');
    const labelMotivo = document.getElementById('label-motivo');
    const inputMotivo = document.getElementById('input-motivo');
    inputCantidad.min = tipo === 'ajuste' ? '0' : '1';

    if (tipo === 'entrada') {
        grupoTipoOrigen.classList.remove('hidden');
        selectTipoOrigen.required = true;
        modulos.limpiarSelect('select-tipo-origen', [
            { value: 'REPOSICION', label: 'Reposición' },
            { value: 'AJUSTE_MANUAL', label: 'Ajuste Manual' }
        ], 'Selecciona un origen...');
        labelCantidad.textContent = 'Cantidad *';
        inputCantidad.placeholder = 'Ej: 10';
        labelMotivo.textContent = 'Motivo / Observación';
        inputMotivo.required = false;
        inputMotivo.placeholder = 'Ej: Compra de nuevo lote...';
        actualizarAyudaMovimiento();
        return;
    }

    if (tipo === 'salida') {
        grupoTipoOrigen.classList.remove('hidden');
        selectTipoOrigen.required = true;
        modulos.limpiarSelect('select-tipo-origen', [
            { value: 'AJUSTE_MANUAL', label: 'Ajuste Manual' },
            { value: 'DAÑO', label: 'Daño' },
            { value: 'PERDIDA', label: 'Pérdida' }
        ], 'Selecciona un origen...');
        labelCantidad.textContent = 'Cantidad *';
        inputCantidad.placeholder = 'Ej: 3';
        labelMotivo.textContent = 'Motivo / Observación';
        inputMotivo.required = false;
        inputMotivo.placeholder = 'Ej: Producto dañado durante transporte...';
        actualizarAyudaMovimiento();
        return;
    }

    grupoTipoOrigen.classList.add('hidden');
    selectTipoOrigen.required = false;
    selectTipoOrigen.value = '';
    labelCantidad.textContent = 'Cantidad Física Contada *';
    inputCantidad.placeholder = 'Ej: 25';
    labelMotivo.textContent = 'Motivo del Ajuste *';
    inputMotivo.required = true;
    inputMotivo.placeholder = 'Ej: Conteo manual de cierre semanal...';
    actualizarAyudaMovimiento();
}

function cerrarDrawer(e) {
    if (e && e.target.id !== 'drawer-movimiento-overlay' && e.type === 'click') return;
    // Clean up autocomplete state
    var autoInput = document.getElementById('producto-autocomplete-input');
    if (autoInput) autoInput.value = '';
    var clearBtn = document.getElementById('producto-autocomplete-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    var resultsEl = document.getElementById('producto-autocomplete-results');
    if (resultsEl) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
    }
    var hiddenSelect = document.getElementById('select-producto');
    if (hiddenSelect) hiddenSelect.value = '';
    ocultarConfirmacionMovimiento();
    modulos.cerrarModal('drawer-movimiento-overlay');
}

/* ================================================================ */
/*  DRAWER PRODUCTO                                                  */
/* ================================================================ */

function abrirDrawerProductoCrear() {
    InventarioState.productoEditandoId = null;
    document.getElementById('drawer-producto-titulo').textContent = 'Nuevo Producto';
    document.getElementById('btn-guardar-producto').textContent = 'Guardar Producto';
    document.getElementById('producto-create-fields').classList.remove('hidden');
    document.getElementById('producto-edit-fields').classList.add('hidden');
    modulos.limpiarForm([
        'input-producto-nombre',
        'input-producto-descripcion',
        'input-producto-cantidad',
        'input-producto-precio',
        'input-producto-stock-minimo'
    ]);
    document.getElementById('select-producto-estado-create').value = 'ACTIVO';
    document.getElementById('producto-estado-actual').innerHTML = getBadgeEstadoProducto('ACTIVO');
    // Set mode badge
    var modoBadge = document.getElementById('drawer-producto-modo');
    if (modoBadge) {
        modoBadge.textContent = 'Creaci\u00f3n';
        modoBadge.className = 'drawer-mode-badge drawer-mode-badge--create';
    }
    ocultarAlertaId('drawer-producto-alert');
    modulos.abrirModal('drawer-producto-overlay');
}

async function abrirDrawerProductoEditar(id) {
    try {
        const producto = await API.productos.get(id);
        InventarioState.productoEditandoId = id;

        document.getElementById('drawer-producto-titulo').textContent = 'Editar Producto';
        document.getElementById('btn-guardar-producto').textContent = 'Actualizar Producto';
        document.getElementById('producto-create-fields').classList.add('hidden');
        document.getElementById('producto-edit-fields').classList.remove('hidden');

        document.getElementById('input-producto-nombre').value = producto.nombre || '';
        document.getElementById('input-producto-descripcion').value = producto.descripcion || '';
        document.getElementById('input-producto-precio').value = producto.precioUnitario ?? '';
        document.getElementById('input-producto-stock-minimo').value = producto.stockMinimo ?? '';
        document.getElementById('producto-estado-actual').innerHTML = getBadgeEstadoProducto(producto.estado || 'ACTIVO');

        // Set mode badge
        var modoBadge = document.getElementById('drawer-producto-modo');
        if (modoBadge) {
            modoBadge.textContent = 'Edici\u00f3n';
            modoBadge.className = 'drawer-mode-badge drawer-mode-badge--edit';
        }

        ocultarAlertaId('drawer-producto-alert');
        modulos.abrirModal('drawer-producto-overlay');
    } catch (err) {
        mostrarAlerta('error', 'No se pudo cargar el producto: ' + err.message);
    }
}

function cerrarDrawerProducto(e) {
    if (e && e.target.id !== 'drawer-producto-overlay' && e.type === 'click') return;
    modulos.cerrarModal('drawer-producto-overlay');
}

/* ================================================================ */
/*  MODAL ESTADO PRODUCTO                                            */
/* ================================================================ */

function abrirModalProductoEstado(id, accion) {
    InventarioState.productoEstadoPendiente = { id, accion };
    const producto = InventarioState.productosData.find(p => p.id === id);
    const nombre = producto?.nombre || `Producto #${id}`;
    const esReactivar = accion === 'reactivar';

    document.getElementById('modal-producto-estado-titulo').textContent = esReactivar ? '¿Reactivar producto?' : '¿Desactivar producto?';
    document.getElementById('modal-producto-estado-mensaje').innerHTML = esReactivar
        ? `Vas a reactivar <strong>${formatters.textoSeguro(nombre)}</strong> para volver a ofrecerlo en formularios y operaciones.`
        : `Vas a desactivar <strong>${formatters.textoSeguro(nombre)}</strong>. La baja es lógica: el producto seguirá existiendo para historial y reportes.`;

    const btn = document.getElementById('btn-confirmar-producto-estado');
    btn.className = esReactivar ? 'btn btn-success' : 'btn btn-danger';
    btn.textContent = esReactivar ? 'Reactivar' : 'Desactivar';

    modulos.abrirModal('modal-producto-estado');
}

function cerrarModalProductoEstado() {
    InventarioState.productoEstadoPendiente = null;
    modulos.cerrarModal('modal-producto-estado');
}

async function confirmarCambioEstadoProducto() {
    if (!InventarioState.productoEstadoPendiente) return;

    try {
        if (InventarioState.productoEstadoPendiente.accion === 'reactivar') {
            await API.productos.reactivar(InventarioState.productoEstadoPendiente.id);
            mostrarAlerta('success', 'Producto reactivado correctamente.');
        } else {
            await API.productos.eliminar(InventarioState.productoEstadoPendiente.id);
            mostrarAlerta('success', 'Producto desactivado correctamente.');
        }

        cerrarModalProductoEstado();
        await refrescarInventario();
    } catch (err) {
        mostrarAlerta('error', 'Error: ' + err.message);
        cerrarModalProductoEstado();
    }
}

/* ================================================================ */
/*  SUBMIT: MOVIMIENTO                                               */
/* ================================================================ */

async function guardarMovimiento(e) {
    e.preventDefault();
    ocultarAlertaId('drawer-alert');

    const submitBtn = document.getElementById('btn-guardar-mov');
    if (submitBtn) submitBtn.disabled = true;

    const productoId = parseInt(document.getElementById('select-producto').value, 10);
    const cantidad = parseInt(document.getElementById('input-cantidad').value, 10);
    const motivo = document.getElementById('input-motivo').value.trim();
    const tipoOrigen = document.getElementById('select-tipo-origen').value;
    const stock = getStockProductoLocal(productoId);

    if (!productoId || Number.isNaN(productoId)) {
        mostrarAlertaId('drawer-alert', 'error', 'Seleccioná un producto válido.');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    if (Number.isNaN(cantidad) || cantidad < (InventarioState.tipoMovimientoActual === 'ajuste' ? 0 : 1)) {
        mostrarAlertaId('drawer-alert', 'error', InventarioState.tipoMovimientoActual === 'ajuste'
            ? 'Ingresá un conteo físico válido mayor o igual a 0.'
            : 'Ingresá una cantidad válida mayor a 0.');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    if (InventarioState.tipoMovimientoActual === 'entrada' && !['REPOSICION', 'AJUSTE_MANUAL'].includes(tipoOrigen)) {
        mostrarAlertaId('drawer-alert', 'error', 'Complete producto, cantidad y origen válido para entrada.');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    if (InventarioState.tipoMovimientoActual === 'salida') {
        if (!['DAÑO', 'PERDIDA', 'AJUSTE_MANUAL'].includes(tipoOrigen)) {
            mostrarAlertaId('drawer-alert', 'error', 'Complete producto, cantidad y origen válido para salida.');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (stock && cantidad > Number(stock.cantidadDisponible || 0)) {
            mostrarAlertaId('drawer-alert', 'error', `Stock insuficiente para "${stock.nombre}". Disponible: ${stock.cantidadDisponible}, solicitado: ${cantidad}.`);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
    }

    if (InventarioState.tipoMovimientoActual === 'ajuste') {
        const producto = InventarioState.productosData.find(item => String(item.id) === String(productoId));
        if (producto?.estado === 'INACTIVO') {
            mostrarAlertaId('drawer-alert', 'error', 'No se puede ajustar un producto inactivo.');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (!motivo) {
            mostrarAlertaId('drawer-alert', 'error', 'El motivo del ajuste es obligatorio.');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (stock && cantidad < Number(stock.cantidadReservada || 0)) {
            mostrarAlertaId('drawer-alert', 'error', 'No se puede ajustar por debajo de la reserva activa del producto.');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
    }

    try {
        if (InventarioState.tipoMovimientoActual === 'entrada') {
            await API.inventario.entrada({ productoId, cantidad, tipoOrigen, motivo });
        } else if (InventarioState.tipoMovimientoActual === 'salida') {
            await API.inventario.salida({ productoId, cantidad, tipoOrigen, motivo });
        } else {
            await API.inventario.ajuste(productoId, { cantidadFisica: cantidad, motivo });
        }

        mostrarAlerta('success', 'Movimiento registrado correctamente.');
        cerrarDrawer();
        await refrescarInventario();
    } catch (err) {
        mostrarAlertaId('drawer-alert', 'error', 'Error: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

/* ================================================================ */
/*  SUBMIT: PRODUCTO                                                 */
/* ================================================================ */

function validarProductoPayload(payload, esEdicion) {
    if (!payload.nombre) return 'El nombre es obligatorio.';
    if (!esEdicion && (!payload.cantidadTotal || payload.cantidadTotal <= 0)) return 'El stock físico inicial debe ser mayor a 0.';
    if (payload.stockMinimo != null && payload.stockMinimo !== '' && Number(payload.stockMinimo) < 0) return 'El stock mínimo no puede ser negativo.';
    if (payload.precioUnitario != null && payload.precioUnitario !== '' && Number(payload.precioUnitario) < 0) return 'El precio unitario no puede ser negativo.';
    return '';
}

async function guardarProducto(e) {
    e.preventDefault();
    ocultarAlertaId('drawer-producto-alert');

    const submitBtn = document.getElementById('btn-guardar-producto');
    if (submitBtn) submitBtn.disabled = true;

    const esEdicion = !!InventarioState.productoEditandoId;
    const nombre = document.getElementById('input-producto-nombre').value.trim();
    const descripcion = document.getElementById('input-producto-descripcion').value.trim();
    const cantidadTotal = parseInt(document.getElementById('input-producto-cantidad').value, 10);
    const precioUnitarioRaw = document.getElementById('input-producto-precio').value;
    const stockMinimoRaw = document.getElementById('input-producto-stock-minimo').value;

    const validacion = validarProductoPayload({ nombre, cantidadTotal, stockMinimo: stockMinimoRaw, precioUnitario: precioUnitarioRaw }, esEdicion);
    if (validacion) {
        mostrarAlertaId('drawer-producto-alert', 'error', validacion);
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        if (esEdicion) {
            await API.productos.actualizar(InventarioState.productoEditandoId, {
                nombre,
                descripcion: descripcion || null,
                precioUnitario: precioUnitarioRaw === '' ? null : parseFloat(precioUnitarioRaw),
                stockMinimo: stockMinimoRaw === '' ? null : parseInt(stockMinimoRaw, 10)
            });
            mostrarAlerta('success', 'Producto actualizado correctamente.');
        } else {
            await API.productos.crear({
                nombre,
                descripcion: descripcion || null,
                cantidadTotal,
                estado: document.getElementById('select-producto-estado-create').value
            });
            mostrarAlerta('success', 'Producto creado correctamente.');
        }

        cerrarDrawerProducto();
        await refrescarInventario();
        cambiarTab('productos');
    } catch (err) {
        mostrarAlertaId('drawer-producto-alert', 'error', 'Error: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

/* ================================================================ */
/*  PER‑PRODUCT HISTORY: PRODUCT SELECTION                           */
/* ================================================================ */

/**
 * Select a product for per‑product history view and load its movements.
 * Called from: search autocomplete results, suggestion chips, deep‑links.
 */
function seleccionarProductoHistorial(id) {
    // Normalize ID to number
    const productoId = Number(id);
    if (!productoId || Number.isNaN(productoId)) return;

    // Find product name from either data source
    const producto = InventarioState.productosData.find(p => String(p.id) === String(productoId))
        || InventarioState.stockData.find(s => String(s.idProducto) === String(productoId));
    const nombre = producto?.nombre || '';

    // Update state
    InventarioState.productoHistorialSeleccionadoId = productoId;
    InventarioState.productoHistorialSeleccionadoNombre = nombre;

    // Sync hidden select (legacy compat)
    const select = document.getElementById('select-producto-historial');
    if (select) select.value = productoId;

    // Update search input to show selected product name
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) searchInput.value = nombre;

    // Show clear button
    const clearBtn = document.getElementById('product-search-clear');
    if (clearBtn) clearBtn.classList.remove('hidden');

    // Hide search results dropdown
    const results = document.getElementById('product-search-results');
    if (results) {
        results.classList.add('hidden');
        results.innerHTML = '';
    }

    // Show context badge with product name
    const badge = document.getElementById('mov-contexto-producto');
    const nombreEl = document.getElementById('mov-contexto-nombre');
    if (badge && nombreEl) {
        nombreEl.textContent = nombre || 'Producto #' + productoId;
        badge.classList.remove('hidden');
    }

    // Hide suggestions section
    const suggestions = document.getElementById('product-suggestions');
    if (suggestions) suggestions.classList.add('hidden');

    // Show secondary filters
    const movFilters = document.getElementById('mov-producto-filters');
    if (movFilters) movFilters.classList.remove('hidden');

    // Track recent selection
    addProductoReciente(productoId, nombre);

    // Load movements
    cargarMovimientosPorProducto(productoId);
    if (window.lucide) lucide.createIcons();
}

/**
 * Clear product selection and restore default suggestions state.
 */
function limpiarSeleccionProductoHistorial() {
    InventarioState.productoHistorialSeleccionadoId = null;
    InventarioState.productoHistorialSeleccionadoNombre = '';

    // Clear search input and focus
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }

    // Hide clear button
    const clearBtn = document.getElementById('product-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');

    // Hide search results
    const results = document.getElementById('product-search-results');
    if (results) {
        results.classList.add('hidden');
        results.innerHTML = '';
    }

    // Hide context badge
    const badge = document.getElementById('mov-contexto-producto');
    if (badge) badge.classList.add('hidden');

    // Show suggestions
    const suggestions = document.getElementById('product-suggestions');
    if (suggestions) {
        suggestions.classList.remove('hidden');
        // Re‑render suggestions in case state changed
        if (typeof renderSugerenciasProductos === 'function') {
            renderSugerenciasProductos();
        }
    }

    // Hide secondary filters
    const movFilters = document.getElementById('mov-producto-filters');
    if (movFilters) movFilters.classList.add('hidden');

    // Clear movement search
    const movSearch = document.getElementById('search-movimientos');
    if (movSearch) movSearch.value = '';

    // Reset hidden select
    const select = document.getElementById('select-producto-historial');
    if (select) select.value = '';

    // Reset pagination state
    InventarioState.movimientosProductoPagination = null;
    InventarioState.movimientosProductoPaginaActual = 0;

    // Clear pagination UI
    const pagContainer = document.getElementById('paginacion-mov-producto');
    if (pagContainer) pagContainer.innerHTML = '';

    // Hide pagination info text
    const pagInfo = document.getElementById('mov-pagination-info');
    if (pagInfo) {
        pagInfo.classList.add('hidden');
        pagInfo.textContent = '';
    }

    // Show empty state
    InventarioState.movimientosData = [];
    renderEmptyState('tabla-movimientos', 6, 'search',
        'Seleccioná un producto',
        'Usá el buscador o los productos sugeridos para ver el historial de movimientos.');
}

/**
 * Track recently consulted products (session scope, max 5).
 */
function addProductoReciente(id, nombre) {
    const recientes = InventarioState.productosUltimosConsultados;
    const existIdx = recientes.findIndex(r => String(r.id) === String(id));
    if (existIdx !== -1) recientes.splice(existIdx, 1);
    recientes.unshift({ id: Number(id), nombre });
    if (recientes.length > 5) recientes.length = 5;
}

/**
 * Filter products locally by name. Used by the autocomplete search input.
 */
function buscarProductosLocal(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return InventarioState.productosData
        .filter(p => p.nombre.toLowerCase().includes(q))
        .slice(0, 10);
}
