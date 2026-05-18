(function () {
    let extrasEventoId = null;
    let extrasItems = [];
    const stockCache = {};
    const precioProductos = {};
    let stockListenerInit = false;

    function getNombreProductoDesdeOption(opt) {
        const text = opt?.text || '';
        const parenIndex = text.indexOf(' (');
        return parenIndex > 0 ? text.substring(0, parenIndex) : text;
    }

    function actualizarOptionStock(select, productoId, disponible) {
        for (let i = 0; i < select.options.length; i++) {
            if (parseInt(select.options[i].value, 10) === productoId) {
                const base = getNombreProductoDesdeOption(select.options[i]);
                select.options[i].text = `${base} (Stock disp: ${disponible})`;
                break;
            }
        }
    }

    function getPrecioUnitario(productoId) {
        const cached = stockCache[productoId];
        if (cached?.precioUnitario) return cached.precioUnitario;
        return precioProductos[productoId] ?? 0;
    }

    function getTotalMinimo() {
        let total = 0;
        for (const item of extrasItems) {
            total += getPrecioUnitario(item.productoId) * item.cantidad;
        }
        return total;
    }

    function validarMontoMinimo() {
        const totalMinimo = getTotalMinimo();
        const montoInput = document.getElementById('extras-monto');
        const valor = parseFloat(montoInput?.value);

        if (totalMinimo > 0 && valor > 0 && valor < totalMinimo) {
            montoInput.classList.add('input-error');
            return false;
        }
        montoInput?.classList.remove('input-error');
        return true;
    }

    function actualizarMontoSugerido() {
        const totalMinimo = getTotalMinimo();
        const montoInput = document.getElementById('extras-monto');
        const hint = document.getElementById('extras-monto-hint');

        // Auto-fill si está vacío o en 0
        if (totalMinimo > 0 && (!montoInput.value || parseFloat(montoInput.value) <= 0)) {
            montoInput.value = totalMinimo.toFixed(2);
        }

        if (hint) {
            if (totalMinimo > 0) {
                hint.textContent = `Mínimo: $${totalMinimo.toFixed(2)} — No puede ser menor al costo de los productos agregados`;
                hint.classList.remove('hidden');
            } else {
                hint.classList.add('hidden');
            }
        }

        validarMontoMinimo();
    }

    function initStockListener() {
        if (stockListenerInit) return;
        stockListenerInit = true;

        const select = document.getElementById('extras-select-producto');
        if (!select) return;

        select.addEventListener('change', async function () {
            const productoId = parseInt(this.value, 10);
            if (!productoId || isNaN(productoId)) return;

            // Ya cacheado -> solo actualizar texto sin llamar API
            if (stockCache[productoId] !== undefined) {
                actualizarOptionStock(this, productoId, stockCache[productoId].disponible);
                actualizarMontoSugerido();
                return;
            }

            const base = getNombreProductoDesdeOption(this.options[this.selectedIndex]);
            this.options[this.selectedIndex].text = `${base} (Consultando stock...)`;

            try {
                const stock = await API.inventario.stockProducto(productoId);
                const disponible = stock.cantidadDisponible ?? 0;
                stockCache[productoId] = {
                    disponible,
                    precioUnitario: stock.precioUnitario ?? precioProductos[productoId] ?? 0
                };
                this.options[this.selectedIndex].text = `${base} (Stock disp: ${disponible})`;
                actualizarMontoSugerido();
            } catch (_) {
                this.options[this.selectedIndex].text = `${base} (Stock: error al consultar)`;
            }
        });

        // Listener en cantidad: actualizar monto sugerido al cambiar cantidad
        const cantidadInput = document.getElementById('extras-cantidad');
        if (cantidadInput) {
            cantidadInput.addEventListener('input', () => actualizarMontoSugerido());
        }

        // Listener en monto: validar que no baje del mínimo en tiempo real
        const montoInput = document.getElementById('extras-monto');
        if (montoInput) {
            montoInput.addEventListener('input', () => validarMontoMinimo());
        }
    }

    function abrirModalExtras(id) {
        extrasEventoId = id;
        extrasItems = [];
        document.getElementById('extras-monto').value = '';
        document.getElementById('extras-nota-precio').value = '';
        ocultarAlertaId('extras-alert');
        renderExtrasItems();
        cargarExtrasProductos();
        initStockListener();
        modulos.abrirModal('modal-extras');
    }

    async function cargarExtrasProductos() {
        try {
            const productos = await API.productos.list();
            const activos = productos.filter(p => p.produEstado !== 'INACTIVO' && p.estado !== 'INACTIVO');
            // Limpiar cache al recargar (nueva apertura del modal)
            Object.keys(stockCache).forEach(k => delete stockCache[k]);

            // Guardar precio de cada producto desde el listado (fallback confiable)
            activos.forEach(p => {
                precioProductos[p.id] = p.precioUnitario ?? p.precio ?? 0;
            });

            // Mostrar solo el nombre SIN stock inicial — evita alucinación
            modulos.limpiarSelect('extras-select-producto',
                activos.map(p => ({
                    value: p.id,
                    label: p.produNombre || p.nombre || 'Producto #' + p.id
                })),
                'Seleccionar producto...');

            // Batch: cargar stock real de TODOS los productos activos en paralelo
            const select = document.getElementById('extras-select-producto');
            if (!select || activos.length === 0) return;

            await Promise.allSettled(activos.map(async (p) => {
                try {
                    const stock = await API.inventario.stockProducto(p.id);
                    const disponible = stock.cantidadDisponible ?? 0;
                    stockCache[p.id] = {
                        disponible,
                        precioUnitario: stock.precioUnitario ?? precioProductos[p.id] ?? 0
                    };
                    actualizarOptionStock(select, p.id, disponible);
                } catch (_) {
                    // Silencio — producto se queda sin stock display
                }
            }));
            // Una vez cargados todos los stocks, actualizar el monto sugerido
            actualizarMontoSugerido();
        } catch (_) {
            mostrarAlertaId('extras-alert', 'error', 'No se pudieron cargar los productos.');
        }
    }

    function agregarItemExtra() {
        const select = document.getElementById('extras-select-producto');
        const cantidad = parseInt(document.getElementById('extras-cantidad').value, 10);
        const productoId = parseInt(select.value, 10);

        if (!productoId || isNaN(productoId)) return mostrarAlertaId('extras-alert', 'error', 'Seleccioná un producto.');
        if (!cantidad || cantidad < 1) return mostrarAlertaId('extras-alert', 'error', 'La cantidad debe ser al menos 1.');

        const opt = select.options[select.selectedIndex];
        const productName = getNombreProductoDesdeOption(opt) || `Producto #${productoId}`;

        // Stock: primero del cache, si no del texto del option, si no null
        let stockDisponible = stockCache[productoId] !== undefined ? stockCache[productoId].disponible : null;
        if (stockDisponible === null) {
            const stockText = opt?.text.match(/Stock(?: disp)?:\s*(\d+)/);
            stockDisponible = stockText ? parseInt(stockText[1], 10) : null;
        }
        const existing = extrasItems.find(i => i.productoId === productoId);
        const cantidadTotal = (existing ? existing.cantidad : 0) + cantidad;

        if (stockDisponible !== null && cantidadTotal > stockDisponible) {
            return mostrarAlertaId('extras-alert', 'error', `Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${cantidadTotal}.`);
        }

        const precioUnitarioItem = getPrecioUnitario(productoId);

        if (existing) {
            existing.cantidad = cantidadTotal;
            existing.precioUnitario = precioUnitarioItem;
            const idx = extrasItems.indexOf(existing);
            setTimeout(() => {
                const fila = document.querySelector(`#extras-items-list tbody tr:nth-child(${idx + 1})`);
                if (fila) {
                    fila.style.transition = 'background 0.3s ease';
                    fila.style.background = 'rgba(46, 125, 50, 0.12)';
                    setTimeout(() => { fila.style.background = ''; }, 600);
                }
            }, 50);
        } else {
            extrasItems.push({ productoId, cantidad, nombre: productName, precioUnitario: precioUnitarioItem });
        }

        document.getElementById('extras-cantidad').value = 1;
        select.value = '';
        ocultarAlertaId('extras-alert');
        renderExtrasItems();
        actualizarMontoSugerido();
    }

    function eliminarItemExtra(index) {
        extrasItems.splice(index, 1);
        renderExtrasItems();
    }

    function renderExtrasItems() {
        const container = document.getElementById('extras-items-list');
        if (extrasItems.length === 0) {
            container.innerHTML = `
                <div class="detalle-empty-state" style="padding:1rem;">
                    <div class="detalle-empty-state-icon"><i data-lucide="package-open"></i></div>
                    <div class="detalle-empty-state-content">
                        <strong>No hay productos agregados aún</strong>
                        <p>Seleccioná un producto del catálogo y definí la cantidad para sumarlo a este evento.</p>
                    </div>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="col-producto">Producto</th>
                        <th class="col-precio">P.Unit</th>
                        <th class="col-cantidad">Cant.</th>
                        <th class="col-total">Total</th>
                        <th class="col-remove"></th>
                    </tr>
                </thead>
                <tbody>
                    ${extrasItems.map((item, i) => `
                    <tr>
                        <td class="col-producto">${formatters.textoSeguro(item.nombre)}</td>
                        <td class="col-precio">$${formatters.precio(item.precioUnitario || 0)}</td>
                        <td class="col-cantidad">${item.cantidad}</td>
                        <td class="col-total"><strong>$${formatters.precio((item.precioUnitario || 0) * item.cantidad)}</strong></td>
                        <td class="col-remove"><button class="btn-icon" onclick="eliminarItemExtra(${i})" title="Quitar"><i data-lucide="x"></i></button></td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function confirmarExtras(deps) {
        const montoAdicional = parseFloat(document.getElementById('extras-monto').value);
        const notaPrecio = document.getElementById('extras-nota-precio').value.trim();

        if (extrasItems.length === 0) return mostrarAlertaId('extras-alert', 'error', 'Agregá al menos un producto.');
        if (!montoAdicional || montoAdicional <= 0) return mostrarAlertaId('extras-alert', 'error', 'El monto adicional debe ser mayor a 0.');
        if (!notaPrecio) return mostrarAlertaId('extras-alert', 'error', 'El motivo del cargo es obligatorio.');

        const totalMinimo = getTotalMinimo();
        if (totalMinimo > 0 && montoAdicional < totalMinimo) {
            return mostrarAlertaId('extras-alert', 'error', `El monto adicional no puede ser menor al costo de los productos. Mínimo: $${totalMinimo.toFixed(2)}.`);
        }

        const btn = document.getElementById('btn-guardar-extras');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm"></span> Guardando...';

        try {
            await API.eventos.agregarExtras(extrasEventoId, {
                items: extrasItems.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
                notaPrecio,
                montoAdicional
            });
            mostrarAlerta('success', 'Extras agregados correctamente.');
            cerrarModalExtras();
            deps.refrescarVista();
        } catch (err) {
            mostrarAlertaId('extras-alert', 'error', 'Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    function cerrarModalExtras() {
        extrasEventoId = null;
        extrasItems = [];
        modulos.cerrarModal('modal-extras');
    }

    window.EventosExtras = Object.freeze({
        abrirModalExtras,
        cargarExtrasProductos,
        agregarItemExtra,
        eliminarItemExtra,
        renderExtrasItems,
        confirmarExtras,
        cerrarModalExtras
    });
})();
