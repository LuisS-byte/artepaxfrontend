/**
 * modules/catalogos/catalogos.js
 * Orquestador del módulo Catálogos.
 * Catálogos administra únicamente Tipos de Evento.
 * Estado en CatalogosState (js/catalogos.state.js).
 */

document.addEventListener('DOMContentLoaded', () => {
    cargarTiposEvento();
    initCatalogosSearch();
});
