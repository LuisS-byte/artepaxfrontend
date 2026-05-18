(function () {
    async function verRentabilidad(id) {
        try {
            const [r, productos, pagosResumen, gastos] = await Promise.all([
                API.eventos.rentabilidad(id),
                API.eventos.productos(id).catch(() => []),
                API.pagos.resumen(id).catch(() => null),
                API.gastos.porEvento(id).catch(() => [])
            ]);
            const ganancia = r.gananciaNeta || 0;
            const ingresoCobrado = r.ingresoCobrado || 0;
            const costos = (r.costoMateriales || 0) + (r.costoManoObra || 0)
                         + (r.gastosDesembolsados || 0) + (r.gastosProyectados || 0);
            const positiva = ganancia >= 0;
            const p = formatters.precio;
            const precioAcordado = r.precioAcordado || 0;
            const margen = precioAcordado > 0 ? ((ganancia / precioAcordado) * 100).toFixed(1) : '—';
            const totalProductos = productos.reduce((sum, pr) => sum + (pr.costoTotal || 0), 0);

            let html = '';

            // Hero: Ganancia Neta
            html += `
                <div class="renta-hero ${positiva ? 'renta-hero--positive' : 'renta-hero--negative'}">
                    <span class="renta-hero-label">Ganancia Neta</span>
                    <span class="renta-hero-value">${positiva ? '' : '−'}$${p(Math.abs(ganancia))}</span>
                    <span class="renta-hero-badge">${positiva ? '✓ Rentable' : '✗ Margen negativo'}</span>
                    <span class="renta-hero-margin">Margen: ${margen}%</span>
                </div>`;

            html += accordionSection('renta-fin', 'dollar-sign', 'Resumen Financiero', true, `
                <div class="renta-columns">
                    <div class="renta-column renta-column--income">
                        <h3 class="renta-column-title">Ingresos</h3>
                        <div class="renta-item"><span class="renta-item-label">Precio Acordado</span><span class="renta-item-value">$${p(precioAcordado)}</span></div>
                        <div class="renta-item renta-item--highlight"><span class="renta-item-label">Ingreso Cobrado</span><span class="renta-item-value">$${p(ingresoCobrado)}</span></div>
                    </div>
                    <div class="renta-column renta-column--costs">
                        <h3 class="renta-column-title">Costos</h3>
                        <div class="renta-item"><span class="renta-item-label">Materiales</span><span class="renta-item-value">$${p(r.costoMateriales || 0)}</span></div>
                        <div class="renta-item"><span class="renta-item-label">Mano de Obra</span><span class="renta-item-value">$${p(r.costoManoObra || 0)}</span></div>
                        <div class="renta-item"><span class="renta-item-label">Desembolsados</span><span class="renta-item-value">$${p(r.gastosDesembolsados || 0)}</span></div>
                        <div class="renta-item"><span class="renta-item-label">Proyectados</span><span class="renta-item-value">$${p(r.gastosProyectados || 0)}</span></div>
                        <div class="renta-item renta-item--total"><span class="renta-item-label">Total Costos</span><span class="renta-item-value">$${p(costos)}</span></div>
                    </div>
                </div>
                <div class="renta-extra-row">
                    <div class="renta-extra-item"><span class="renta-extra-label">Ingreso cobrado vs Precio acordado</span><span class="renta-extra-value">${precioAcordado > 0 ? Math.round((ingresoCobrado / precioAcordado) * 100) : '—'}%</span></div>
                    <div class="renta-extra-item"><span class="renta-extra-label">Costo productos sobre ingreso</span><span class="renta-extra-value">${ingresoCobrado > 0 ? Math.round((totalProductos / ingresoCobrado) * 100) : '—'}%</span></div>
                </div>
            `);

            if (productos.length > 0) {
                html += accordionSection('renta-prod', 'package', `Productos (${productos.length})`, false, `
                    <div class="table-wrapper">
                        <table class="data-table data-table-sm">
                            <thead><tr><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">Costo Unit.</th><th class="text-right">Costo Total</th><th>Estado</th></tr></thead>
                            <tbody>
                                ${productos.map(pr => `
                                <tr>
                                    <td><span class="producto-nombre">${formatters.textoSeguro(pr.nombre)}</span>${pr.origen === 'EXTRA' ? '<span class="producto-origen-badge">Extra</span>' : ''}</td>
                                    <td class="text-right">${pr.cantidad}</td>
                                    <td class="text-right">$${p(pr.costoUnitario || 0)}</td>
                                    <td class="text-right">$${p(pr.costoTotal || 0)}</td>
                                    <td><span class="reserva-badge reserva-badge--${(pr.estadoReserva || '').toLowerCase()}">${formatters.textoSeguro(pr.estadoReserva)}</span></td>
                                </tr>`).join('')}
                            </tbody>
                            <tfoot><tr><td colspan="3"><strong>Costo total productos</strong></td><td class="text-right"><strong>$${p(totalProductos)}</strong></td><td></td></tr></tfoot>
                        </table>
                    </div>
                `);
            }

            if (pagosResumen) {
                const totalCobrado = pagosResumen.totalCobrado || 0;
                const precioTotalP = pagosResumen.precioTotal || precioAcordado || 0;
                const saldoPendiente = pagosResumen.saldoPendiente || 0;
                const pctCobrado = precioTotalP > 0 ? Math.min(100, Math.round((totalCobrado / precioTotalP) * 100)) : 0;
                const devPendiente = pagosResumen.totalDevolucionPendiente || 0;
                html += accordionSection('renta-pagos', 'credit-card', 'Pagos', false, `
                    <div class="detalle-section-stack" style="padding:0">
                        <div class="financial-summary detalle-financial-summary" style="margin-bottom:var(--spacing-md)">
                            <div class="financial-card"><div class="fc-value">$${p(precioTotalP)}</div><div class="fc-label">Precio Total</div></div>
                            <div class="financial-card"><div class="fc-value success">$${p(totalCobrado)}</div><div class="fc-label">Total Cobrado</div></div>
                            <div class="financial-card"><div class="fc-value ${saldoPendiente > 0 ? 'warning' : 'success'}">$${p(saldoPendiente)}</div><div class="fc-label">Saldo Pendiente</div></div>
                            ${devPendiente > 0 ? `<div class="financial-card"><div class="fc-value warning">$${p(devPendiente)}</div><div class="fc-label">Dev. Pendiente</div></div>` : ''}
                        </div>
                        <div class="payment-progress">
                            <div class="pp-bar"><div class="pp-bar-fill" style="width: ${pctCobrado}%"></div></div>
                            <div class="pp-labels"><span>${pctCobrado}% cobrado</span><span>${saldoPendiente > 0 ? 'Faltan $' + p(saldoPendiente) : 'Evento saldado'}</span></div>
                        </div>
                    </div>
                `);
            }

            if (Array.isArray(gastos) && gastos.length > 0) {
                html += accordionSection('renta-gastos', 'receipt', `Gastos (${gastos.length})`, false, `
                    <div class="table-wrapper">
                        <table class="data-table data-table-sm">
                            <thead><tr><th>Concepto</th><th class="text-right">Monto</th><th>Estado</th></tr></thead>
                            <tbody>
                                ${gastos.map(g => `
                                <tr>
                                    <td>${formatters.textoSeguro(g.gastoConcepto || '—')}</td>
                                    <td class="text-right">$${p(g.gastoMonto || 0)}</td>
                                    <td><span class="badge ${g.gastoEstado === 'DESEMBOLSADO' ? 'badge-desembolsado' : 'badge-proyectado'}">${g.gastoEstado === 'DESEMBOLSADO' ? 'Desembolsado' : 'Proyectado'}</span></td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `);
            }

            html += `<div class="renta-meta"><span><strong>Estado:</strong> ${formatters.textoSeguro(r.estado || '—')}</span><span><strong>Fecha:</strong> ${formatFecha(r.fechaEvento)}</span></div>`;

            document.getElementById('rentabilidad-evento-contenido').innerHTML = html;
            modulos.abrirModal('modal-rentabilidad-evento');

            const heroEl = document.querySelector('.renta-hero-value');
            if (heroEl && ganancia !== 0) {
                const target = Math.abs(ganancia);
                const duration = 500;
                const start = performance.now();
                const prefix = positiva ? '' : '−';
                const animate = (now) => {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.round(target * eased);
                    heroEl.textContent = `${prefix}$${p(current)}`;
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }

            setTimeout(() => lucide.createIcons(), 50);
        } catch (err) {
            mostrarAlerta('error', 'No se pudo cargar la rentabilidad: ' + err.message);
        }
    }

    function cerrarModalRentabilidad() {
        modulos.cerrarModal('modal-rentabilidad-evento');
    }

    window.EventosRentabilidad = Object.freeze({
        verRentabilidad,
        cerrarModalRentabilidad
    });
})();
