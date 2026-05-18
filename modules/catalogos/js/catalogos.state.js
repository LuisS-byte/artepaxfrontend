/**
 * modules/catalogos/js/catalogos.state.js
 * Estado global del módulo Catálogos.
 * Administra únicamente Tipos de Evento.
 */

window.CatalogosState = {
    tiposEvento: [],
    tipoEventoEditandoId: null,

    COLUMNAS_TIPOS_EVENTO: [
        {
            label: 'Nombre',
            render: row => `<td><strong>${formatters.textoSeguro(row.tipoNombre)}</strong></td>`
        },
        {
            label: 'Descripción',
            render: row => `<td><span class="text-sm">${formatters.textoSeguro(row.tipoDescripcion || '—')}</span></td>`
        },
        {
            label: 'Estado',
            render: row => `<td>${modulos.badgeEstado(row.tipoActivo ? 'ACTIVO' : 'INACTIVO')}</td>`
        },
        {
            label: 'Acciones',
            render: row => `
                <td class="acciones-cell">
                    <span class="catalog-actions">
                        <button class="btn btn-outline btn-sm" onclick="abrirDrawerEditar(${row.id})">Editar</button>
                        <button class="btn btn-outline btn-sm" onclick="toggleTipoEvento(${row.id})">${row.tipoActivo ? 'Desactivar' : 'Activar'}</button>
                    </span>
                </td>`
        }
    ]
};
