/**
 * modules/usuarios/js/usuarios.js
 * Orquestador del módulo Usuarios.
 * Inicialización y delegación de eventos data-action.
 */
const USUARIOS_ACTIONS = {
    abrirCrearUsuario: () => UsuariosActions.abrirDrawer(),
    cerrarDrawerUsuarios: () => UsuariosActions.cerrarDrawer(),
    guardarUsuario: (el, event) => UsuariosActions.crearUsuario(event)
};

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger || trigger.disabled) return;

    const action = trigger.dataset.action;
    const handler = USUARIOS_ACTIONS[action];
    if (typeof handler === 'function') {
        event.preventDefault();
        handler(trigger, event);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar usuario actual y lista
    await UsuariosActions.cargarUsuarioActual();
    await UsuariosActions.cargarUsuarios();

    // Click en overlay del drawer para cerrar
    document.getElementById('drawer-usuarios-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'drawer-usuarios-overlay') UsuariosActions.cerrarDrawer();
    });

    // Submit del formulario (cubre Enter en campos)
    document.getElementById('form-usuario')?.addEventListener('submit', (e) => {
        e.preventDefault();
        UsuariosActions.crearUsuario(e);
    });
});

// Exports para debug
window.cargarUsuarios = UsuariosActions.cargarUsuarios;
