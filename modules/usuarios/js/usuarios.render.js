/**
 * modules/usuarios/js/usuarios.render.js
 * Render de tabla, drawer y componentes visuales del módulo Usuarios.
 * NO modifica estado, NO llama API.
 */
window.UsuariosRender = {
    renderTabla(usuarios, usuarioActualId) {
        const container = document.getElementById('tabla-usuarios');
        if (!container) return;

        if (!usuarios || !usuarios.length) {
            container.innerHTML = '<tr><td colspan="7" class="empty-state">No hay usuarios registrados.</td></tr>';
            return;
        }

        container.innerHTML = usuarios.map(u => {
            const esYo = String(u.id) === String(usuarioActualId);
            const activo = u.estado === true || u.estado === 'true';
            return `
            <tr>
                <td><strong>${formatters.textoSeguro(u.nombre)}</strong></td>
                <td>${formatters.textoSeguro(u.correo)}</td>
                <td>${formatters.textoSeguro(u.telefono || '—')}</td>
                <td><span class="badge ${u.rol === 'ADMIN' ? 'badge-admin' : 'badge-empleado'}">${formatters.textoSeguro(u.rol)}</span></td>
                <td><span class="badge ${u.tipoAuth === 'LOCAL' ? 'badge-local' : 'badge-google'}">${formatters.textoSeguro(u.tipoAuth)}</span></td>
                <td>${modulos.badgeEstado(activo ? 'ACTIVO' : 'INACTIVO')}</td>
                <td class="acciones-cell">
                    ${esYo
                        ? '<span class="text-muted text-sm">Usuario actual</span>'
                        : `<button class="btn btn-outline btn-sm" onclick="UsuariosActions.toggleEstado(${u.id}, ${!activo})" ${activo ? 'data-action-type="desactivar"' : ''}>
                            ${activo ? 'Desactivar' : 'Activar'}
                        </button>`
                    }
                </td>
            </tr>`;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderDrawer() {
        const st = UsuariosState.get();
        if (st.showDrawer) {
            modulos.abrirModal('drawer-usuarios-overlay');
        } else {
            modulos.cerrarModal('drawer-usuarios-overlay');
        }
    },

    renderAlert() {
        const st = UsuariosState.get();
        const alertBox = document.getElementById('alert-box');
        if (!alertBox) return;

        if (st.success) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = st.success;
            alertBox.classList.remove('hidden');
        } else if (st.error) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = st.error;
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }
    },

    renderDrawerAlert() {
        const st = UsuariosState.get();
        const alertBox = document.getElementById('drawer-usuarios-alert');
        if (!alertBox) return;

        if (st.fieldErrors && Object.keys(st.fieldErrors).length > 0) {
            const mensajes = Object.entries(st.fieldErrors)
                .map(([campo, msg]) => `${campo}: ${msg}`)
                .join('<br>');
            alertBox.className = 'alert alert-error';
            alertBox.innerHTML = mensajes;
            alertBox.classList.remove('hidden');
        } else if (st.error) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = st.error;
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }
    },

    resetFormFields() {
        document.getElementById('input-nombre').value = '';
        document.getElementById('input-correo').value = '';
        document.getElementById('input-telefono').value = '';
        document.getElementById('input-password').value = '';
        document.getElementById('input-rol').value = '2';
    }
};
