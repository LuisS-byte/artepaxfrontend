/**
 * modules/decoraciones/js/decoraciones.composition.js
 * Logica de composicion dinamica de productos del modulo Decoraciones.
 * Manejo de filas, hints de stock, resumen y sincronizacion de opciones.
 * Depende de: DecoracionesState, DecoracionesHelpers, formatters, modulos.
 */
window.DecoracionesComposition = (() => {

    function getProductoIdFila(row) {
        return row.querySelector('.composition-producto-id')?.value || '';
    }

    function getProductoNombreFila(row) {
        return row.querySelector('.composition-producto-autocomplete')?.value || '';
    }

    function resetProductosDecoracion(productos = []) {
        const container = document.getElementById('productos-decoracion-lista');
        container.innerHTML = '';

        if (productos.length === 0) {
            agregarProductoDecoracion();
            actualizarResumenComposicion();
            return;
        }

        productos.forEach(producto => {
            agregarProductoDecoracion(producto.productoId, producto.cantidadRequerida);
        });
        sincronizarOpcionesComposicion();
        actualizarResumenComposicion();
    }

    function renderStockProductoHint(productoId = '', cantidadRequerida = '') {
        const producto = DecoracionesState.productosDisponibles.find(item => String(item.id) === String(productoId));
        const stock = DecoracionesHelpers.getStockProducto(productoId);

        if (!productoId || !producto) {
            return '<div class="composition-stock"><strong>Sin producto seleccionado</strong><small>Elegi un producto activo para ver disponibilidad real.</small></div>';
        }

        if (DecoracionesHelpers.hayErrorCargaStock(productoId)) {
            return `<div class="composition-stock is-warning"><strong>${formatters.textoSeguro(producto.nombre)}</strong><small>No se pudo validar la disponibilidad en este momento.</small></div>`;
        }

        if (!stock) {
            return `<div class="composition-stock is-danger"><strong>${formatters.textoSeguro(producto.nombre)}</strong><small>Sin stock operativo disponible para validar.</small></div>`;
        }

        const disponible = Number(stock.cantidadDisponible || 0);
        const requerido = Number(cantidadRequerida || 0);
        const critico = !!stock.stockBajoAlerta;
        const insuficiente = requerido > 0 && requerido > disponible;

        let clase = 'composition-stock is-success';
        if (critico) clase = 'composition-stock is-warning';
        if (insuficiente) clase = 'composition-stock is-danger';

        return `
            <div class="${clase}">
                <strong>${formatters.textoSeguro(producto.nombre)}</strong>
                <small>Disponible: ${disponible} · Reservado: ${stock.cantidadReservada || 0}</small>
                <small>${insuficiente ? `Requiere ${requerido} y no alcanza.` : critico ? 'Stock crítico: conviene cambiar este producto.' : 'Disponible para composicion.'}</small>
            </div>`;
    }

    function actualizarHintFila(row) {
        const productoId = getProductoIdFila(row);
        const cantidad = row.querySelector('.composition-cantidad')?.value || '';
        const hint = row.querySelector('.composition-stock-wrap');
        if (!hint) return;
        hint.innerHTML = renderStockProductoHint(productoId, cantidad);
        actualizarResumenFila(row);
        sincronizarOpcionesComposicion();
        actualizarResumenComposicion();
    }

    function actualizarEtiquetasFilas() {
        const rows = Array.from(document.querySelectorAll('#productos-decoracion-lista .composition-row'));
        rows.forEach((row, index) => {
            const badge = row.querySelector('.composition-row-index');
            if (badge) badge.textContent = `Producto ${index + 1}`;
        });
    }

    function actualizarResumenFila(row) {
        const productoId = getProductoIdFila(row);
        const cantidad = Number(row.querySelector('.composition-cantidad')?.value || 0);
        const resumen = row.querySelector('.composition-row-summary');
        if (!resumen) return;

        if (!productoId || !cantidad) {
            resumen.textContent = 'Elegí producto y cantidad para validar esta línea.';
            resumen.className = 'composition-row-summary is-neutral';
            return;
        }

        const producto = DecoracionesState.productosDisponibles.find(item => String(item.id) === String(productoId));
        if (!producto) {
            resumen.textContent = 'Producto no disponible en catálogo.';
            resumen.className = 'composition-row-summary is-danger';
            return;
        }

        if (DecoracionesHelpers.hayErrorCargaStock(productoId)) {
            resumen.textContent = `No se pudo validar ${producto.nombre}. Recargá stock antes de guardar.`;
            resumen.className = 'composition-row-summary is-warning';
            return;
        }

        const stock = DecoracionesHelpers.getStockProducto(productoId);
        if (!stock) {
            resumen.textContent = `Sin stock operativo disponible para ${producto.nombre}.`;
            resumen.className = 'composition-row-summary is-danger';
            return;
        }

        if (stock.stockBajoAlerta) {
            resumen.textContent = `${producto.nombre} quedó marcado con stock crítico.`;
            resumen.className = 'composition-row-summary is-warning';
            return;
        }

        if (Number(stock.cantidadDisponible || 0) < cantidad) {
            resumen.textContent = `${producto.nombre} no alcanza para ${cantidad} unidad(es).`;
            resumen.className = 'composition-row-summary is-danger';
            return;
        }

        resumen.textContent = `${producto.nombre} validado para ${cantidad} unidad(es).`;
        resumen.className = 'composition-row-summary is-success';
    }

    function getIdsSeleccionados(excludeRow = null) {
        return Array.from(document.querySelectorAll('#productos-decoracion-lista .composition-row'))
            .filter(row => row !== excludeRow)
            .map(row => getProductoIdFila(row))
            .filter(Boolean);
    }

    function sincronizarOpcionesComposicion() {
        Array.from(document.querySelectorAll('#productos-decoracion-lista .composition-row')).forEach(row => {
            const resultsEl = row.querySelector('.autocomplete-results');
            if (resultsEl && !resultsEl.classList.contains('hidden')) {
                renderResultadosAutocomplete(row, getProductoNombreFila(row).trim());
            }
        });
    }

    function renderResultadosAutocomplete(row, query) {
        const resultsEl = row.querySelector('.autocomplete-results');
        if (!resultsEl) return;

        if (!query || query.length < 1) {
            resultsEl.classList.add('hidden');
            resultsEl.innerHTML = '';
            return;
        }

        const idsSeleccionados = getIdsSeleccionados(row);
        const matches = DecoracionesHelpers.getProductosActivos()
            .filter(producto => !idsSeleccionados.includes(String(producto.id)))
            .filter(producto => producto.nombre.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 12);

        if (!matches.length) {
            resultsEl.innerHTML = `<div class="autocomplete-empty">No se encontraron productos con «${formatters.textoSeguro(query)}»</div>`;
            resultsEl.classList.remove('hidden');
            return;
        }

        resultsEl.innerHTML = matches.map(producto => {
            const stock = DecoracionesHelpers.getStockProducto(producto.id);
            const stockLabel = stock
                ? `Disp: ${stock.cantidadDisponible}${stock.stockBajoAlerta ? ' · Crítico' : ''}`
                : 'Sin stock validado';

            return `<button type="button" class="autocomplete-result" data-id="${producto.id}" data-nombre="${formatters.textoSeguro(producto.nombre)}">
                <span class="autocomplete-result-name">${formatters.textoSeguro(producto.nombre)}</span>
                <span class="autocomplete-result-meta"><span class="autocomplete-result-stock">${formatters.textoSeguro(stockLabel)}</span></span>
            </button>`;
        }).join('');

        resultsEl.classList.remove('hidden');
        Array.from(resultsEl.querySelectorAll('.autocomplete-result')).forEach(btn => {
            btn.addEventListener('click', () => seleccionarProductoFila(row, btn.dataset.id, btn.dataset.nombre));
        });
    }

    function seleccionarProductoFila(row, productoId, productoNombre) {
        const hiddenInput = row.querySelector('.composition-producto-id');
        const input = row.querySelector('.composition-producto-autocomplete');
        const clearBtn = row.querySelector('.autocomplete-clear');
        const resultsEl = row.querySelector('.autocomplete-results');

        if (hiddenInput) hiddenInput.value = productoId;
        if (input) {
            input.value = productoNombre || '';
            input.setAttribute('aria-expanded', 'false');
        }
        if (clearBtn) clearBtn.classList.remove('hidden');
        if (resultsEl) {
            resultsEl.classList.add('hidden');
            resultsEl.innerHTML = '';
        }

        actualizarHintFila(row);
    }

    function limpiarProductoFila(row) {
        const hiddenInput = row.querySelector('.composition-producto-id');
        const input = row.querySelector('.composition-producto-autocomplete');
        const clearBtn = row.querySelector('.autocomplete-clear');
        const resultsEl = row.querySelector('.autocomplete-results');

        if (hiddenInput) hiddenInput.value = '';
        if (input) {
            input.value = '';
            input.focus();
            input.setAttribute('aria-expanded', 'false');
        }
        if (clearBtn) clearBtn.classList.add('hidden');
        if (resultsEl) {
            resultsEl.classList.add('hidden');
            resultsEl.innerHTML = '';
        }

        actualizarHintFila(row);
    }

    function bindAutocompleteFila(row) {
        const input = row.querySelector('.composition-producto-autocomplete');
        const hiddenInput = row.querySelector('.composition-producto-id');
        const clearBtn = row.querySelector('.autocomplete-clear');
        const resultsEl = row.querySelector('.autocomplete-results');

        if (!input || !hiddenInput || !resultsEl) return;

        input.addEventListener('input', debounce(function() {
            const query = this.value.trim();

            if (hiddenInput.value) {
                hiddenInput.value = '';
            }

            if (clearBtn) {
                clearBtn.classList.toggle('hidden', !query.length);
            }

            renderResultadosAutocomplete(row, query);
            this.setAttribute('aria-expanded', query.length ? 'true' : 'false');
            actualizarHintFila(row);
        }, 180));

        input.addEventListener('focus', function() {
            const query = this.value.trim();
            if (query) {
                renderResultadosAutocomplete(row, query);
                this.setAttribute('aria-expanded', 'true');
            }
        });

        input.addEventListener('blur', function() {
            setTimeout(() => {
                resultsEl.classList.add('hidden');
                this.setAttribute('aria-expanded', 'false');
            }, 180);
        });

        input.addEventListener('keydown', function(e) {
            const items = Array.from(resultsEl.querySelectorAll('.autocomplete-result'));
            if (!items.length || resultsEl.classList.contains('hidden')) {
                if (e.key === 'Escape') resultsEl.classList.add('hidden');
                return;
            }

            let activeIdx = items.findIndex(item => item.classList.contains('autocomplete-result--active'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
                if (activeIdx >= 0) items[activeIdx].classList.remove('autocomplete-result--active');
                items[nextIdx].classList.add('autocomplete-result--active');
                items[nextIdx].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
                if (activeIdx >= 0) items[activeIdx].classList.remove('autocomplete-result--active');
                items[prevIdx].classList.add('autocomplete-result--active');
                items[prevIdx].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIdx < 0) activeIdx = 0;
                items[activeIdx]?.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                resultsEl.classList.add('hidden');
                this.setAttribute('aria-expanded', 'false');
            }
        });

        clearBtn?.addEventListener('click', () => limpiarProductoFila(row));
    }

    function actualizarResumenComposicion() {
        const productos = obtenerProductosDecoracion();
        const totalTipos = new Set(productos.map(item => item.productoId)).size;
        const totalUnidades = productos.reduce((acc, item) => acc + Number(item.cantidadRequerida || 0), 0);
        const costoEstimado = DecoracionesHelpers.calcularCostoEstimado(productos);
        const precioActual = Number(document.getElementById('input-precio')?.value || 0);
        const margenEstimado = precioActual - costoEstimado;
        const pendientes = productos.reduce((acc, item) => {
            return DecoracionesHelpers.hayErrorCargaStock(item.productoId) ? acc + 1 : acc;
        }, 0);
        const riesgos = productos.reduce((acc, item) => {
            if (DecoracionesHelpers.hayErrorCargaStock(item.productoId)) return acc;
            const stock = DecoracionesHelpers.getStockProducto(item.productoId);
            if (!stock) return acc + 1;
            if (stock.stockBajoAlerta || Number(stock.cantidadDisponible || 0) < Number(item.cantidadRequerida || 0)) {
                return acc + 1;
            }
            return acc;
        }, 0);

        const salud = document.getElementById('composicion-salud');
        const saludTitulo = document.getElementById('composicion-salud-titulo');
        const saludDetalle = document.getElementById('composicion-salud-detalle');
        const tipos = document.getElementById('composicion-total-tipos');
        const unidades = document.getElementById('composicion-total-unidades');
        const riesgo = document.getElementById('composicion-total-riesgo');
        const footerTitle = document.getElementById('drawer-footer-title');
        const footerCopy = document.getElementById('drawer-footer-copy');
        const costoEl = document.getElementById('decor-costo-estimado');
        const margenEl = document.getElementById('decor-margen-estimado');
        const rentabilidadEstado = document.getElementById('decor-rentabilidad-estado');
        const businessTitle = document.getElementById('decor-business-title');
        const businessCopy = document.getElementById('decor-business-copy');
        if (!salud || !saludTitulo || !saludDetalle || !tipos || !unidades || !riesgo) return;

        tipos.textContent = totalTipos;
        unidades.textContent = totalUnidades;
        riesgo.textContent = riesgos + pendientes;
        if (costoEl) costoEl.textContent = `$${formatters.precio(costoEstimado)}`;
        if (margenEl) margenEl.textContent = `$${formatters.precio(margenEstimado)}`;
        actualizarEtiquetasFilas();

        if (rentabilidadEstado) {
            rentabilidadEstado.className = 'decor-business-health';
            if (!productos.length) {
                rentabilidadEstado.textContent = 'Esperando datos';
                rentabilidadEstado.classList.add('is-neutral');
                if (businessTitle) businessTitle.textContent = 'Definí precio y composición';
                if (businessCopy) businessCopy.textContent = 'Usá este resumen para evitar cargar una decoración con precio por debajo del costo estimado de materiales.';
            } else if (precioActual <= 0) {
                rentabilidadEstado.textContent = 'Definí el precio de venta';
                rentabilidadEstado.classList.add('is-warning');
                if (businessTitle) businessTitle.textContent = 'Falta precio de venta';
                if (businessCopy) businessCopy.textContent = 'Primero definí el precio para comparar contra el costo estimado de materiales.';
            } else if (margenEstimado < 0) {
                rentabilidadEstado.textContent = 'Precio por debajo del costo';
                rentabilidadEstado.classList.add('is-danger');
                if (businessTitle) businessTitle.textContent = 'Precio insuficiente';
                if (businessCopy) businessCopy.textContent = `Subí el precio al menos a $${formatters.precio(costoEstimado)} para cubrir materiales.`;
            } else if (margenEstimado === 0) {
                rentabilidadEstado.textContent = 'Sin margen estimado';
                rentabilidadEstado.classList.add('is-warning');
                if (businessTitle) businessTitle.textContent = 'Margen en cero';
                if (businessCopy) businessCopy.textContent = 'La decoración cubre materiales, pero no deja margen estimado.';
            } else {
                rentabilidadEstado.textContent = 'Margen estimado positivo';
                rentabilidadEstado.classList.add('is-success');
                if (businessTitle) businessTitle.textContent = 'Rentabilidad estimada saludable';
                if (businessCopy) businessCopy.textContent = `La diferencia estimada entre venta y materiales es $${formatters.precio(margenEstimado)}.`;
            }
        }

        // ── Price input live validation inline hint ──────────
        const priceInput = document.getElementById('input-precio');
        const validationEl = document.getElementById('price-validation');
        const validationDot = document.getElementById('price-validation-dot');
        const validationText = document.getElementById('price-validation-text');

        if (priceInput && validationEl && validationDot && validationText) {
            priceInput.classList.remove('price-input--healthy', 'price-input--break-even', 'price-input--loss', 'price-input--empty');
            validationEl.className = 'price-validation';
            validationDot.className = 'price-validation-dot';

            if (!productos.length) {
                validationEl.classList.add('is-muted');
                validationDot.classList.add('is-muted');
                validationText.textContent = 'Agregá productos para estimar el costo';
                priceInput.classList.add('price-input--empty');
            } else if (!precioActual || precioActual <= 0) {
                validationEl.classList.add('is-muted');
                validationDot.classList.add('is-muted');
                validationText.textContent = 'Definí el precio de venta para ver la comparación';
                priceInput.classList.add('price-input--empty');
            } else if (costoEstimado <= 0) {
                validationEl.classList.add('is-break-even');
                validationDot.classList.add('is-break-even');
                validationText.textContent = 'Costo de materiales no disponible — verificá los productos';
                priceInput.classList.add('price-input--break-even');
            } else if (margenEstimado < 0) {
                const porc = Math.abs(Math.round((margenEstimado / costoEstimado) * 100));
                validationEl.classList.add('is-loss');
                validationDot.classList.add('is-loss');
                validationText.textContent = `El precio está por debajo del costo — pérdida del ${porc}%`;
                priceInput.classList.add('price-input--loss');
            } else if (margenEstimado === 0) {
                validationEl.classList.add('is-break-even');
                validationDot.classList.add('is-break-even');
                validationText.textContent = 'Cubre el costo sin margen de ganancia';
                priceInput.classList.add('price-input--break-even');
            } else {
                const porc = Math.round((margenEstimado / costoEstimado) * 100);
                validationEl.classList.add('is-healthy');
                validationDot.classList.add('is-healthy');
                validationText.textContent = `Margen positivo — +${porc}% sobre costo estimado`;
                priceInput.classList.add('price-input--healthy');
            }
        }

        salud.className = 'composition-health';
        if (!productos.length) {
            saludTitulo.textContent = 'Sin composición';
            saludDetalle.textContent = 'Agregá productos activos para validar la plantilla.';
            salud.classList.add('is-neutral');
            if (footerTitle) footerTitle.textContent = 'Falta definir la composición';
            if (footerCopy) footerCopy.textContent = 'Agregá al menos un producto para poder guardar esta decoración.';
            return;
        }

        if (pendientes > 0) {
            saludTitulo.textContent = 'Validación pendiente';
            saludDetalle.textContent = `${pendientes} producto(s) sin confirmación de stock por un problema de carga.`;
            salud.classList.add('is-warning');
            if (footerTitle) footerTitle.textContent = 'Esperando validación de stock';
            if (footerCopy) footerCopy.textContent = 'Recargá o revisá los productos sin validación antes de confirmar la plantilla.';
            return;
        }

        if (riesgos > 0) {
            saludTitulo.textContent = 'Riesgo de stock';
            saludDetalle.textContent = 'Hay productos con stock crítico o insuficiente.';
            salud.classList.add('is-danger');
            if (footerTitle) footerTitle.textContent = 'Composición con alertas';
            if (footerCopy) footerCopy.textContent = 'Ajustá cantidades o reemplazá productos antes de guardar cambios.';
            return;
        }

        if (precioActual <= 0 && costoEstimado > 0) {
            saludTitulo.textContent = 'Falta precio de venta';
            saludDetalle.textContent = 'Definí el precio para comparar contra el costo estimado de materiales.';
            salud.classList.add('is-warning');
            if (footerTitle) footerTitle.textContent = 'Precio no definido';
            if (footerCopy) footerCopy.textContent = 'Establecé un precio de venta para validar la rentabilidad de la composición.';
            return;
        }

        if (precioActual > 0 && margenEstimado < 0) {
            saludTitulo.textContent = 'Precio insuficiente';
            saludDetalle.textContent = 'El precio de venta quedó por debajo del costo estimado de materiales.';
            salud.classList.add('is-danger');
            if (footerTitle) footerTitle.textContent = 'Precio por debajo del costo';
            if (footerCopy) footerCopy.textContent = `Subí el precio al menos a $${formatters.precio(costoEstimado)} para cubrir materiales.`;
            return;
        }

        saludTitulo.textContent = 'Lista para usar';
        saludDetalle.textContent = `Composición validada para ${totalUnidades} unidad(es) requeridas.`;
        salud.classList.add('is-success');
        if (footerTitle) footerTitle.textContent = 'Composición validada';
        if (footerCopy) footerCopy.textContent = `${totalTipos} tipo(s) y ${totalUnidades} unidad(es) listas para guardar en la plantilla.`;
    }

    function agregarProductoDecoracion(productoId = '', cantidadRequerida = '') {
        const container = document.getElementById('productos-decoracion-lista');
        const row = document.createElement('div');
        row.className = 'composition-row';

        row.innerHTML = `
            <div class="composition-row-topline">
                <span class="composition-row-index">Producto</span>
                <span class="composition-row-summary is-neutral">Elegí producto y cantidad para validar esta línea.</span>
            </div>
            <div class="form-group composition-product-field">
                <label>Producto *</label>
                <div class="autocomplete-field composition-autocomplete-field">
                    <div class="autocomplete-input-wrapper">
                        <span class="autocomplete-icon"><i data-lucide="search"></i></span>
                        <input type="hidden" class="composition-producto-id" value="${productoId || ''}">
                        <input type="text" class="composition-producto-autocomplete" value="${productoId ? formatters.textoSeguro((DecoracionesState.productosDisponibles.find(p => String(p.id) === String(productoId))?.nombre) || '') : ''}" placeholder="Buscar producto activo..." autocomplete="off" aria-expanded="false">
                        <button type="button" class="autocomplete-clear ${productoId ? '' : 'hidden'}" aria-label="Limpiar selección"><i data-lucide="x"></i></button>
                    </div>
                    <div class="autocomplete-results hidden"></div>
                </div>
            </div>
            <div class="form-group composition-quantity-field">
                <label>Cantidad *</label>
                <input type="number" class="composition-cantidad" min="1" step="1" value="${cantidadRequerida || ''}" required>
            </div>
            <div class="composition-stock-wrap">${renderStockProductoHint(productoId, cantidadRequerida)}</div>
            <div class="composition-actions">
                <button type="button" class="btn btn-outline btn-sm btn-danger-hover" onclick="eliminarProductoDecoracion(this)">Quitar</button>
            </div>
        `;

        row.querySelector('.composition-cantidad')?.addEventListener('input', () => actualizarHintFila(row));
        container.appendChild(row);
        bindAutocompleteFila(row);
        actualizarResumenFila(row);
        sincronizarOpcionesComposicion();
        actualizarResumenComposicion();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function eliminarProductoDecoracion(button) {
        const container = document.getElementById('productos-decoracion-lista');

        if (container.children.length === 1) {
            return mostrarAlertaId('drawer-alert', 'error', 'La decoracion debe tener al menos un producto.');
        }

        button.closest('.composition-row')?.remove();
        sincronizarOpcionesComposicion();
        actualizarResumenComposicion();
    }

    function obtenerProductosDecoracion() {
        return Array.from(document.querySelectorAll('#productos-decoracion-lista .composition-row'))
            .map((row) => {
                const productoId = parseInt(getProductoIdFila(row), 10);
                const cantidadRequerida = parseInt(row.querySelector('.composition-cantidad')?.value, 10);

                if (!productoId || !cantidadRequerida) {
                    return null;
                }

                return { productoId, cantidadRequerida };
            })
            .filter(Boolean);
    }

    return {
        resetProductosDecoracion,
        renderStockProductoHint,
        actualizarHintFila,
        sincronizarOpcionesComposicion,
        actualizarResumenComposicion,
        seleccionarProductoFila,
        limpiarProductoFila,
        agregarProductoDecoracion,
        eliminarProductoDecoracion,
        obtenerProductosDecoracion
    };
})();

// Inline onclick compatibility: handlers llamados desde HTML o templates generados
window.agregarProductoDecoracion = window.DecoracionesComposition.agregarProductoDecoracion;
window.eliminarProductoDecoracion = window.DecoracionesComposition.eliminarProductoDecoracion;
