/**
 * modules/clientes/js/clientes.helpers.js
 * Helpers puros del módulo Clientes
 */
window.ClientesHelpers = {

    /**
     * Construye el payload para crear/actualizar cliente desde el formulario.
     * @returns {Object} { nombre, telefono, correo, direccion }
     */
    construirPayload() {
        return {
            nombre: document.getElementById('input-nombre').value.trim(),
            telefono: document.getElementById('input-telefono').value.trim(),
            correo: document.getElementById('input-correo').value.trim(),
            direccion: document.getElementById('input-direccion').value.trim()
        };
    }
};
