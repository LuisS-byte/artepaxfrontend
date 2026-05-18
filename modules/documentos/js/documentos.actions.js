/**
 * modules/documentos/js/documentos.actions.js
 * Acciones mutantes y modal de reenvío del módulo Documentos.
 * Fase 5 — Separación desde documentos.js monolítico.
 */
(function () {
    'use strict';

    // -- Generación de documentos --------------------------------------------

    async function generarDocumento(tipo) {
        if (!DocumentosState.eventoSeleccionadoId) return;
        if (DocumentosState.generacionesEnCurso.has(tipo)) return;

        DocumentosState.generacionesEnCurso.add(tipo);
        DocumentosRender.renderAccionesEvento();

        try {
            const response = await DocumentosAPI.generarDocumento(DocumentosState.eventoSeleccionadoId, tipo);
            const estado = response?.docuEstadoEnvio || 'PENDIENTE';
            mostrarAlerta(estado === 'FALLIDO' ? 'warning' : 'success', `Documento procesado con estado ${estado}.`);
            await cargarDocumentosEvento();
            if (DocumentosState.tabActual === 'global') await cargarDocumentosGlobales(DocumentosState.paginaGlobalActual);
        } catch (err) {
            mostrarAlerta('error', 'No se pudo generar el documento: ' + err.message);
        } finally {
            DocumentosState.generacionesEnCurso.delete(tipo);
            DocumentosRender.renderAccionesEvento();
        }
    }

    async function generarAvisoSaldoPendiente() {
        const tipo = 'AVISO_SALDO_PENDIENTE';
        if (!DocumentosState.eventoSeleccionadoId) return;
        if (DocumentosState.generacionesEnCurso.has(tipo)) return;

        DocumentosState.generacionesEnCurso.add(tipo);
        DocumentosRender.renderAccionesEvento();

        try {
            const response = await DocumentosAPI.generarAvisoSaldoPendiente(DocumentosState.eventoSeleccionadoId);
            const estado = response?.docuEstadoEnvio || 'PENDIENTE';
            mostrarAlerta(estado === 'FALLIDO' ? 'warning' : 'success', `Aviso procesado con estado ${estado}.`);
            await cargarDocumentosEvento();
            if (DocumentosState.tabActual === 'global') await cargarDocumentosGlobales(DocumentosState.paginaGlobalActual);
        } catch (err) {
            mostrarAlerta('error', 'No se pudo generar el aviso: ' + err.message);
        } finally {
            DocumentosState.generacionesEnCurso.delete(tipo);
            DocumentosRender.renderAccionesEvento();
        }
    }

    // -- Modal de reenvío ----------------------------------------------------

    function abrirModalReenviar(idDocumento) {
        const doc = [...DocumentosState.documentosActuales, ...DocumentosState.documentosGlobales].find(d => d.idDocumento === idDocumento);
        const intentosActuales = doc ? (doc.docuIntentosEnvio ?? 0) : 0;
        const intentosRestantes = 3 - intentosActuales;
        DocumentosState.reenviarPendienteId = idDocumento;
        document.getElementById('reenviar-mensaje').innerHTML = `Vas a reenviar este documento.<br><br>Intentos usados: <strong>${intentosActuales}/3</strong><br>Intentos restantes: <strong>${intentosRestantes}</strong><br><br>Si falla el envio, se consume un intento.`;
        modulos.abrirModal('modal-reenviar');
    }

    function cerrarModalReenviar() {
        DocumentosState.reenviarPendienteId = null;
        modulos.cerrarModal('modal-reenviar');
    }

    async function confirmarReenvioDocumento() {
        if (!DocumentosState.reenviarPendienteId) return;
        if (DocumentosState.reenviandoEnCurso) return;

        DocumentosState.reenviandoEnCurso = true;
        const btn = document.getElementById('btn-confirmar-reenviar');
        if (btn) btn.disabled = true;

        try {
            const response = await DocumentosAPI.reenviarDocumento(DocumentosState.reenviarPendienteId);
            const estado = response?.docuEstadoEnvio || 'REENVIADO';
            mostrarAlerta(estado === 'FALLIDO' ? 'warning' : 'success', `Reenvio procesado con estado ${estado}.`);
            cerrarModalReenviar();
            await recargarVistaActiva();
        } catch (err) {
            mostrarAlerta('error', 'No se pudo reenviar el documento: ' + err.message);
            cerrarModalReenviar();
        } finally {
            DocumentosState.reenviandoEnCurso = false;
            if (btn) btn.disabled = false;
        }
    }

    // -- Recarga --------------------------------------------------------------

    function recargarVistaActiva() {
        if (DocumentosState.tabActual === 'plantillas') return cargarPlantillas();
        if (DocumentosState.tabActual === 'global') return cargarDocumentosGlobales(DocumentosState.paginaGlobalActual);
        return cargarDocumentosEvento();
    }

    // -- Namespace + window.* exports para handlers inline --------------------

    window.DocumentosActions = {
        generarDocumento,
        generarAvisoSaldoPendiente,
        abrirModalReenviar,
        cerrarModalReenviar,
        confirmarReenvioDocumento,
        recargarVistaActiva
    };

    window.generarDocumento = generarDocumento;
    window.generarAvisoSaldoPendiente = generarAvisoSaldoPendiente;
    window.abrirModalReenviar = abrirModalReenviar;
    window.cerrarModalReenviar = cerrarModalReenviar;
    window.confirmarReenvioDocumento = confirmarReenvioDocumento;
})();
