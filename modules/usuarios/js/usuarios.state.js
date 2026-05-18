/**
 * modules/usuarios/js/usuarios.state.js
 * Estado mutable del módulo Usuarios.
 */
const state = {
    usuarios: [],
    usuarioActual: null,
    usuarioActualId: null,
    showDrawer: false,
    drawerMode: 'crear',
    submitting: false,
    error: null,
    success: null,
    fieldErrors: {}
};

window.UsuariosState = {
    state,

    get() {
        return state;
    },

    set(partial) {
        Object.assign(state, partial);
    },

    resetForm() {
        state.submitting = false;
        state.error = null;
        state.success = null;
        state.fieldErrors = {};
    },

    resetDrawer() {
        state.showDrawer = false;
        state.drawerMode = 'crear';
        state.submitting = false;
        state.error = null;
        state.fieldErrors = {};
    }
};
