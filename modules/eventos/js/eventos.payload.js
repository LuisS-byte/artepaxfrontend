(function () {
    function buildCrearPayload(validValues) {
        return {
            clienteId: validValues.clienteId,
            decoracionId: validValues.decoracionId,
            tipoEventoId: parseInt(document.getElementById('select-tipo-evento').value, 10),
            fecha: validValues.fecha,
            horaInicio: validValues.horaInicio,
            horaFin: validValues.horaFin,
            ubicacion: document.getElementById('input-ubicacion').value.trim() || null,
            nota: document.getElementById('input-nota').value.trim() || null
        };
    }

    function buildActualizarPayload(validValues, esParcial) {
        if (esParcial) {
            // Edición PROGRAMADO: solo ubicación, nota
            return {
                ubicacion: document.getElementById('input-ubicacion').value.trim() || null,
                nota: document.getElementById('input-nota').value.trim() || null
            };
        }

        return {
            clienteId: parseInt(document.getElementById('select-cliente').value, 10) || null,
            decoracionId: parseInt(document.getElementById('select-decoracion').value, 10) || null,
            fecha: validValues.fecha || null,
            horaInicio: validValues.horaInicio,
            horaFin: validValues.horaFin,
            ubicacion: document.getElementById('input-ubicacion').value.trim() || null,
            nota: document.getElementById('input-nota').value.trim() || null
        };
    }

    window.EventosPayload = Object.freeze({
        buildCrearPayload,
        buildActualizarPayload
    });
})();
