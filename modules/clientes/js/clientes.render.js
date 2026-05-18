/**
 * modules/clientes/js/clientes.render.js
 * Render layer del módulo Clientes: definición de columnas y renderizado
 */
window.ClientesRender = {
    COLUMNAS_CLIENTES: [
        { label: 'Nombre', render: row => `<td><strong>${formatters.textoSeguro(row.nombre)}</strong></td>` },
        { label: 'Contacto', render: row => `<td><div class="contact-info"><span class="text-muted">${formatters.textoSeguro(row.telefono || '—')}</span><br><span class="text-sm text-truncate" style="max-width:180px;display:inline-block;" title="${formatters.textoSeguro(row.correo || '')}">${formatters.textoSeguro(row.correo || '')}</span></div></td>` },
        { label: 'Estado', render: row => `<td>${modulos.badgeEstado(row.activo ? 'ACTIVO' : 'INACTIVO')}</td>` },
        { label: 'Acciones', render: row => `
                <td class="acciones-cell">
                    <div class="acciones-wrapper">
                        <button class="btn btn-outline btn-sm" onclick="abrirDrawerEditar(${row.id})">Editar</button>
                        ${row.activo 
                            ? `<button class="btn btn-outline btn-sm btn-danger-hover" onclick="abrirModalEliminar(${row.id}, '${formatters.textoSeguro(row.nombre)}')">Desactivar</button>`
                            : `<button class="btn btn-outline btn-sm btn-success-hover" onclick="reactivarCliente(${row.id})">Reactivar</button>`
                        }
                    </div>
                </td>` }
    ],

    /**
     * Renderiza la tabla de clientes.
     * @param {Array} [datos] - Datos a renderizar. Si se omite, usa ClientesState.clientes.
     */
    aplicarRender(datos) {
        const data = datos || ClientesState.clientes;
        modulos.renderTabla(data, 'tabla-clientes', this.COLUMNAS_CLIENTES);
    }
};
