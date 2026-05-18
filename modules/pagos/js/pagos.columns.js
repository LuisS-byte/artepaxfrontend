/**
 * modules/pagos/js/pagos.columns.js
 * Definiciones de columnas para las 3 tablas del módulo Pagos.
 * 
 * Dependencias:
 *   - modulos.formatearFecha()     (js/shared/modulos.js)
 *   - formatters.*                  (js/shared/formatters.js)
 *   - getBadgeEstadoPago()         (js/pagos.permissions.js)
 *   - getBadgeEstadoEvento()       (js/pagos.permissions.js)
 *   - getBadgeMetodoActivo()       (js/pagos.permissions.js)
 *   - renderAccionesPago()         (js/pagos.js — resuelto en runtime)
 */

window.PagosColumns = {

    // ── Tabla de pagos por evento (6 columnas) ─────────────
    PAGOS: [
        {
            label: 'Fecha',
            render: row => `<td>${modulos.formatearFecha(row.fecha)}</td>`
        },
        {
            label: 'Concepto',
            render: row => `<td>${formatters.textoSeguro(row.conceptoPago || '—')}</td>`
        },
        {
            label: 'Método',
            render: row => `<td>${formatters.textoSeguro(row.metodoPago || '—')}</td>`
        },
        {
            label: 'Monto',
            render: row => `<td><strong class="amount-cell">$${formatters.precio(row.monto)}</strong></td>`
        },
        {
            label: 'Estado',
            render: row => `<td>${getBadgeEstadoPago(row.estadoPagoNombre || row.estadoPago)}</td>`
        },
        {
            label: 'Acciones',
            render: row => `
                <td class="acciones-cell">
                    ${renderAccionesPago(row, 'evento')}
                </td>`
        }
    ],

    // ── Tabla global de pagos (8 columnas) ─────────────────
    PAGOS_GLOBAL: [
        {
            label: 'Fecha',
            render: row => `<td>${modulos.formatearFecha(row.fecha)}</td>`
        },
        {
            label: 'Cliente',
            render: row => `<td>${formatters.textoSeguro(row.clienteNombre || '—')}</td>`
        },
        {
            label: 'Evento',
            render: row => `<td><span class="badge ${getBadgeEstadoEvento(row.estadoEventoNombre)}">${formatters.textoSeguro(row.estadoEventoNombre || '—')}</span></td>`
        },
        {
            label: 'Concepto',
            render: row => `<td>${formatters.textoSeguro(row.conceptoPago || '—')}</td>`
        },
        {
            label: 'Método',
            render: row => `<td>${formatters.textoSeguro(row.metodoPago || '—')}</td>`
        },
        {
            label: 'Monto',
            render: row => `<td><strong class="amount-cell">$${formatters.precio(row.monto)}</strong></td>`
        },
        {
            label: 'Estado',
            render: row => `<td>${getBadgeEstadoPago(row.estadoPagoNombre || row.estadoPago)}</td>`
        },
        {
            label: 'Acciones',
            render: row => `
                <td class="acciones-cell">
                    ${renderAccionesPago(row, 'global')}
                </td>`
        }
    ],

    // ── Tabla de métodos de pago (4 columnas) ─────────────
    METODOS: [
        {
            label: 'Método',
            render: row => `
                <td>
                    <div class="pag-metodo-name-cell">
                        <strong>${formatters.textoSeguro(row.metodoNombre || 'Sin nombre')}</strong>
                        <span class="metodo-availability-note">${row.metodoActivo !== false ? 'Disponible para nuevos pagos' : 'Oculto para nuevos pagos'}</span>
                    </div>
                </td>`
        },
        {
            label: 'Descripción',
            render: row => `<td><div class="pag-metodo-descripcion">${formatters.textoSeguro(row.metodoDescripcion || 'Sin descripción registrada.')}</div></td>`
        },
        {
            label: 'Estado',
            render: row => `<td>${getBadgeMetodoActivo(row.metodoActivo !== false)}</td>`
        },
        {
            label: 'Acciones',
            render: row => `
                <td class="acciones-cell">
                    <button class="btn btn-outline btn-sm ${row.metodoActivo !== false ? 'btn-danger-hover' : 'btn-success-hover'}" onclick="toggleMetodoPago(${row.id})">
                        ${row.metodoActivo !== false ? 'Desactivar' : 'Activar'}
                    </button>
                </td>`
        }
    ]
};
