/**
 * modules/decoraciones/js/decoraciones.helpers.js
 * Funciones puras o casi puras del modulo Decoraciones.
 * Sin side effects: no mutan estado, no llaman APIs, no manipulan DOM.
 * Leen variables globales (DecoracionesState.stockProductos, DecoracionesState.productosDisponibles) pero no las modifican.
 */
window.DecoracionesHelpers = (() => {

    function getStockProducto(productoId) {
        return DecoracionesState.stockProductos.find(item => String(item.idProducto) === String(productoId)) || null;
    }

    function hayErrorCargaStock(productoId) {
        return DecoracionesState.stockErroresIds.includes(String(productoId));
    }

    function formatearMomentoCarga(value) {
        if (!value) return 'sin datos';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'sin datos';
        return date.toLocaleTimeString('es-SV', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getProductosActivos() {
        return DecoracionesState.productosDisponibles.filter(producto => producto.estado === 'ACTIVO');
    }

    function calcularCostoEstimado(productos = []) {
        return productos.reduce((acc, item) => {
            const producto = DecoracionesState.productosDisponibles.find(p => String(p.id) === String(item.productoId));
            const precioUnitario = Number(producto?.precioUnitario || 0);
            const cantidad = Number(item.cantidadRequerida || 0);
            return acc + (precioUnitario * cantidad);
        }, 0);
    }

    function normalizarComposicion(productos = []) {
        return [...productos]
            .map(item => ({
                productoId: Number(item.productoId),
                cantidadRequerida: Number(item.cantidadRequerida)
            }))
            .sort((a, b) => a.productoId - b.productoId);
    }

    function getComposicionSnapshot(productos = []) {
        return JSON.stringify(normalizarComposicion(productos));
    }

    function mapDecoracionErrorMessage(err) {
        const msg = String(err?.message || '').trim();
        if (!msg) return 'Error interno del servidor.';
        if (/stock critico/i.test(msg)) return msg;
        if (/stock insuficiente/i.test(msg)) return msg;
        if (/producto no encontrado/i.test(msg)) return 'Uno de los productos elegidos ya no existe.';
        if (/decoracion no encontrada/i.test(msg)) return 'La decoracion ya no existe o fue desactivada.';
        if (/integridad/i.test(msg)) return 'No se pudo guardar por un conflicto de datos. Revisa nombre y composicion.';
        return msg;
    }

    function validarProductosLocalmente(productos) {
        if (!productos.length) {
            return 'Debes agregar al menos un producto a la composicion.';
        }

        const ids = productos.map(item => item.productoId);
        if (new Set(ids).size !== ids.length) {
            return 'No repitas el mismo producto en varias filas. Usa una sola fila por producto.';
        }

        const consolidado = new Map();
        productos.forEach(item => {
            consolidado.set(item.productoId, (consolidado.get(item.productoId) || 0) + item.cantidadRequerida);
        });

        for (const [productoId, cantidadRequerida] of consolidado.entries()) {
            const producto = DecoracionesState.productosDisponibles.find(item => String(item.id) === String(productoId));
            const stock = getStockProducto(productoId);

            if (!producto || producto.estado !== 'ACTIVO') {
                return 'No podes usar productos inactivos en la composicion.';
            }

            if (hayErrorCargaStock(productoId)) {
                return `No se pudo validar el stock operativo de "${producto.nombre}". Intentá recargar antes de guardar.`;
            }

            if (!stock) {
                return `No hay stock operativo disponible para "${producto.nombre}".`;
            }

            if (stock.stockBajoAlerta) {
                return `"${producto.nombre}" está en stock crítico y conviene reemplazarlo antes de guardar.`;
            }

            if (Number(stock.cantidadDisponible || 0) < cantidadRequerida) {
                return `Stock insuficiente para "${producto.nombre}". Disponible: ${stock.cantidadDisponible}, requerido: ${cantidadRequerida}.`;
            }
        }

        return '';
    }

    return {
        getStockProducto,
        hayErrorCargaStock,
        formatearMomentoCarga,
        getProductosActivos,
        calcularCostoEstimado,
        normalizarComposicion,
        getComposicionSnapshot,
        mapDecoracionErrorMessage,
        validarProductosLocalmente
    };
})();
