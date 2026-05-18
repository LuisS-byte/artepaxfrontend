/**
 * modules/inventario/js/inventario.api.js
 * Data loading layer del módulo Inventario.
 * Fetching de productos, stock y movimientos desde backend.
 * Setea InventarioState y delega render a inventario.render.js.
 * Dependencias: InventarioState, API.*, render, alerts, DOM (poblar selects).
 */

/* ================================================================ */
/*  CARGA DE STOCK Y PRODUCTOS                                       */
/* ================================================================ */

async function cargarStock() {
    renderSkeleton('tabla-stock', 8, 4);
    renderSkeleton('tabla-productos', 6, 4);

    try {
        InventarioState.productosData = await API.productos.list();
        const stockPorProducto = await Promise.all(InventarioState.productosData.map(async (producto) => {
            try {
                const stock = await API.inventario.stockProducto(producto.id);
                return {
                    idProducto: stock.idProducto ?? producto.id,
                    nombre: stock.nombre ?? producto.nombre,
                    cantidadTotal: stock.cantidadTotal ?? producto.cantidadTotal ?? 0,
                    cantidadReservada: stock.cantidadReservada ?? 0,
                    cantidadDisponible: stock.cantidadDisponible ?? producto.cantidadTotal ?? 0,
                    stockMinimo: stock.stockMinimo ?? producto.stockMinimo ?? 0,
                    precioUnitario: stock.precioUnitario ?? producto.precioUnitario ?? 0,
                    stockBajoAlerta: stock.stockBajoAlerta ?? false
                };
            } catch (_) {
                return {
                    idProducto: producto.id,
                    nombre: producto.nombre,
                    cantidadTotal: producto.cantidadTotal ?? 0,
                    cantidadReservada: 0,
                    cantidadDisponible: producto.cantidadTotal ?? 0,
                    stockMinimo: producto.stockMinimo ?? 0,
                    precioUnitario: producto.precioUnitario ?? 0,
                    stockBajoAlerta: false
                };
            }
        }));

        InventarioState.stockData = stockPorProducto;
        poblarProductosSelect();
        poblarSelectHistorial(); // legacy hidden select
        aplicarRenderStock();
        aplicarRenderProductos();
        actualizarResumenProductos();
        actualizarResumenInventario();
    } catch (err) {
        renderErrorState('tabla-stock', 8,
            'No se pudo cargar el stock',
            err.message || 'Error de conexión con el servidor.',
            'cargarStock()');
        renderErrorState('tabla-productos', 6,
            'No se pudo cargar el catálogo',
            err.message || 'Error de conexión con el servidor.',
            'cargarStock()');
        mostrarAlerta('error', 'Error al cargar inventario: ' + err.message);
    }
}

/* ================================================================ */
/*  CARGA DE MOVIMIENTOS GLOBALES (PAGINADA)                         */
/* ================================================================ */

async function cargarMovimientosGlobales(page) {
    page = page || 0;
    InventarioState.paginaMovActual = page;
    renderSkeleton('tabla-movimientos-global', 6, 4);

    const params = { page: InventarioState.paginaMovActual, size: 50, sort: 'fecha,desc' };

    try {
        const response = await API.inventario.movimientos(params);
        InventarioState.movimientosGlobalesBase = response.content || [];
        InventarioState.totalPaginasMov = response.totalPages || 0;
        aplicarRenderMovimientosGlobales();
        renderPaginacionMov();
    } catch (err) {
        renderErrorState('tabla-movimientos-global', 6,
            'Error al cargar movimientos',
            err.message || 'No se pudo conectar con el servidor.',
            'cargarMovimientosGlobales(0)');
        mostrarAlerta('error', 'Error al cargar movimientos: ' + err.message);
    }
}

/* ================================================================ */
/*  CARGA DE MOVIMIENTOS POR PRODUCTO                                */
/* ================================================================ */

async function cargarMovimientosPorProducto(productoId, page) {
    page = page || 0;
    InventarioState.movimientosProductoPaginaActual = page;
    const badge = document.getElementById('mov-contexto-producto');
    const nombreEl = document.getElementById('mov-contexto-nombre');

    if (!productoId) {
        InventarioState.movimientosData = [];
        InventarioState.movimientosProductoPagination = null;
        if (badge) badge.classList.add('hidden');
        renderEmptyState('tabla-movimientos', 6, 'search',
            'Seleccioná un producto',
            'Elegí un producto del listado para ver su historial de movimientos.');
        renderPaginacionMovProducto();
        return;
    }

    renderSkeleton('tabla-movimientos', 6, 4);

    try {
        const params = { page, size: 50, sort: 'fecha,desc' };
        const response = await API.inventario.movimientosProducto(productoId, params);
        if (Array.isArray(response)) {
            InventarioState.movimientosData = response;
            InventarioState.movimientosProductoPagination = null;
        } else if (response && typeof response === 'object' && Array.isArray(response.content)) {
            // Backend returned a paginated Page object
            InventarioState.movimientosData = response.content;
            InventarioState.movimientosProductoPagination = {
                totalPages: response.totalPages ?? 0,
                totalElements: response.totalElements ?? 0,
                page: response.page ?? 0
            };
        } else {
            InventarioState.movimientosData = [];
            InventarioState.movimientosProductoPagination = null;
        }

        // Show context badge with product name
        if (badge && nombreEl) {
            const producto = InventarioState.productosData.find(p => String(p.id) === String(productoId))
                || InventarioState.stockData.find(s => String(s.idProducto) === String(productoId));
            if (producto) {
                nombreEl.textContent = producto.nombre;
                badge.classList.remove('hidden');
                if (window.lucide) lucide.createIcons();
            }
        }

        aplicarRenderMovimientos();
        renderPaginacionMovProducto();
        document.getElementById('search-movimientos').value = '';
    } catch (err) {
        if (badge) badge.classList.add('hidden');
        renderErrorState('tabla-movimientos', 6,
            'No se pudo cargar el historial',
            err.message || 'Error de conexión.',
            'cargarMovimientosPorProducto(' + productoId + ', ' + page + ')');
        mostrarAlerta('error', 'Error al cargar movimientos: ' + err.message);
    }
}

/* ================================================================ */
/*  REFRESCAR INVENTARIO COMPLETO                                    */
/* ================================================================ */

async function refrescarInventario() {
    await cargarStock();

    if (InventarioState.productoHistorialSeleccionadoId) {
        await cargarMovimientosPorProducto(InventarioState.productoHistorialSeleccionadoId, InventarioState.movimientosProductoPaginaActual);
    }

    if (InventarioState.tabActual === 'movimientos' || InventarioState.movimientosGlobalesBase.length > 0) {
        await cargarMovimientosGlobales(InventarioState.paginaMovActual);
    }
}

/* ================================================================ */
/*  POBLAR SELECTS                                                   */
/* ================================================================ */

function poblarProductosSelect() {
    const select = document.getElementById('select-producto');
    select.innerHTML = '<option value="">Selecciona un producto...</option>';

    InventarioState.productosData
        .filter(p => p.estado !== 'INACTIVO')
        .slice()
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nombre;
            select.appendChild(opt);
        });
}

function poblarSelectHistorial() {
    const select = document.getElementById('select-producto-historial');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">--</option>';

    InventarioState.productosData
        .slice()
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.nombre}${p.estado === 'INACTIVO' ? ' (inactivo)' : ''}`;
            select.appendChild(opt);
        });

    // Restore current selection from state
    if (InventarioState.productoHistorialSeleccionadoId) {
        select.value = InventarioState.productoHistorialSeleccionadoId;
    } else if (currentVal) {
        select.value = currentVal;
    }
}
