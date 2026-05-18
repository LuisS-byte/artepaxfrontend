/**
 * modules/decoraciones/js/decoraciones.api.js
 * Capa de acceso a datos del modulo Decoraciones.
 * Wrappers finos sobre API.* sin modificar endpoints ni payloads.
 * No incluye orquestacion ni manejo visual de errores.
 */
window.DecoracionesAPI = {
    listarDecoraciones(estado) {
        return API.decoraciones.list(estado ? { estado } : undefined);
    },
    obtenerDecoracion(id) {
        return API.decoraciones.get(id);
    },
    crearDecoracion(payload) {
        return API.decoraciones.crear(payload);
    },
    actualizarDecoracion(id, payload) {
        return API.decoraciones.actualizar(id, payload);
    },
    eliminarDecoracion(id) {
        return API.decoraciones.eliminar(id);
    },
    reactivarDecoracion(id) {
        return API.decoraciones.reactivar(id);
    },
    listarProductos() {
        return API.productos.list();
    },
    obtenerStockProducto(productoId) {
        return API.inventario.stockProducto(productoId);
    },
    listarTiposEvento() {
        return API.tiposEvento.list();
    }
};
