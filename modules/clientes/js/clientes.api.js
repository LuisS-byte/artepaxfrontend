/**
 * modules/clientes/js/clientes.api.js
 * Capa de comunicación con backend del módulo Clientes
 */
window.ClientesAPI = {

    /**
     * Carga la lista de clientes según el filtro actual.
     * - activos: GET /api/clientes
     * - inactivos: GET /api/clientes/inactivos
     * - todos: combina activos e inactivos (no hay endpoint único)
     *
     * Actualiza ClientesState.clientes y renderiza la tabla.
     */
    async cargarClientes() {
        const tbody = document.getElementById('tabla-clientes');
        // Skeleton visual inicial
        tbody.innerHTML = '<tr><td colspan="4" class="loading-state"><div class="spinner"></div>Cargando datos...</td></tr>';

        try {
            if (ClientesState.filtroActual === 'inactivos') {
                ClientesState.clientes = await API.clientes.listarInactivos();
            } else if (ClientesState.filtroActual === 'todos') {
                // El backend no tiene un endpoint "todos", así que combinamos activos e inactivos.
                const activos = await API.clientes.list();
                const inactivos = await API.clientes.listarInactivos();
                ClientesState.clientes = [...activos, ...inactivos];
            } else {
                ClientesState.clientes = await API.clientes.list();
            }
            
            ClientesRender.aplicarRender();
        } catch (err) {
            mostrarAlerta('error', 'Error al conectar con el servidor: ' + err.message);
            tbody.innerHTML = `<tr><td colspan="4" class="error-state">Error al cargar clientes.</td></tr>`;
        }
    }
};
