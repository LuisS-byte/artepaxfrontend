/**
 * modules/inventario/inventario.js
 * Entry point / orchestrator del módulo Inventario.
 * State → helpers → render → api → actions → main (este archivo).
 *
 * Funciones globales (window.*): necesarias para onclick/onsubmit/onchange
 * en HTML y templates renderizados. Se mantendrán hasta migrar a data-action.
 */

const InventarioState = window.InventarioState;

/* ================================================================ */
/*  HELPERS CON ESTADO                                               */
/* ================================================================ */

function getStockProductoLocal(productoId) {
    return InventarioState.stockData.find(item => String(item.idProducto) === String(productoId)) || null;
}

/* ================================================================ */
/*  NAVEGACIÓN: TABS                                                */
/* ================================================================ */

function cambiarTab(tab) {
    InventarioState.tabActual = tab;

    const views = ['view-productos', 'view-stock', 'view-movimientos'];
    const targetId = tab === 'productos' ? 'view-productos' : tab === 'stock' ? 'view-stock' : 'view-movimientos';

    document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (!view) return;
        if (viewId === targetId) {
            view.classList.remove('hidden');
            view.style.opacity = '0';
            requestAnimationFrame(() => {
                view.style.transition = 'opacity 0.2s ease';
                view.style.opacity = '1';
            });
        } else {
            view.classList.add('hidden');
            view.style.opacity = '';
            view.style.transition = '';
        }
    });

    if (tab === 'movimientos' && InventarioState.subTabMovimientos === 'todos' && InventarioState.movimientosGlobales.length === 0) {
        cargarMovimientosGlobales();
    }
}

/* ================================================================ */
/*  NAVEGACIÓN: SUBTABS                                             */
/* ================================================================ */

function cambiarSubTab(subtab) {
    InventarioState.subTabMovimientos = subtab;
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });

    const todosView = document.getElementById('mov-view-todos');
    const productoView = document.getElementById('mov-view-producto');

    if (subtab === 'todos') {
        productoView.classList.add('hidden');
        productoView.style.opacity = '';
        productoView.style.transition = '';
        todosView.classList.remove('hidden');
        todosView.style.opacity = '0';
        requestAnimationFrame(() => {
            todosView.style.transition = 'opacity 0.2s ease';
            todosView.style.opacity = '1';
        });
        if (InventarioState.movimientosGlobales.length === 0) {
            cargarMovimientosGlobales();
        }
    } else {
        todosView.classList.add('hidden');
        todosView.style.opacity = '';
        todosView.style.transition = '';
        productoView.classList.remove('hidden');
        productoView.style.opacity = '0';
        requestAnimationFrame(() => {
            productoView.style.transition = 'opacity 0.2s ease';
            productoView.style.opacity = '1';
        });
        // Render suggestions after the view is visible, only if no product is selected
        requestAnimationFrame(() => {
            if (!InventarioState.productoHistorialSeleccionadoId) {
                renderSugerenciasProductos();
            }
        });
    }
}

/* ================================================================ */
/*  NAVEGACIÓN: CRUCE ENTRE VISTAS                                  */
/* ================================================================ */

function verMovimientosProducto(id) {
    cambiarTab('movimientos');
    cambiarSubTab('producto');
    if (id) {
        seleccionarProductoHistorial(id);
    }
}

function irADetalleEvento(id) {
    if (!id) return;
    window.location.href = '../eventos/eventos.html?eventoId=' + id;
}

/* ================================================================ */
/*  UI HELPERS                                                      */
/* ================================================================ */

