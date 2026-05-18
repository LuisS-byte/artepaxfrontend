/**
 * modules/auditoria/js/auditoria.state.js
 * Estado centralizado del módulo Auditoría
 */
window.AuditoriaState = {
    auditoriaActual: [],
    tablaActual: '',
    paginaActual: 0,
    registroDebounce: null,
    usuarios: [],
    usuariosMap: {},
    fechaDesde: '',
    fechaHasta: ''
};
