/**
 * modules/clientes/clientes.js
 * Orquestador del módulo Clientes
 */

// Wrappers globales para handlers HTML (onclick/onsubmit/onchange/oncall)
// y para funciones internas que aún referencian estos nombres directamente.
// Se mantendrán hasta la fase data-action + window cleanup.

async function cargarClientes()          { return ClientesAPI.cargarClientes(); }
function cambiarFiltroEstado()           { ClientesActions.cambiarFiltroEstado(); }
function abrirDrawerCrear()              { ClientesActions.abrirDrawerCrear(); }
function abrirDrawerEditar(id)           { ClientesActions.abrirDrawerEditar(id); }
function cerrarDrawer(e)                 { ClientesActions.cerrarDrawer(e); }
function guardarCliente(e)               { ClientesActions.guardarCliente(e); }
function abrirModalEliminar(id, nombre)  { ClientesActions.abrirModalEliminar(id, nombre); }
function cerrarModalEliminar()           { ClientesActions.cerrarModalEliminar(); }
function confirmarEliminar()             { ClientesActions.confirmarEliminar(); }
function reactivarCliente(id)            { ClientesActions.reactivarCliente(id); }

// ── INICIALIZACIÓN ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    ClientesActions.initSearch();
});
