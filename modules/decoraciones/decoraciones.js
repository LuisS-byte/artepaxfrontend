/**
 * modules/decoraciones/decoraciones.js
 * Gestion del catalogo de decoraciones.
 */

async function cargarDecoraciones() {
    const grid = document.getElementById('grid-decoraciones');
    grid.innerHTML = '<div class="loading-state"><div class="spinner"></div>Cargando catalogo...</div>';

    try {
        const estado = document.getElementById('filter-estado')?.value || '';
        const decoracionesPromise = DecoracionesAPI.listarDecoraciones(estado);
        const productosPromise = DecoracionesAPI.listarProductos();
        const tiposEventoPromise = DecoracionesAPI.listarTiposEvento().catch(function () { return []; });

        const [decoracionesData, productos, tiposEvento] = await Promise.all([decoracionesPromise, productosPromise, tiposEventoPromise]);
        const productosActivos = productos.filter(producto => producto.estado === 'ACTIVO');
        const stocks = await Promise.all(productosActivos.map(async producto => {
            try {
                return await DecoracionesAPI.obtenerStockProducto(producto.id);
            } catch (_) {
                return {
                    idProducto: producto.id,
                    errorCarga: true
                };
            }
        }));

        DecoracionesState.decoraciones = decoracionesData;
        DecoracionesState.productosDisponibles = productos;
        DecoracionesState.stockProductos = stocks.filter(stock => stock && !stock.errorCarga);
        DecoracionesState.stockErroresIds = stocks
            .filter(stock => stock?.errorCarga)
            .map(stock => String(stock.idProducto));
        DecoracionesState.ultimaCargaStock = new Date().toISOString();
        DecoracionesState.tiposEventoDisponibles = tiposEvento;

        DecoracionesRender.actualizarResumenDecoraciones();
        DecoracionesRender.actualizarEstadoSincronizacion();
        DecoracionesRender.aplicarRender();

        if (DecoracionesState.stockErroresIds.length) {
            mostrarAlerta('warning', 'No se pudo validar el stock de algunos productos. Revisá la disponibilidad antes de guardar cambios.');
        }
    } catch (err) {
        mostrarAlerta('error', 'Error al cargar decoraciones: ' + DecoracionesHelpers.mapDecoracionErrorMessage(err));
    }
}

function aplicarBusqueda() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase();
    const filtrados = DecoracionesState.decoraciones.filter(d =>
        d.nombre.toLowerCase().includes(q) ||
        d.descripcion?.toLowerCase().includes(q)
    );
    actualizarContadorResultados(filtrados.length);
    DecoracionesRender.aplicarRender(filtrados);
}

function actualizarContadorResultados(total) {
    const count = document.getElementById('decoraciones-result-count');
    if (!count) return;
    count.textContent = `${total} ${total === 1 ? 'modelo' : 'modelos'}`;
}

function cambiarVista(vista) {
    DecoracionesState.vistaActual = vista;
    document.getElementById('btn-view-grid').classList.toggle('active', vista === 'grid');
    document.getElementById('btn-view-table').classList.toggle('active', vista === 'table');
    DecoracionesRender.actualizarResumenDecoraciones();
    aplicarBusqueda();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-input').addEventListener('input', debounce(aplicarBusqueda, 300));
    document.getElementById('input-precio')?.addEventListener('input', () => {
        if (window.DecoracionesComposition?.actualizarResumenComposicion) {
            DecoracionesComposition.actualizarResumenComposicion();
        }
    });
    cargarDecoraciones();
});
