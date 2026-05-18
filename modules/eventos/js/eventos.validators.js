(function () {
    function showFieldError(fieldId, message) {
        const errorEl = document.getElementById('error-' + fieldId);
        if (errorEl) errorEl.textContent = message;
        const field = document.getElementById(fieldId);
        if (field) field.classList.add('field-invalid');
    }

    function clearFieldErrors() {
        document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
        document.querySelectorAll('.field-invalid').forEach(el => { el.classList.remove('field-invalid'); });
    }

    function marcarCamposConflicto() {
        ['input-fecha', 'input-hora-inicio', 'input-hora-fin', 'input-ubicacion'].forEach(id => {
            document.getElementById(id)?.classList.add('field-invalid');
        });
        document.getElementById('input-fecha')?.focus();
    }

    function validateEventoForm() {
        clearFieldErrors();

        let hayError = false;
        const clienteId = parseInt(document.getElementById('select-cliente').value, 10);
        const decoracionId = parseInt(document.getElementById('select-decoracion').value, 10);
        const fecha = document.getElementById('input-fecha').value;
        const horaInicio = document.getElementById('input-hora-inicio').value || null;
        const horaFin = document.getElementById('input-hora-fin').value || null;

        if (!clienteId) {
            showFieldError('select-cliente', 'Seleccioná un cliente.');
            hayError = true;
        }

        if (!decoracionId) {
            showFieldError('select-decoracion', 'Seleccioná una decoración.');
            hayError = true;
        }

        if (!fecha) {
            showFieldError('input-fecha', 'La fecha es obligatoria.');
            hayError = true;
        }

        if ((horaInicio && !horaFin) || (!horaInicio && horaFin)) {
            showFieldError('input-hora-inicio', 'Ambas horas deben completarse juntas.');
            showFieldError('input-hora-fin', 'Ambas horas deben completarse juntas.');
            hayError = true;
        }

        if (horaInicio && horaFin && horaFin <= horaInicio) {
            showFieldError('input-hora-inicio', 'Debe ser anterior a la hora de fin.');
            showFieldError('input-hora-fin', 'Debe ser posterior a la hora de inicio.');
            hayError = true;
        }

        return {
            isValid: !hayError,
            values: {
                clienteId,
                decoracionId,
                fecha,
                horaInicio,
                horaFin
            }
        };
    }

    function initEventosValidators() {
        document.addEventListener('input', (event) => {
            const field = event.target.closest('.field-invalid');
            if (field) {
                field.classList.remove('field-invalid');
                const errorEl = document.getElementById('error-' + field.id);
                if (errorEl) errorEl.textContent = '';
            }
        });
    }

    window.EventosValidators = Object.freeze({
        initEventosValidators,
        showFieldError,
        clearFieldErrors,
        marcarCamposConflicto,
        validateEventoForm
    });
})();
