/**
 * modules/usuarios/js/usuarios.actions.js
 * Mutaciones de API y efectos secundarios del módulo Usuarios.
 */
window.UsuariosActions = {
    async cargarUsuarios() {
        try {
            const data = await API.usuarios.list();
            UsuariosState.set({ usuarios: Array.isArray(data) ? data : [] });
            UsuariosRender.renderTabla(UsuariosState.get().usuarios, UsuariosState.get().usuarioActualId);
        } catch (err) {
            UsuariosState.set({ error: 'Error al cargar usuarios: ' + (err.message || '') });
            UsuariosRender.renderAlert();
        }
    },

    async cargarUsuarioActual() {
        try {
            const me = await API.usuarios.me();
            UsuariosState.set({ usuarioActual: me, usuarioActualId: me.id });
        } catch (_) {
            // No bloqueante
        }
    },

    abrirDrawer() {
        UsuariosState.resetForm();
        UsuariosState.set({ showDrawer: true, drawerMode: 'crear' });
        UsuariosRender.renderDrawer();
        UsuariosRender.resetFormFields();
    },

    cerrarDrawer() {
        UsuariosState.resetDrawer();
        UsuariosRender.renderDrawer();
        UsuariosRender.renderDrawerAlert();
    },

    validarFormulario(datos) {
        const errores = {};

        if (!datos.nombre?.trim()) {
            errores.nombre = 'El nombre es obligatorio';
        }

        if (!datos.correo?.trim()) {
            errores.correo = 'El correo es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
            errores.correo = 'Formato de correo inválido';
        }

        if (!datos.password) {
            errores.password = 'La contraseña es obligatoria';
        } else if (datos.password.length < 8) {
            errores.password = 'Mínimo 8 caracteres';
        } else if (datos.password.length > 72) {
            errores.password = 'Máximo 72 caracteres';
        }

        if (!datos.rolId) {
            errores.rolId = 'Debe seleccionar un rol';
        }

        return errores;
    },

    async crearUsuario(e) {
        e.preventDefault();

        const datos = {
            nombre: document.getElementById('input-nombre')?.value?.trim() || '',
            correo: document.getElementById('input-correo')?.value?.trim() || '',
            telefono: document.getElementById('input-telefono')?.value?.trim() || '',
            password: document.getElementById('input-password')?.value || '',
            rolId: parseInt(document.getElementById('input-rol')?.value, 10) || 2
        };

        // Validación client-side
        const errores = UsuariosActions.validarFormulario(datos);
        if (Object.keys(errores).length > 0) {
            UsuariosState.set({ fieldErrors: errores });
            UsuariosRender.renderDrawerAlert();
            return;
        }

        UsuariosState.set({ submitting: true, fieldErrors: {} });
        UsuariosRender.renderDrawerAlert();

        try {
            await API.usuarios.crear({
                nombre: datos.nombre,
                correo: datos.correo,
                telefono: datos.telefono || undefined,
                password: datos.password,
                rolId: datos.rolId
            });

            UsuariosState.set({
                success: 'Usuario creado correctamente.',
                showDrawer: false,
                submitting: false,
                fieldErrors: {}
            });

            UsuariosRender.resetFormFields();
            UsuariosRender.renderDrawer();
            UsuariosRender.renderAlert();
            await UsuariosActions.cargarUsuarios();

            setTimeout(() => {
                UsuariosState.set({ success: null });
                UsuariosRender.renderAlert();
            }, 4000);
        } catch (err) {
            UsuariosState.set({ submitting: false });
            UsuariosState.set({ error: err.message || 'Error al crear usuario.', fieldErrors: {} });
            UsuariosRender.renderDrawerAlert();
        }
    },

    async toggleEstado(id, activo) {
        try {
            await API.usuarios.cambiarEstado(id, activo);
            UsuariosState.set({
                success: activo ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.'
            });
            UsuariosRender.renderAlert();
            await UsuariosActions.cargarUsuarios();

            setTimeout(() => {
                UsuariosState.set({ success: null });
                UsuariosRender.renderAlert();
            }, 4000);
        } catch (err) {
            UsuariosState.set({ error: err.message || 'Error al cambiar estado.' });
            UsuariosRender.renderAlert();

            setTimeout(() => {
                UsuariosState.set({ error: null });
                UsuariosRender.renderAlert();
            }, 6000);
        }
    }
};
