/**
 * modules/auditoria/auditoria.js
 * Orquestador del módulo Auditoría
 */

// Wrappers globales para handlers HTML (onclick/onchange/oninput)
async function cargarAuditoria(pagina)       { return AuditoriaActions.cargarAuditoria(pagina); }
function onFiltroTablaChange()               { AuditoriaActions.onFiltroTablaChange(); }
function onFiltroRegistroChange()            { AuditoriaActions.onFiltroRegistroChange(); }
function filtrarLocal()                      { AuditoriaActions.filtrarLocal(); }
function abrirDetalle(id)                    { AuditoriaActions.abrirDetalle(id); }
function cerrarModalDetalle(e)               { AuditoriaActions.cerrarModalDetalle(e); }

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    AuditoriaActions.init();
});
