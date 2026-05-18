/**
 * modules/pagos/js/pagos.metodos.js
 * Catálogo de métodos de pago: carga, render, CRUD y toggle.
 * 
 * Dependencias:
 *   PagosState                       (js/pagos.state.js)
 *   PagosColumns                     (js/pagos.columns.js)
 *   renderEmptyRow()                 (js/pagos.evento.js)
 *   API.catalogosPago.*              (js/shared/api.js)
 *   modulos.*                        (js/shared/modulos.js)
 *   mostrarAlerta(), mostrarAlertaId(), ocultarAlertaId()  (js/shared/alerts.js)
 *   cambiarTab()                     (js/pagos.js)
 */

// ── Carga de catálogos ─────────────────────────────────────

async function cargarCatalogosPago() {
    try {
        const [estados, conceptos, metodos] = await Promise.all([
            API.catalogosPago.estados(),
            API.catalogosPago.conceptos(),
            API.catalogosPago.metodos()
        ]);

        PagosState.estadosPago = estados || [];
        PagosState.conceptosPago = conceptos || [];
        PagosState.metodosPagoTodos = metodos || [];
        PagosState.metodosPagoActivos = PagosState.metodosPagoTodos.filter(metodo => metodo.metodoActivo !== false);

        renderizarOpcionesCatalogo();
        renderizarFiltroConceptos();
        renderizarFiltroEstados();
        renderizarTablaMetodos();
        actualizarResumenMetodos();
    } catch (err) {
        mostrarAlerta('error', 'Error al cargar catálogos de pago: ' + err.message);
    }
}

// ── Renderizado de opciones ────────────────────────────────

function renderizarOpcionesCatalogo() {
    const selectConcepto = document.getElementById('select-concepto-pago');
    const selectMetodo = document.getElementById('select-metodo-pago');
    if (!selectConcepto || !selectMetodo) return;

    selectConcepto.innerHTML = '<option value="">-- Selecciona un concepto --</option>';
    selectMetodo.innerHTML = '<option value="">-- Selecciona un método --</option>';

    PagosState.conceptosPago.forEach(concepto => {
        const option = document.createElement('option');
        option.value = concepto.id;
        option.textContent = concepto.conceptoNombre;
        selectConcepto.appendChild(option);
    });

    PagosState.metodosPagoActivos.forEach(metodo => {
        const option = document.createElement('option');
        option.value = metodo.id;
        option.textContent = metodo.metodoNombre;
        selectMetodo.appendChild(option);
    });
}

function renderizarFiltroConceptos() {
    const select = document.getElementById('filter-concepto-pago');
    if (!select) return;

    select.innerHTML = '<option value="">Todos</option>';
    PagosState.conceptosPago.forEach(concepto => {
        const option = document.createElement('option');
        option.value = concepto.conceptoNombre;
        option.textContent = concepto.conceptoNombre;
        select.appendChild(option);
    });
}

function renderizarFiltroEstados() {
    const select = document.getElementById('filter-estado-pago');
    if (!select) return;

    const selected = select.value;
    select.innerHTML = '<option value="">Todos</option>';
    PagosState.estadosPago.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado.estadoNombre;
        option.textContent = estado.estadoNombre.replaceAll('_', ' ');
        select.appendChild(option);
    });

    if (selected && select.querySelector(`option[value="${selected}"]`)) {
        select.value = selected;
    }
}

// ── Tabla de métodos ───────────────────────────────────────

function renderizarTablaMetodos() {
    if (!document.getElementById('tabla-metodos-pago')) return;

    if (!PagosState.metodosPagoTodos.length) {
        renderEmptyRow('tabla-metodos-pago', 4, 'No hay métodos de pago registrados.');
        return;
    }

    modulos.renderTabla(PagosState.metodosPagoTodos, 'tabla-metodos-pago', PagosColumns.METODOS);
}

function actualizarResumenMetodos() {
    const total = PagosState.metodosPagoTodos.length;
    const activos = PagosState.metodosPagoTodos.filter(m => m.metodoActivo !== false).length;
    const inactivos = total - activos;

    const totalEl = document.getElementById('metodos-total');
    const activosEl = document.getElementById('metodos-activos');
    const inactivosEl = document.getElementById('metodos-inactivos');

    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;
    if (inactivosEl) inactivosEl.textContent = inactivos;
}

// ── Drawer: Crear Método ───────────────────────────────────

function abrirDrawerMetodo() {
    modulos.limpiarForm(['input-metodo-nombre', 'input-metodo-descripcion']);
    ocultarAlertaId('drawer-metodo-alert');
    modulos.abrirModal('drawer-metodo-overlay');
}

function cerrarDrawerMetodo(e) {
    if (e && e.target.id !== 'drawer-metodo-overlay' && e.type === 'click') return;
    modulos.cerrarModal('drawer-metodo-overlay');
}

function validarMetodoPago(nombre, descripcion) {
    const tieneTexto = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(nombre);
    if (!nombre || nombre.trim().length < 2 || !tieneTexto) {
        return 'El nombre debe contener texto válido y al menos 2 caracteres.';
    }

    if (descripcion && !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(descripcion)) {
        return 'La descripción debe contener texto válido si se envía.';
    }

    return '';
}

async function guardarMetodoPago(e) {
    e.preventDefault();

    const submitBtn = e.submitter || document.querySelector('#drawer-metodo-overlay [type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const nombre = document.getElementById('input-metodo-nombre').value.trim();
    const descripcion = document.getElementById('input-metodo-descripcion').value.trim();
    const validacion = validarMetodoPago(nombre, descripcion);

    if (validacion) {
        mostrarAlertaId('drawer-metodo-alert', 'error', validacion);
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        await API.catalogosPago.crearMetodo({
            nombre,
            descripcion: descripcion || null
        });

        mostrarAlerta('success', 'Método de pago creado correctamente.');
        cerrarDrawerMetodo();
        await cargarCatalogosPago();
        cambiarTab('metodos');
    } catch (err) {
        mostrarAlertaId('drawer-metodo-alert', 'error', 'Error: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ── Toggle activar/desactivar ──────────────────────────────

async function toggleMetodoPago(id) {
    try {
        await API.catalogosPago.toggleMetodo(id);
        mostrarAlerta('success', 'Estado del método actualizado correctamente.');
        await cargarCatalogosPago();
    } catch (err) {
        mostrarAlerta('error', 'Error al actualizar método: ' + err.message);
    }
}
