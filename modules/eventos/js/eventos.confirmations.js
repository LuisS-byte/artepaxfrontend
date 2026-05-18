(function () {
    const { EVENTO_ESTADOS } = window.EventosConstants;
    const state = window.EventosState.getState();

    const CONFIRMACION_CONFIG = Object.freeze({
        programar: { titulo: 'Programar Evento', msg: 'El evento pasara a estado PROGRAMADO.', btn: 'Programar', sub: 'COTIZACION → PROGRAMADO' },
        confirmar: { titulo: 'Confirmar Reserva', msg: 'El evento pasara a estado CONFIRMADO tras asegurar el pago minimo.', btn: 'Confirmar', sub: 'PROGRAMADO → CONFIRMADO' },
        iniciarMontaje: { titulo: 'Iniciar Montaje', msg: 'Se registrara el inicio de actividades en campo.', btn: 'Iniciar', sub: 'CONFIRMADO → EN_MONTAJE' },
        finalizar: { titulo: 'Finalizar Evento', msg: 'El evento se marcara como finalizado. Si hay saldo pendiente, pasara a PENDIENTE_COBRO hasta completar el cobro.', btn: 'Finalizar', sub: 'EN_MONTAJE → FINALIZADO' },
        revertirCancelacion: { titulo: 'Revertir cancelacion', msg: 'El evento volvera a su estado anterior.', btn: 'Revertir', sub: 'CANCELACION_PENDIENTE → estado anterior' },
        confirmarCancelacion: { titulo: 'Confirmar Baja Definitiva', msg: 'Esta accion es irreversible y liberara el inventario.', btn: 'Confirmar Baja', sub: 'CANCELACION_PENDIENTE → CANCELADO' }
    });

    function setConfirmarBase(config, onConfirm) {
        document.getElementById('confirmar-titulo').textContent = config.titulo;
        document.getElementById('btn-confirmar-accion').textContent = config.btn;
        document.getElementById('btn-confirmar-accion').onclick = onConfirm;
        var sub = document.getElementById('confirmar-subtitulo');
        if (sub) sub.textContent = config.sub || 'Esta accion cambiara el estado del evento';
    }

    async function prepararConfirmacionProgramar(id, config, deps) {
        document.getElementById('confirmar-mensaje').innerHTML = `
            <div class="loading-state" style="padding:1.5rem !important;">
                <div class="spinner"></div>
                Verificando stock de productos...
            </div>`;
        modulos.abrirModal('modal-confirmar');

        const resultado = await deps.validarStockEvento(id);
        if (resultado.suficiente === false) {
            modulos.cerrarModal('modal-confirmar');
            deps.mostrarModalStockInsuficiente(resultado);
            return false;
        }

        if (resultado.suficiente === true && resultado.items.length > 0) {
            document.getElementById('confirmar-mensaje').innerHTML = `
                <div class="stock-verificado-resumen">
                    <i data-lucide="check-circle"></i>
                    <span><strong>${resultado.items.length} producto${resultado.items.length === 1 ? '' : 's'}</strong> verificado${resultado.items.length === 1 ? '' : 's'} · Stock disponible</span>
                </div>
                <table class="data-table data-table-sm" style="margin-top:0.6rem;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="text-right" style="width:80px;">Req.</th>
                            <th class="text-right" style="width:80px;">Disp.</th>
                            <th style="width:40px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultado.items.map(function (item) { return '<tr><td><strong>' + formatters.textoSeguro(item.nombre) + '</strong></td><td class="text-right">' + item.requerido + '</td><td class="text-right">' + item.disponible + '</td><td class="text-center" style="color:var(--success);"><i data-lucide="check-circle" style="width:16px;height:16px;"></i></td></tr>'; }).join('')}
                    </tbody>
                </table>
                <p style="margin-top:0.75rem;">${config.msg}</p>`;
        } else {
            document.getElementById('confirmar-mensaje').textContent = config.msg;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
        return true;
    }

    async function prepararConfirmacionPago(id, config) {
        try {
            const resumen = await API.pagos.resumen(id);
            const pagado = formatters.precio(resumen.totalCobrado || 0);
            const total = formatters.precio(resumen.precioTotal || 0);
            const pendiente = formatters.precio(resumen.saldoPendiente || 0);
            const anticipo = resumen.anticipo || {};
            const montoMinimo = Number(anticipo.montoMinimoAnticipo || 0);
            const porcentaje = Number(anticipo.porcentajeAnticipoMinimo || 0);
            const cumplido = montoMinimo <= 0 || (resumen.totalCobrado || 0) >= montoMinimo;

            var html = 'El evento pasara a estado CONFIRMADO tras asegurar el pago minimo.<br><br>';
            html += '<strong>Resumen de pagos:</strong><br>';
            html += 'Total del evento: <strong>$' + total + '</strong><br>';
            html += 'Total pagado: <strong>$' + pagado + '</strong><br>';
            html += 'Saldo pendiente: <strong>$' + pendiente + '</strong><br>';

            if (montoMinimo > 0) {
                var faltante = Math.max(0, montoMinimo - (resumen.totalCobrado || 0));
                html += '<br><strong>Anticipo requerido:</strong> ' + porcentaje + '% (minimo <strong>$' + formatters.precio(montoMinimo) + '</strong>)<br>';
                if (!cumplido) {
                    html += '<span style="color:var(--warning);font-weight:600;">Faltan <strong>$' + formatters.precio(faltante) + '</strong> para alcanzar el minimo. Registra un pago antes de confirmar.</span>';
                } else {
                    html += '<span style="color:var(--success);font-weight:600;">Minimo cubierto. Podes confirmar el evento.</span>';
                }
            } else {
                html += '<br><span style="color:var(--success);font-weight:600;">Sin requisito de anticipo minimo.</span>';
            }

            document.getElementById('confirmar-mensaje').innerHTML = html;
        } catch (_) {
            document.getElementById('confirmar-mensaje').innerHTML = `
                ${config.msg}<br><br>
                <span style="color:var(--warning)">⚠️ No se detectaron pagos registrados. Necesitás registrar al menos un pago antes de confirmar.</span>
            `;
        }
    }

    function prepararDobleConfirmacion(config) {
        document.getElementById('confirmar-mensaje').innerHTML = `
            <div style="color:var(--danger);font-weight:600;margin-bottom:1rem;">
                ⚠️ ${config.msg}
            </div>
            <div class="form-group">
                <label for="input-doble-confirmar">Escribí <strong>CONFIRMAR</strong> para proceder:</label>
                <input type="text" id="input-doble-confirmar" class="input-sm"
                       placeholder="Escribí CONFIRMAR..." autocomplete="off"
                       style="width:100%;padding:8px 12px;border:1px solid var(--neutral-200);border-radius:6px;">
            </div>
        `;

        const btn = document.getElementById('btn-confirmar-accion');
        btn.disabled = true;
        const input = document.getElementById('input-doble-confirmar');
        const handler = () => { btn.disabled = input.value.trim() !== 'CONFIRMAR'; };
        input.addEventListener('input', handler);
        btn._confirmHandler = handler;
        btn._confirmInput = input;
    }

    async function confirmarAccion(id, accion, deps) {
        state.eventoAccionId = id;
        const config = CONFIRMACION_CONFIG[accion];
        setConfirmarBase(config, () => deps.ejecutarAccion(accion));

        if (accion === 'programar') {
            await prepararConfirmacionProgramar(id, config, deps);
            return;
        }

        if (accion === 'confirmar') {
            await prepararConfirmacionPago(id, config);
        } else if (accion === 'confirmarCancelacion') {
            prepararDobleConfirmacion(config);
        } else {
            document.getElementById('confirmar-mensaje').textContent = config.msg;
        }

        modulos.abrirModal('modal-confirmar');
    }

    function abrirModalCancelar(id) {
        state.eventoAccionId = id;
        const evento = state.eventos.find(e => e.id === id);
        state.eventoCancelandoEstado = evento?.estadoEventoNombre || '';
        ocultarAlertaId('modal-cancelar-alert');
        document.getElementById('motivo-cancelacion').value = '';

        const mensaje = document.querySelector('#modal-cancelar .modal-body p');
        const subtitulo = document.querySelector('#modal-cancelar .modal-header-sub');
        if (state.eventoCancelandoEstado === EVENTO_ESTADOS.COTIZACION) {
            mensaje.innerHTML = 'El evento sera <strong>cancelado inmediatamente</strong>. Esta accion no se puede deshacer.';
            if (subtitulo) subtitulo.textContent = 'Cancelacion directa · Sin periodo de gracia';
        } else {
            mensaje.innerHTML = 'El evento pasara a estado <strong>Cancelacion Pendiente</strong>. Tendras un tiempo de gracia antes de la baja definitiva.';
            if (subtitulo) subtitulo.textContent = 'Se iniciara periodo de cancelacion pendiente';
        }

        modulos.abrirModal('modal-cancelar');
    }

    function cerrarModalCancelar() {
        state.eventoCancelandoEstado = null;
        modulos.cerrarModal('modal-cancelar');
    }

    function cerrarModalConfirmar() {
        const btn = document.getElementById('btn-confirmar-accion');
        if (btn._confirmInput && btn._confirmHandler) {
            btn._confirmInput.removeEventListener('input', btn._confirmHandler);
            btn._confirmInput = null;
            btn._confirmHandler = null;
        }
        btn.disabled = false;
        document.getElementById('confirmar-mensaje').textContent = '';
        modulos.cerrarModal('modal-confirmar');
    }

    window.EventosConfirmations = Object.freeze({
        confirmarAccion,
        abrirModalCancelar,
        cerrarModalCancelar,
        cerrarModalConfirmar
    });
})();