function updateSearchClearBtn(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    if (input.value.trim().length > 0) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

/* ================================================================ */
/*  INIT                                                            */
/* ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Stock search with debounce + clear button toggle
    document.getElementById('search-stock').addEventListener('input', debounce(function() {
        updateSearchClearBtn('search-stock', 'search-stock-clear');
        aplicarRenderStock();
    }, 300));

    // Productos search with debounce + clear button toggle
    document.getElementById('search-productos').addEventListener('input', debounce(function() {
        updateSearchClearBtn('search-productos', 'search-productos-clear');
        aplicarRenderProductos();
    }, 300));

    // Movimientos search with debounce + clear button toggle
    document.getElementById('search-movimientos').addEventListener('input', debounce(function() {
        updateSearchClearBtn('search-movimientos', 'search-movimientos-clear');
        const q = this.value.toLowerCase();
        const filtrados = InventarioState.movimientosData.filter(d =>
            d.productoNombre.toLowerCase().includes(q) ||
            d.eventoNombre?.toLowerCase().includes(q) ||
            String(d.eventoId || '').toLowerCase().includes(q) ||
            d.motivo?.toLowerCase().includes(q) ||
            d.tipoOrigen?.toLowerCase().includes(q)
        );
        aplicarRenderMovimientos(filtrados);
    }, 300));

    // ── Per‑product autocomplete search ──────────────────────────
    const prodSearchInput = document.getElementById('product-search-input');
    if (prodSearchInput) {
        prodSearchInput.addEventListener('input', debounce(function() {
            const query = this.value.trim();
            const clearBtn = document.getElementById('product-search-clear');

            if (query.length > 0) {
                if (clearBtn) clearBtn.classList.remove('hidden');
                // Hide suggestions while searching
                var suggestionsEl = document.getElementById('product-suggestions');
                if (suggestionsEl) suggestionsEl.classList.add('hidden');
                // If a product was selected and user types something different, drop selection
                if (InventarioState.productoHistorialSeleccionadoId &&
                    query !== InventarioState.productoHistorialSeleccionadoNombre) {
                    limpiarSeleccionProductoHistorial();
                    // Restore typed value (limpiarSeleccion clears the input)
                    this.value = query;
                    if (suggestionsEl) suggestionsEl.classList.add('hidden');
                }
                const results = buscarProductosLocal(query);
                renderProductSearchResults(results);
            } else {
                if (clearBtn) clearBtn.classList.add('hidden');
                document.getElementById('product-search-results').classList.add('hidden');
                // If input is empty, restore suggestions
                if (InventarioState.productoHistorialSeleccionadoId) {
                    limpiarSeleccionProductoHistorial();
                } else {
                    // Show suggestions again when search is cleared
                    var suggestionsEmpty = document.getElementById('product-suggestions');
                    if (suggestionsEmpty) suggestionsEmpty.classList.remove('hidden');
                    if (typeof renderSugerenciasProductos === 'function') {
                        renderSugerenciasProductos();
                    }
                }
            }
        }, 200));

        // Show results on focus if there's a query
        prodSearchInput.addEventListener('focus', function() {
            if (this.value.trim()) {
                var resultsEl = document.getElementById('product-search-results');
                if (resultsEl && resultsEl.children.length > 0) {
                    resultsEl.classList.remove('hidden');
                }
            }
        });

        // Keyboard: Enter selects first result, Escape closes
        prodSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.getElementById('product-search-results').classList.add('hidden');
            }
            if (e.key === 'Enter') {
                var results = document.getElementById('product-search-results');
                var first = results ? results.querySelector('.product-search-result') : null;
                if (first) { first.click(); e.preventDefault(); }
            }
        });

        // Close dropdown on blur (delayed for click capture)
        prodSearchInput.addEventListener('blur', function() {
            setTimeout(function() {
                document.getElementById('product-search-results').classList.add('hidden');
            }, 200);
        });
    }

    // Product search clear button
    var prodClearBtn = document.getElementById('product-search-clear');
    if (prodClearBtn) {
        prodClearBtn.addEventListener('click', function() {
            limpiarSeleccionProductoHistorial();
        });
    }

    // ── Autocomplete: input filter + keyboard ──────────────────
    var autoInput = document.getElementById('producto-autocomplete-input');
    if (autoInput) {
        autoInput.addEventListener('input', debounce(function() {
            var query = this.value.trim();
            var resultsEl = document.getElementById('producto-autocomplete-results');
            var clearBtn = document.getElementById('producto-autocomplete-clear');
            var hiddenSelect = document.getElementById('select-producto');

            // If user types after a product was selected, clear the hidden selection
            if (hiddenSelect && hiddenSelect.value) {
                hiddenSelect.value = '';
                ocultarConfirmacionMovimiento();
            }

            if (query.length < 1) {
                resultsEl.classList.add('hidden');
                resultsEl.innerHTML = '';
                if (clearBtn) clearBtn.classList.add('hidden');
                this.setAttribute('aria-expanded', 'false');
                actualizarAyudaMovimiento();
                return;
            }

            // Show clear button when there's text
            if (clearBtn) clearBtn.classList.remove('hidden');

            // Filter products locally
            var q = query.toLowerCase();
            var matches = (InventarioState.productosData || [])
                .filter(function(p) { return p.nombre.toLowerCase().includes(q); })
                .slice(0, 15);

            if (matches.length === 0) {
                resultsEl.innerHTML = '<div class="autocomplete-empty">No se encontraron productos con &laquo;' + formatters.textoSeguro(query) + '&raquo;</div>';
                resultsEl.classList.remove('hidden');
                this.setAttribute('aria-expanded', 'true');
                return;
            }

            var stockData = InventarioState.stockData || [];
            var html = matches.map(function(p, idx) {
                var stockItem = stockData.find(function(s) { return String(s.idProducto) === String(p.id); });
                var stockLabel = stockItem ? 'Disp: ' + stockItem.cantidadDisponible : '';
                var riesgoBadge = '';
                if (stockItem) {
                    var rl = getRiesgoLevel(stockItem);
                    if (rl.label !== 'OK') {
                        riesgoBadge = ' <span class="' + rl.clase + '" style="font-size:0.62rem;padding:0.1rem 0.35rem">' + rl.label + '</span>';
                    }
                }
                var inactivo = p.estado === 'INACTIVO' ? ' <span class="text-muted" style="font-size:0.7rem">(inactivo)</span>' : '';
                // data-nombre must be raw (unescaped) for setting input.value on click
                var rawName = p.nombre || '';
                var safeName = formatters.textoSeguro(rawName);
                return '<button type="button" class="autocomplete-result" role="option" data-id="' + p.id + '" data-nombre="' + rawName.replace(/"/g, '&quot;') + '">' +
                    '<span class="autocomplete-result-name">' + safeName + inactivo + '</span>' +
                    '<span class="autocomplete-result-meta">' +
                        (riesgoBadge) +
                        '<span class="autocomplete-result-stock">' + stockLabel + '</span>' +
                    '</span>' +
                    '</button>';
            }).join('');

            resultsEl.innerHTML = html;
            resultsEl.classList.remove('hidden');
            this.setAttribute('aria-expanded', 'true');

            // Bind click on each result
            Array.from(resultsEl.querySelectorAll('.autocomplete-result')).forEach(function(btn) {
                btn.addEventListener('click', function() {
                    seleccionarProductoMovimiento(this.dataset.id, this.dataset.nombre);
                });
            });
        }, 200));

        // Focus: show results if there's a query
        autoInput.addEventListener('focus', function() {
            var resultsEl = document.getElementById('producto-autocomplete-results');
            if (this.value.trim() && resultsEl && resultsEl.children.length > 0) {
                resultsEl.classList.remove('hidden');
                this.setAttribute('aria-expanded', 'true');
            }
        });

        // Blur: hide results (delayed for click capture)
        autoInput.addEventListener('blur', function() {
            setTimeout(function() {
                var resultsEl = document.getElementById('producto-autocomplete-results');
                if (resultsEl) {
                    resultsEl.classList.add('hidden');
                }
                if (autoInput) autoInput.setAttribute('aria-expanded', 'false');
            }, 200);
        });

        // Keyboard navigation
        autoInput.addEventListener('keydown', function(e) {
            var resultsEl = document.getElementById('producto-autocomplete-results');
            if (!resultsEl || resultsEl.classList.contains('hidden')) {
                if (e.key === 'Enter' || e.key === 'Escape') return;
                return;
            }

            var items = Array.from(resultsEl.querySelectorAll('.autocomplete-result'));
            var activeIdx = items.findIndex(function(el) { return el.classList.contains('autocomplete-result--active'); });

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                var nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
                if (activeIdx >= 0) items[activeIdx].classList.remove('autocomplete-result--active');
                items[nextIdx].classList.add('autocomplete-result--active');
                items[nextIdx].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prevIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
                if (activeIdx >= 0) items[activeIdx].classList.remove('autocomplete-result--active');
                items[prevIdx].classList.add('autocomplete-result--active');
                items[prevIdx].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIdx >= 0 && items[activeIdx]) {
                    items[activeIdx].click();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                resultsEl.classList.add('hidden');
                autoInput.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ── Autocomplete: clear button ──────────────────────────
    var autoClearBtn = document.getElementById('producto-autocomplete-clear');
    if (autoClearBtn) {
        autoClearBtn.addEventListener('click', function() {
            limpiarAutocompleteProducto();
        });
    }

    // ── Hidden select change still triggers stock hint (for deep-link compat) ──
    document.getElementById('select-producto').addEventListener('change', function() {
        actualizarAyudaMovimiento();
        if (this.value) actualizarStepIndicator('data');
        else actualizarStepIndicator('select');
    });

    // ── Cantidad input triggers step tracking + confirmation ──
    const inputCantidad = document.getElementById('input-cantidad');
    if (inputCantidad) {
        inputCantidad.addEventListener('input', function() {
            if (this.value && document.getElementById('select-producto')?.value) {
                actualizarStepIndicator('confirm');
                renderConfirmacionMovimiento();
            } else {
                ocultarConfirmacionMovimiento();
                if (document.getElementById('select-producto')?.value) actualizarStepIndicator('data');
                else actualizarStepIndicator('select');
            }
        });
    }

    // ── Tipo origen change triggers confirmation update ──
    const inputTipoOrigen = document.getElementById('select-tipo-origen');
    if (inputTipoOrigen) {
        inputTipoOrigen.addEventListener('change', function() {
            renderConfirmacionMovimiento();
        });
    }

    // ── Motivo change (just hides/displays confirmation) ──
    const inputMotivo = document.getElementById('input-motivo');
    if (inputMotivo) {
        inputMotivo.addEventListener('input', function() {
            // Re-render summary if visible (non-destructive)
            if (!document.getElementById('movimiento-confirmacion')?.classList.contains('hidden')) {
                renderConfirmacionMovimiento();
            }
        });
    }

    // Initial state for clear buttons
    updateSearchClearBtn('search-stock', 'search-stock-clear');
    updateSearchClearBtn('search-productos', 'search-productos-clear');
    updateSearchClearBtn('search-movimientos', 'search-movimientos-clear');

    // Show filter toggle on mobile
    if (window.innerWidth <= 640) {
        var toggleBtns = document.querySelectorAll('.filter-bar-toggle');
        toggleBtns.forEach(function(btn) { btn.classList.remove('hidden'); });
    }

    cargarStock();
});
