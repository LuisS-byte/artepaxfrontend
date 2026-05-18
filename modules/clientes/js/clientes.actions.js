/**
 * modules/clientes/js/clientes.actions.js
 * Acciones de usuario del módulo Clientes: drawers, modal, mutaciones, filtros y búsqueda
 */
window.ClientesActions = {

    // ── FILTROS ────────────────────────────────────────────

    cambiarFiltroEstado() {
        ClientesState.filtroActual = document.getElementById('filter-estado').value;
        cargarClientes();
    },

    // ── DRAWER CREAR / EDITAR ──────────────────────────────

    abrirDrawerCrear() {
        ClientesState.clienteEditandoId = null;
        document.getElementById('drawer-titulo').textContent = 'Nuevo Cliente';
        document.getElementById('btn-guardar').textContent = 'Guardar Cliente';

        modulos.limpiarForm(['input-nombre', 'input-telefono', 'input-correo', 'input-direccion']);
        ocultarAlertaId('drawer-alert');

        modulos.abrirModal('drawer-cliente-overlay');
    },

    abrirDrawerEditar(id) {
        const cliente = ClientesState.clientes.find(c => c.id === id);
        if (!cliente) return;

        ClientesState.clienteEditandoId = id;
        document.getElementById('drawer-titulo').textContent = 'Editar Cliente';
        document.getElementById('btn-guardar').textContent = 'Actualizar Datos';

        document.getElementById('input-nombre').value = cliente.nombre || '';
        document.getElementById('input-telefono').value = cliente.telefono || '';
        document.getElementById('input-correo').value = cliente.correo || '';
        document.getElementById('input-direccion').value = cliente.direccion || '';

        ocultarAlertaId('drawer-alert');
        modulos.abrirModal('drawer-cliente-overlay');
    },

    cerrarDrawer(e) {
        if (e && e.target.id !== 'drawer-cliente-overlay' && e.type === 'click') return;
        modulos.cerrarModal('drawer-cliente-overlay');
    },

    async guardarCliente(e) {
        e.preventDefault();
        ocultarAlertaId('drawer-alert');

        const submitBtn = document.getElementById('btn-guardar');
        submitBtn.disabled = true;

        const body = ClientesHelpers.construirPayload();

        try {
            if (ClientesState.clienteEditandoId) {
                await API.clientes.actualizar(ClientesState.clienteEditandoId, body);
                mostrarAlerta('success', 'Cliente actualizado exitosamente.');
            } else {
                await API.clientes.crear(body);
                mostrarAlerta('success', 'Cliente registrado correctamente.');
            }
            this.cerrarDrawer();
            cargarClientes();
        } catch (err) {
            mostrarAlertaId('drawer-alert', 'error', 'Error: ' + err.message);
        } finally {
            submitBtn.disabled = false;
        }
    },

    // ── MODAL DESACTIVAR / REACTIVAR ───────────────────────

    abrirModalEliminar(id, nombre) {
        ClientesState.clienteEliminandoId = id;
        document.getElementById('nombre-eliminar').textContent = nombre;
        modulos.abrirModal('modal-eliminar');
    },

    cerrarModalEliminar() {
        modulos.cerrarModal('modal-eliminar');
    },

    async confirmarEliminar() {
        try {
            await API.clientes.eliminar(ClientesState.clienteEliminandoId);
            this.cerrarModalEliminar();
            mostrarAlerta('success', 'Cliente desactivado correctamente.');
            cargarClientes();
        } catch (err) {
            mostrarAlerta('error', 'No se pudo desactivar: ' + err.message);
            this.cerrarModalEliminar();
        }
    },

    async reactivarCliente(id) {
        try {
            await API.clientes.reactivar(id);
            mostrarAlerta('success', 'Cliente reactivado correctamente.');
            cargarClientes();
        } catch (err) {
            mostrarAlerta('error', 'Error al reactivar: ' + err.message);
        }
    },

    // ── BÚSQUEDA ───────────────────────────────────────────

    initSearch() {
        document.getElementById('search-input').addEventListener('input', debounce(async function () {
            const q = this.value.trim();
            if (!q) {
                ClientesRender.aplicarRender();
                return;
            }

            // Cuando ya tenemos todos los datos cargados (inactivos/todos), filtrar local
            if (ClientesState.filtroActual !== 'activos') {
                const ql = q.toLowerCase();
                const filtrados = ClientesState.clientes.filter(c =>
                    (c.nombre || '').toLowerCase().includes(ql) ||
                    (c.correo || '').toLowerCase().includes(ql) ||
                    (c.telefono || '').toLowerCase().includes(ql)
                );
                ClientesRender.aplicarRender(filtrados);
                return;
            }

            // Para activos, el backend hace búsqueda parcial case-insensitive
            const tbody = document.getElementById('tabla-clientes');
            tbody.innerHTML = '<tr><td colspan="4" class="loading-state"><div class="spinner"></div>Buscando...</td></tr>';
            try {
                const resultados = await API.clientes.buscar(q);
                ClientesRender.aplicarRender(resultados);
            } catch (err) {
                mostrarAlerta('error', 'Error al buscar: ' + err.message);
                ClientesRender.aplicarRender();
            }
        }, 300));
    }
};
