/**
 * modules/catalogos/js/catalogos.actions.js
 * Acciones y drawers del módulo Catálogos.
 * Depende de: CatalogosState (state.js), cargarTiposEvento() (render.js), formatters, modulos, API
 * Gestiona únicamente Tipos de Evento.
 */

// ── DRAWER CREAR / EDITAR ──────────────────────────────

function abrirDrawerCrear() {
    CatalogosState.tipoEventoEditandoId = null;
    document.getElementById('drawer-titulo').textContent = 'Nuevo Tipo de Evento';
    document.getElementById('btn-guardar-tipo').textContent = 'Guardar';

    modulos.limpiarForm(['input-nombre', 'input-descripcion']);
    ocultarAlertaId('drawer-alert');

    modulos.abrirModal('drawer-tipo-evento-overlay');
}

function abrirDrawerEditar(id) {
    const tipo = CatalogosState.tiposEvento.find(t => t.id === id);
    if (!tipo) return;

    CatalogosState.tipoEventoEditandoId = id;
    document.getElementById('drawer-titulo').textContent = 'Editar Tipo de Evento';
    document.getElementById('btn-guardar-tipo').textContent = 'Guardar Cambios';

    document.getElementById('input-nombre').value = tipo.tipoNombre || '';
    document.getElementById('input-descripcion').value = tipo.tipoDescripcion || '';

    ocultarAlertaId('drawer-alert');
    modulos.abrirModal('drawer-tipo-evento-overlay');
}

function cerrarDrawer(e) {
    if (e && e.target.id !== 'drawer-tipo-evento-overlay' && e.type === 'click') return;
    modulos.cerrarModal('drawer-tipo-evento-overlay');
}

// ── GUARDAR TIPO DE EVENTO ─────────────────────────────

async function guardarTipoEvento(e) {
    e.preventDefault();
    ocultarAlertaId('drawer-alert');

    const submitBtn = document.getElementById('btn-guardar-tipo');
    submitBtn.disabled = true;

    const body = {
        nombre: document.getElementById('input-nombre').value.trim(),
        descripcion: document.getElementById('input-descripcion').value.trim()
    };

    try {
        if (CatalogosState.tipoEventoEditandoId) {
            // El backend no expone un endpoint PUT/PATCH para actualizar tipos de evento.
            // Se intenta la llamada por si se agrega en el futuro.
            await API.tiposEvento.actualizar(CatalogosState.tipoEventoEditandoId, body);
            mostrarAlerta('success', 'Tipo de evento actualizado exitosamente.');
        } else {
            await API.tiposEvento.crear(body);
            mostrarAlerta('success', 'Nuevo tipo de evento registrado.');
        }
        cerrarDrawer();
        cargarTiposEvento();
    } catch (err) {
        if (CatalogosState.tipoEventoEditandoId) {
            mostrarAlertaId('drawer-alert', 'error',
                'La edición de tipos de evento no está disponible en el servidor. ' +
                'Podés desactivar este tipo y crear uno nuevo si necesitas cambios. ' +
                '(Error: ' + err.message + ')');
        } else {
            mostrarAlertaId('drawer-alert', 'error', 'Error: ' + err.message);
        }
    } finally {
        submitBtn.disabled = false;
    }
}

// ── TOGGLE ESTADO ──────────────────────────────────────

async function toggleTipoEvento(id) {
    try {
        await API.tiposEvento.toggle(id);
        cargarTiposEvento();
    } catch (err) {
        mostrarAlerta('error', 'Error al cambiar estado: ' + err.message);
    }
}

// ── BÚSQUEDA LOCAL ─────────────────────────────────────

function initCatalogosSearch() {
    const input = document.getElementById('search-tipos-evento');
    if (!input) return;

    input.addEventListener('input', debounce(function () {
        const q = this.value.trim().toLowerCase();

        if (!q) {
            modulos.renderTabla(CatalogosState.tiposEvento, 'tabla-tipos-evento', CatalogosState.COLUMNAS_TIPOS_EVENTO);
            return;
        }

        const filtrados = CatalogosState.tiposEvento.filter(t =>
            (t.tipoNombre || '').toLowerCase().includes(q) ||
            (t.tipoDescripcion || '').toLowerCase().includes(q)
        );

        if (filtrados.length === 0) {
            modulos.renderEmpty('tabla-tipos-evento', CatalogosState.COLUMNAS_TIPOS_EVENTO.length, {
                icon: 'search-x',
                title: 'Sin resultados',
                message: `No se encontraron tipos de evento que coincidan con "${q}".`
            });
        } else {
            modulos.renderTabla(filtrados, 'tabla-tipos-evento', CatalogosState.COLUMNAS_TIPOS_EVENTO);
        }
    }, 300));
}
