window.alerts = {
    show(id, tipo, mensaje, options = {}) {
        const el = document.getElementById(id);
        if (!el) return;

        el.className = `alert alert-${tipo}`;
        el.textContent = mensaje;
        el.classList.remove('hidden');

        if (options.autoHideMs) {
            setTimeout(() => el.classList.add('hidden'), options.autoHideMs);
        }
    },

    hide(id) {
        const el = document.getElementById(id);
        if (!el) return;

        el.className = 'alert hidden';
        el.textContent = '';
    }
};

window.mostrarAlerta = function mostrarAlerta(tipo, mensaje) {
    window.alerts.show('alert-box', tipo, mensaje, { autoHideMs: 4000 });
};

window.mostrarAlertaModal = function mostrarAlertaModal(tipo, mensaje) {
    window.alerts.show('modal-alert', tipo, mensaje);
};

window.ocultarAlertaModal = function ocultarAlertaModal() {
    window.alerts.hide('modal-alert');
};

window.mostrarAlertaId = function mostrarAlertaId(id, tipo, mensaje) {
    window.alerts.show(id, tipo, mensaje);
};

window.ocultarAlertaId = function ocultarAlertaId(id) {
    window.alerts.hide(id);
};

window.mostrarAlertaMovimiento = function mostrarAlertaMovimiento(tipo, mensaje) {
    window.alerts.show('movimiento-alert', tipo, mensaje);
};

window.ocultarAlertaMovimiento = function ocultarAlertaMovimiento() {
    window.alerts.hide('movimiento-alert');
};
