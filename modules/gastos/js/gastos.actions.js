/**
 * modules/gastos/js/gastos.actions.js
 * Acciones UI y mutaciones del módulo Gastos.
 * Fase 5 — Separación desde gastos.js monolítico.
 */
(function () {
    'use strict';

    // -- Drawer ---------------------------------------------------------------

    function abrirDrawerGasto() {
        if (!GastosState.eventoSeleccionadoResumen || !GastosHelpers.eventoPermiteGasto(GastosState.eventoSeleccionadoResumen)) {
            mostrarAlerta('warning', 'Solo se pueden registrar gastos en eventos programados, confirmados o en montaje.');
            return;
        }
        ocultarAlertaId('drawer-gasto-alert');
        document.getElementById('form-gasto').reset();
        document.getElementById('select-estado').value = 'PROYECTADO';
        GastosRender.renderDrawerContexto();
        modulos.abrirModal('drawer-gasto-overlay');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function cerrarDrawerGasto(e) {
        if (e && e.target.id !== 'drawer-gasto-overlay') return;
        modulos.cerrarModal('drawer-gasto-overlay');
    }

    // -- Registro -------------------------------------------------------------

    async function registrarGasto(e) {
        e.preventDefault();
        if (!GastosState.eventoSeleccionadoId || !GastosState.eventoSeleccionadoResumen) return;

        const gastoConcepto = document.getElementById('input-concepto').value.trim();
        const gastoMonto = Number(document.getElementById('input-monto').value);
        const gastoEstado = document.getElementById('select-estado').value;
        const gastoNota = document.getElementById('input-nota').value.trim();

        if (!gastoConcepto) {
            return mostrarAlertaId('drawer-gasto-alert', 'error', 'El concepto es obligatorio.');
        }
        if (Number.isNaN(gastoMonto) || gastoMonto <= 0) {
            return mostrarAlertaId('drawer-gasto-alert', 'error', 'El monto debe ser mayor a 0.');
        }
        if (!['PROYECTADO', 'DESEMBOLSADO'].includes(gastoEstado)) {
            return mostrarAlertaId('drawer-gasto-alert', 'error', 'El estado inicial es invalido.');
        }

        const submitBtn = document.getElementById('btn-guardar-gasto');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
            await GastosAPI.crearGasto({
                eventoId: Number(GastosState.eventoSeleccionadoId),
                gastoConcepto,
                gastoMonto,
                gastoEstado,
                gastoNota: gastoNota || undefined
            });

            mostrarAlerta('success', 'Gasto registrado correctamente.');
            cerrarDrawerGasto();
            await recargarVistaActiva();
        } catch (err) {
            mostrarAlertaId('drawer-gasto-alert', 'error', err.message || 'No se pudo registrar el gasto.');
            submitBtn.textContent = 'Guardar gasto';
        } finally {
            submitBtn.disabled = false;
        }
    }

    // -- Modales --------------------------------------------------------------

    function abrirModalDesembolsar(id) {
        const gasto = GastosState.gastosActuales.find(item => item.id === id);
        abrirModalAccionGasto({
            tipo: 'desembolsar',
            id,
            titulo: 'Desembolsar gasto',
            mensaje: `Vas a marcar como desembolsado <strong>${formatters.textoSeguro(gasto?.gastoConcepto || `el gasto #${id}`)}</strong> por <strong>${GastosHelpers.getMonto(gasto?.gastoMonto || 0)}</strong>.`
        });
    }

    function abrirModalDesembolsarGlobal(id) {
        const gasto = GastosState.gastosGlobales.find(item => item.id === id);
        abrirModalAccionGasto({
            tipo: 'desembolsar',
            id,
            titulo: 'Desembolsar gasto',
            mensaje: `Vas a marcar como desembolsado <strong>${formatters.textoSeguro(gasto?.gastoConcepto || `el gasto #${id}`)}</strong> por <strong>${GastosHelpers.getMonto(gasto?.gastoMonto || 0)}</strong>.`
        });
    }

    function abrirModalEliminar(id) {
        const gasto = GastosState.gastosActuales.find(item => item.id === id);
        abrirModalAccionGasto({
            tipo: 'eliminar',
            id,
            titulo: 'Eliminar gasto',
            mensaje: `Vas a eliminar <strong>${formatters.textoSeguro(gasto?.gastoConcepto || `el gasto #${id}`)}</strong> por <strong>${GastosHelpers.getMonto(gasto?.gastoMonto || 0)}</strong>.<br><br>Solo se puede eliminar si sigue en <strong>PROYECTADO</strong>.`
        });
    }

    function abrirModalEliminarGlobal(id) {
        const gasto = GastosState.gastosGlobales.find(item => item.id === id);
        abrirModalAccionGasto({
            tipo: 'eliminar',
            id,
            titulo: 'Eliminar gasto',
            mensaje: `Vas a eliminar <strong>${formatters.textoSeguro(gasto?.gastoConcepto || `el gasto #${id}`)}</strong> por <strong>${GastosHelpers.getMonto(gasto?.gastoMonto || 0)}</strong>.<br><br>Solo se puede eliminar si sigue en <strong>PROYECTADO</strong>.`
        });
    }

    function abrirModalAccionGasto(config) {
        GastosState.accionPendiente = config;
        document.getElementById('modal-gasto-titulo').textContent = config.titulo;
        document.getElementById('modal-gasto-mensaje').innerHTML = config.mensaje;
        const btn = document.getElementById('btn-confirmar-gasto');
        btn.textContent = config.tipo === 'desembolsar' ? 'Desembolsar' : 'Eliminar';
        btn.className = config.tipo === 'desembolsar' ? 'btn btn-primary' : 'btn btn-danger';
        modulos.abrirModal('modal-confirmacion-gasto');
    }

    function cerrarModalGasto() {
        GastosState.accionPendiente = null;
        modulos.cerrarModal('modal-confirmacion-gasto');
    }

    async function confirmarAccionGasto() {
        if (!GastosState.accionPendiente) return;

        if (GastosState.accionPendiente.tipo === 'eliminar') {
            // Animate row fade-out before API call
            var gastoId = GastosState.accionPendiente.id;
            var row = document.querySelector('#tabla-gastos [data-gasto-id="' + gastoId + '"]')
                   || document.querySelector('#tabla-gastos-global [data-gasto-id="' + gastoId + '"]');
            if (row) {
                row.classList.add('row-deleting');
                await new Promise(function (resolve) {
                    row.addEventListener('animationend', resolve, { once: true });
                    // Fallback timeout in case animationend doesn't fire
                    setTimeout(resolve, 350);
                });
            }
        }

        var confirmBtn = document.getElementById('btn-confirmar-gasto');
        var textoOriginal = confirmBtn ? confirmBtn.textContent : '';
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = GastosState.accionPendiente.tipo === 'desembolsar' ? 'Desembolsando...' : 'Eliminando...';
        }

        try {
            if (GastosState.accionPendiente.tipo === 'desembolsar') {
                await GastosAPI.desembolsarGasto(GastosState.accionPendiente.id);
                mostrarAlerta('success', 'Gasto desembolsado correctamente.');
            }

            if (GastosState.accionPendiente.tipo === 'eliminar') {
                await GastosAPI.eliminarGasto(GastosState.accionPendiente.id);
                mostrarAlerta('success', 'Gasto eliminado correctamente.');
            }

            cerrarModalGasto();
            await recargarVistaActiva();
        } catch (err) {
            mostrarAlerta('error', err.message || 'No se pudo completar la accion.');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = textoOriginal;
            }
            cerrarModalGasto();
        }
    }

    // -- Búsqueda --------------------------------------------------------------

    /**
     * Inicializa el buscador con debounce.
     * @param {Function} onChange — callback que recibe el valor del input
     */
    function initBusquedaGasto(onChange) {
        const input = document.getElementById('search-gasto');
        const clearBtn = document.getElementById('search-gasto-clear');
        if (!input) return;

        input.addEventListener('input', window.debounce(function () {
            const valor = input.value.trim();
            GastosState.busqueda = valor;
            clearBtn.classList.toggle('hidden', !valor);
            if (typeof onChange === 'function') onChange(valor);
        }, 300));

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                limpiarBusquedaGasto();
            }
        });
    }

    function limpiarBusquedaGasto() {
        const input = document.getElementById('search-gasto');
        const clearBtn = document.getElementById('search-gasto-clear');
        if (input) {
            input.value = '';
            GastosState.busqueda = '';
        }
        if (clearBtn) clearBtn.classList.add('hidden');
        realizarFiltroCombinado();
    }

    /**
     * Ejecuta el filtro combinado (búsqueda + KPI) sobre gastosGlobales
     * y actualiza la tabla, chips, contador y estados KPI activos.
     */
    function realizarFiltroCombinado() {
        const filtrados = GastosHelpers.aplicarFiltrosCombinados(GastosState.gastosGlobales, {
            busqueda: GastosState.busqueda,
            kpiActivo: GastosState.kpiActivo
        });
        GastosState.filtroCombinado = filtrados;
        modulos.renderTabla(filtrados, 'tabla-gastos-global', GastosRender.COLUMNAS_GASTOS_GLOBAL);
        GastosRender.addGastoIdsToRows('tabla-gastos-global', filtrados);
        GastosRender.actualizarChipsGasto();
        GastosRender.actualizarResultsCount();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // -- KPI Click ------------------------------------------------------------

    // -- Filter Chips ---------------------------------------------------------

    /**
     * Remove a specific filter chip and re-filter.
     * @param {string} tipo — 'estado' | 'fecha' | 'search' | 'kpi'
     */
    function quitarChip(tipo) {
        switch (tipo) {
            case 'estado': {
                const select = document.getElementById('filter-estado-gasto');
                if (select) select.value = '';
                cargarGastosGlobales();
                break;
            }
            case 'fecha': {
                const desde = document.getElementById('filter-fecha-desde');
                const hasta = document.getElementById('filter-fecha-hasta');
                if (desde) desde.value = '';
                if (hasta) hasta.value = '';
                cargarGastosGlobales();
                break;
            }
            case 'search': {
                const input = document.getElementById('search-gasto');
                const clearBtn = document.getElementById('search-gasto-clear');
                if (input) {
                    input.value = '';
                    GastosState.busqueda = '';
                }
                if (clearBtn) clearBtn.classList.add('hidden');
                realizarFiltroCombinado();
                break;
            }
            case 'kpi': {
                GastosState.kpiActivo = null;
                realizarFiltroCombinado();
                break;
            }
        }
    }

    /**
     * Clear ALL active filters (estado, dates, search, KPI) and reset.
     */
    function limpiarTodosFiltros() {
        const select = document.getElementById('filter-estado-gasto');
        if (select) select.value = '';

        const desde = document.getElementById('filter-fecha-desde');
        const hasta = document.getElementById('filter-fecha-hasta');
        if (desde) desde.value = '';
        if (hasta) hasta.value = '';

        const input = document.getElementById('search-gasto');
        const clearBtn = document.getElementById('search-gasto-clear');
        if (input) {
            input.value = '';
            GastosState.busqueda = '';
        }
        if (clearBtn) clearBtn.classList.add('hidden');

        GastosState.kpiActivo = null;

        cargarGastosGlobales();
    }

    // -- Recarga y navegación -------------------------------------------------

    async function recargarVistaActiva() {
        if (GastosState.tabActual === 'todos') {
            await cargarGastosGlobales(GastosState.paginaActual);
            if (GastosState.eventoSeleccionadoId) {
                await cargarGastosEvento();
            }
            return;
        }

        await cargarGastosEvento();
        GastosRender.actualizarBarraProgreso();
        await cargarGastosGlobales(GastosState.paginaActual);
    }

    function irADetalleEvento(eventoId) {
        if (!eventoId) return;
        window.location.href = `../eventos/eventos.html?eventoId=${eventoId}`;
    }

    // -- Concept Chips -------------------------------------------------------

    /**
     * Inicializa las concept chips en el drawer.
     */
    function initConceptChips() {
        var chipsContainer = document.getElementById('concept-chips');
        var conceptoInput = document.getElementById('input-concepto');
        if (!chipsContainer || !conceptoInput) return;

        // Show chips on focus
        conceptoInput.addEventListener('focus', function () {
            chipsContainer.classList.remove('hidden');
        });

        // Hide on blur with delay to allow click
        conceptoInput.addEventListener('blur', function () {
            setTimeout(function () {
                chipsContainer.classList.add('hidden');
            }, 200);
        });

        // Click on chips fills the input
        chipsContainer.addEventListener('click', function (e) {
            var chip = e.target.closest('.concept-chip');
            if (chip) {
                clickConceptChip(chip.dataset.concept);
            }
        });
    }

    /**
     * Llena el input con el concepto seleccionado.
     * @param {string} concept
     */
    function clickConceptChip(concept) {
        var input = document.getElementById('input-concepto');
        if (!input || !concept) return;
        input.value = concept;
        input.focus();
        // Hide chips
        var chipsContainer = document.getElementById('concept-chips');
        if (chipsContainer) chipsContainer.classList.add('hidden');
    }

    // -- Namespace + window.* exports para handlers inline --------------------

    window.GastosActions = {
        abrirDrawerGasto,
        cerrarDrawerGasto,
        registrarGasto,
        abrirModalDesembolsar,
        abrirModalDesembolsarGlobal,
        abrirModalEliminar,
        abrirModalEliminarGlobal,
        abrirModalAccionGasto,
        cerrarModalGasto,
        confirmarAccionGasto,
        recargarVistaActiva,
        irADetalleEvento,
        initBusquedaGasto,
        limpiarBusquedaGasto,
        realizarFiltroCombinado,
        quitarChip,
        limpiarTodosFiltros,
        initConceptChips,
        clickConceptChip
    };

    window.abrirDrawerGasto = abrirDrawerGasto;
    window.cerrarDrawerGasto = cerrarDrawerGasto;
    window.registrarGasto = registrarGasto;
    window.abrirModalDesembolsar = abrirModalDesembolsar;
    window.abrirModalDesembolsarGlobal = abrirModalDesembolsarGlobal;
    window.abrirModalEliminar = abrirModalEliminar;
    window.abrirModalEliminarGlobal = abrirModalEliminarGlobal;
    window.cerrarModalGasto = cerrarModalGasto;
    window.confirmarAccionGasto = confirmarAccionGasto;
    window.irADetalleEvento = irADetalleEvento;
    window.limpiarBusquedaGasto = limpiarBusquedaGasto;
    window.clickConceptChip = clickConceptChip;
})();
