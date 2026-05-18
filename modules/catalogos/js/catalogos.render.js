/**
 * modules/catalogos/js/catalogos.render.js
 * Carga de datos y renderizado de tablas del módulo Catálogos.
 * Depende de: CatalogosState (state.js), formatters, modulos, API
 * Renderiza únicamente Tipos de Evento.
 */

async function cargarTiposEvento() {
    modulos.setTableLoading('tabla-tipos-evento', 4, 'Cargando tipos de evento...');

    try {
        CatalogosState.tiposEvento = await API.tiposEvento.list();
        modulos.renderTabla(CatalogosState.tiposEvento, 'tabla-tipos-evento', CatalogosState.COLUMNAS_TIPOS_EVENTO);
    } catch (err) {
        modulos.setTableError('tabla-tipos-evento', 4, 'Error: ' + err.message);
    }
}
