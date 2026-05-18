/**
 * modules/clientes/js/clientes.state.js
 * Estado centralizado del módulo Clientes
 */
window.ClientesState = {
    clientes: [],
    filtroActual: 'activos', // 'activos', 'inactivos', 'todos'
    clienteEditandoId: null,
    clienteEliminandoId: null
};
