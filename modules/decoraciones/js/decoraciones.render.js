/**
 * modules/decoraciones/js/decoraciones.render.js
 * Capa de render visual del modulo Decoraciones.
 * Genera HTML para listado (grid/table), KPIs y detalle.
 * No incluye composicion de productos ni acciones.
 */
window.DecoracionesRender = (() => {

    function actualizarEstadoSincronizacion() {
        const badge = document.getElementById('decor-stock-sync-status');
        if (!badge) return;

        if (DecoracionesState.stockErroresIds.length) {
            badge.textContent = `Stock con validaciones pendientes · ${DecoracionesState.stockErroresIds.length} producto(s)`;
            badge.className = 'decor-hero-status is-warning';
            return;
        }

        badge.textContent = `Stock verificado · ${DecoracionesHelpers.formatearMomentoCarga(DecoracionesState.ultimaCargaStock)}`;
        badge.className = 'decor-hero-status is-success';
    }

    function getDecoracionMetricas(decoracion) {
        const productos = decoracion.productos || [];
        const unidades = productos.reduce((acc, item) => acc + Number(item.cantidadRequerida || 0), 0);
        const riesgos = productos.filter(item => {
            if (DecoracionesHelpers.hayErrorCargaStock(item.productoId)) return true;
            const stock = DecoracionesHelpers.getStockProducto(item.productoId);
            return !stock || stock.stockBajoAlerta || Number(stock.cantidadDisponible || 0) < Number(item.cantidadRequerida || 0);
        }).length;

        return { productos, unidades, riesgos };
    }

    function renderStockSignal(decoracion) {
        const { productos, unidades, riesgos } = getDecoracionMetricas(decoracion);
        const validacionPendiente = (decoracion.productos || []).some(item => DecoracionesHelpers.hayErrorCargaStock(item.productoId));
        const clase = validacionPendiente ? 'is-warning' : riesgos > 0 ? 'is-danger' : productos.length ? 'is-success' : 'is-neutral';
        const texto = validacionPendiente
            ? 'Validación pendiente'
            : riesgos > 0 ? `${riesgos} alerta${riesgos === 1 ? '' : 's'}` : productos.length ? 'Stock viable' : 'Sin productos';

        return `
            <div class="decor-stock-signal ${clase}">
                <span>${texto}</span>
                <small>${productos.length} tipo${productos.length === 1 ? '' : 's'} · ${unidades} unidad${unidades === 1 ? '' : 'es'}</small>
            </div>`;
    }

    function renderProductosPreview(productos = []) {
        if (!productos.length) return '<span class="decor-product-chip is-empty">Sin composición</span>';

        const visibles = productos.slice(0, 3).map(item => `
            <span class="decor-product-chip">
                ${formatters.textoSeguro(item.productoNombre || `Producto #${item.productoId}`)}
                <strong>x${item.cantidadRequerida}</strong>
            </span>`).join('');

        const restantes = productos.length > 3 ? `<span class="decor-product-chip is-more">+${productos.length - 3}</span>` : '';
        return visibles + restantes;
    }

    function renderReferenciaMiniatura(decoracion) {
        return decoracion.imagenUrl
            ? `<span class="decor-mini-ref"><img src="${formatters.textoSeguro(decoracion.imagenUrl)}" alt="${formatters.textoSeguro(decoracion.nombre)}" class="decor-mini-ref-image"></span>`
            : '<span class="decor-mini-ref is-empty"><i data-lucide="image"></i></span>';
    }

    function renderNombreResumen(row) {
        return `
            <div class="decor-name-stack">
                <div class="decor-name-main">
                    ${renderReferenciaMiniatura(row)}
                    <div>
                        <strong>${formatters.textoSeguro(row.nombre)}</strong>
                        <small>#${row.id} · ${row.estado === 'ACTIVO' ? 'Disponible para eventos' : 'Fuera de operación nueva'}</small>
                    </div>
                </div>
                <span class="decor-description-inline">${formatters.textoSeguro(row.descripcion || 'Sin descripción operativa')}</span>
            </div>`;
    }

    function renderComposicionResumen(row) {
        const productos = row.productos || [];
        const unidades = productos.reduce((acc, item) => acc + Number(item.cantidadRequerida || 0), 0);

        return `
            <div class="decor-table-composition">
                <div class="decor-table-composition-meta">
                    <strong>${productos.length} tipo${productos.length === 1 ? '' : 's'}</strong>
                    <small>${unidades} unidad${unidades === 1 ? '' : 'es'} requeridas</small>
                </div>
                <div class="decor-table-composition-chips">${renderProductosPreview(productos)}</div>
            </div>`;
    }

    function renderAcciones(row) {
        const inactiva = row.estado !== 'ACTIVO';
        const accionEstado = inactiva
            ? `<button class="btn btn-outline btn-sm btn-success-hover" onclick="abrirModalEliminar(${row.id}, 'reactivar')">Reactivar</button>`
            : `<button class="btn btn-outline btn-sm btn-danger-hover" onclick="abrirModalEliminar(${row.id}, 'desactivar')">Desactivar</button>`;

        return `
            <div class="acciones-wrapper acciones-wrapper--decoraciones">
                <button class="btn btn-outline btn-sm" onclick="abrirModalDetalle(${row.id})">Detalle</button>
                <button class="btn btn-outline btn-sm" onclick="abrirDrawerEditar(${row.id})">Editar</button>
                ${accionEstado}
            </div>`;
    }

    function renderTiposCompatibles(row) {
        var tipos = row.tiposCompatibles || [];
        if (!tipos.length) return '<span class="text-light" style="font-size:0.72rem;">Sin restriccion</span>';
        return tipos.map(function (t) {
            return '<span class="decor-tipo-chip">' + formatters.textoSeguro(t.nombre || 'Tipo #' + t.id) + '</span>';
        }).join(' ');
    }

    const COLUMNAS_TABLE = [
        { label: 'ID', render: row => `<td><span class="text-muted">#${row.id}</span></td>` },
        { label: 'Nombre', render: row => `<td>${renderNombreResumen(row)}</td>` },
        { label: 'Precio', render: row => `<td><span class="text-primary font-bold">$${formatters.precio(row.precio)}</span></td>` },
        { label: 'Estado', render: row => `<td>${modulos.badgeEstado(row.estado || 'ACTIVO')}</td>` },
        { label: 'Tipos', render: row => `<td>${renderTiposCompatibles(row)}</td>` },
        { label: 'Stock', render: row => `<td>${renderStockSignal(row)}</td>` },
        { label: 'Productos', render: row => `<td>${renderComposicionResumen(row)}</td>` },
        {
            label: 'Acciones',
            render: row => `
                <td class="acciones-cell">
                    ${renderAcciones(row)}
                </td>`
        }
    ];

    function actualizarResumenDecoraciones() {
        const total = DecoracionesState.decoraciones.length;
        const activas = DecoracionesState.decoraciones.filter(item => item.estado === 'ACTIVO').length;
        const inactivas = DecoracionesState.decoraciones.filter(item => item.estado === 'INACTIVO').length;
        const conAlertas = DecoracionesState.decoraciones.filter(item => {
            return (item.productos || []).some(producto => {
                if (DecoracionesHelpers.hayErrorCargaStock(producto.productoId)) return true;
                const stock = DecoracionesHelpers.getStockProducto(producto.productoId);
                return !stock || stock.stockBajoAlerta || Number(stock.cantidadDisponible || 0) < Number(producto.cantidadRequerida || 0);
            });
        }).length;

        document.getElementById('kpi-total-decoraciones').textContent = total;
        document.getElementById('kpi-activas-decoraciones').textContent = activas;
        document.getElementById('kpi-inactivas-decoraciones').textContent = inactivas;
        const heroTotal = document.getElementById('hero-total-decoraciones');
        const heroActivas = document.getElementById('hero-activas-decoraciones');
        const heroRiesgo = document.getElementById('hero-riesgo-decoraciones');
        if (heroTotal) heroTotal.textContent = total;
        if (heroActivas) heroActivas.textContent = activas;
        if (heroRiesgo) heroRiesgo.textContent = conAlertas;
        const count = document.getElementById('decoraciones-result-count');
        if (count) count.textContent = `${total} ${total === 1 ? 'plantilla visible' : 'plantillas visibles'}`;
        const summary = document.getElementById('decoraciones-view-summary');
        if (summary) {
            summary.textContent = DecoracionesState.vistaActual === 'grid'
                ? 'Compará composición, estado y referencia visual en una sola pasada.'
                : 'Lista compacta para revisar varias decoraciones sin perder detalle operativo.';
        }
    }

    function aplicarRender(datos) {
        if (datos === undefined) datos = DecoracionesState.decoraciones;
        const grid = document.getElementById('grid-decoraciones');
        const tableWrapper = document.getElementById('table-decoraciones-wrapper');

        if (DecoracionesState.vistaActual === 'grid') {
            grid.classList.remove('hidden');
            tableWrapper.classList.add('hidden');
            renderGrid(datos);
        } else {
            grid.classList.add('hidden');
            tableWrapper.classList.remove('hidden');
            modulos.renderTabla(datos, 'tabla-decoraciones', COLUMNAS_TABLE);
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderGrid(datos) {
        if (datos === undefined) datos = DecoracionesState.decoraciones;
        const grid = document.getElementById('grid-decoraciones');

        if (datos.length === 0) {
            grid.innerHTML = `
                <div class="decor-empty-state">
                    <div class="decor-empty-icon"><i data-lucide="palette"></i></div>
                    <h3>No hay modelos para mostrar</h3>
                    <p>Probá ajustar la búsqueda o creá una decoración con productos activos para usarla en eventos.</p>
                    <button class="btn btn-primary" onclick="abrirDrawerCrear()">Crear decoración</button>
                </div>`;
            return;
        }

        grid.innerHTML = datos.map(dec => `
            <article class="decor-card ${dec.estado !== 'ACTIVO' ? 'is-inactive' : ''}">
                <div class="decor-img">
                    ${dec.imagenUrl
                        ? `<img src="${formatters.textoSeguro(dec.imagenUrl)}" alt="${formatters.textoSeguro(dec.nombre)}" class="decor-image">`
                        : '<span class="placeholder"><i data-lucide="palette"></i></span>'}
                    <div class="decor-badge-price">$${formatters.precio(dec.precio)}</div>
                </div>
                <div class="decor-info">
                    <div class="decor-card-topline">
                        <span class="decor-card-id">#${dec.id}</span>
                        <span class="decor-card-availability ${dec.estado === 'ACTIVO' ? 'is-success' : 'is-muted'}">${dec.estado === 'ACTIVO' ? 'Disponible para eventos' : 'Fuera de operación nueva'}</span>
                    </div>
                    <div class="decor-card-heading">
                        <h3>${formatters.textoSeguro(dec.nombre)}</h3>
                        ${modulos.badgeEstado(dec.estado || 'ACTIVO')}
                    </div>
                    <div class="decor-meta-row">
                        ${renderStockSignal(dec)}
                    </div>
                    <p>${formatters.textoSeguro(dec.descripcion || 'Sin descripcion disponible.')}</p>
                    <div class="decor-products-preview">
                        ${renderProductosPreview(dec.productos)}
                    </div>
                    <div class="decor-card-footnote">
                        <span>${(dec.productos || []).length} tipo${(dec.productos || []).length === 1 ? '' : 's'} en composición</span>
                        <span>Referencia visual ${dec.imagenUrl ? 'cargada' : 'pendiente'}</span>
                    </div>
                </div>
                <div class="decor-actions">
                    ${renderAcciones(dec)}
                </div>
            </article>
        `).join('');
    }

    function renderDetalleCuerpo(decoracion) {
        const productos = decoracion.productos || [];
        const totalTipos = productos.length;
        const totalUnidades = productos.reduce((acc, item) => acc + Number(item.cantidadRequerida || 0), 0);
        const costoEstimado = DecoracionesHelpers.calcularCostoEstimado(productos);
        const precio = Number(decoracion.precio || 0);
        const margen = precio - costoEstimado;

        const hayErrorStock = (pid) => DecoracionesHelpers.hayErrorCargaStock(pid);
        const getStock = (pid) => DecoracionesHelpers.getStockProducto(pid);

        const pendientes = productos.filter(item => hayErrorStock(item.productoId)).length;
        const riesgos = productos.filter(item => {
            if (hayErrorStock(item.productoId)) return false;
            const stock = getStock(item.productoId);
            return !stock || stock.stockBajoAlerta || Number(stock.cantidadDisponible || 0) < Number(item.cantidadRequerida || 0);
        }).length;
        const tieneRiesgo = riesgos > 0;

        // Salud
        let saludClase, saludTexto;
        if (!totalTipos) { saludClase = 'is-neutral'; saludTexto = 'Sin composición'; }
        else if (pendientes > 0) { saludClase = 'is-warning'; saludTexto = `${pendientes} pendiente(s)`; }
        else if (tieneRiesgo) { saludClase = 'is-danger'; saludTexto = `${riesgos} alerta(s)`; }
        else { saludClase = 'is-success'; saludTexto = 'Estable'; }

        // Margen state
        let margenClase;
        if (!totalTipos) margenClase = 'is-neutral';
        else if (margen < 0) margenClase = 'is-danger';
        else if (margen === 0) margenClase = 'is-warning';
        else margenClase = 'is-success';

        // Tipos compatibles
        const tipos = decoracion.tiposCompatibles || [];
        const tiposHtml = tipos.length
            ? tipos.map(t => `<span class="decor-detail-tipo-chip">${formatters.textoSeguro(t.nombre || t.tipoNombre || `Tipo #${t.id}`)}</span>`).join('')
            : '<span class="decor-detail-tipos-empty">Sin restricción — disponible para todos los tipos de evento</span>';

        // Product list
        const productListHtml = totalTipos
            ? productos.map(item => {
                const stock = getStock(item.productoId);
                const pendiente = hayErrorStock(item.productoId);
                const disponible = Number(stock?.cantidadDisponible || 0);
                const requerido = Number(item.cantidadRequerida || 0);
                const critico = !!stock?.stockBajoAlerta;
                const insuficiente = !pendiente && disponible < requerido;

                let itemClase = '';
                if (pendiente) itemClase = 'is-warning';
                else if (insuficiente) itemClase = 'is-danger';
                else if (critico) itemClase = 'is-warning';
                else itemClase = 'is-success';

                return `
                    <article class="decor-detail-item ${itemClase}">
                        <div>
                            <strong>${formatters.textoSeguro(item.productoNombre || `Producto #${item.productoId}`)}</strong>
                            <span>${requerido} unidad(es) requerida(s)</span>
                        </div>
                        <div class="decor-detail-stock">
                            <span>Disponible: ${pendiente ? '—' : stock ? disponible : 'N/D'}</span>
                            <span>${pendiente ? 'Validación pendiente' : insuficiente ? 'Stock insuficiente' : critico ? 'Stock crítico' : 'Stock suficiente'}</span>
                        </div>
                    </article>`;
            }).join('')
            : '<div class="decor-detail-empty-composition">Esta decoración no tiene productos en su composición.</div>';

        return `
            <!-- Metadata strip -->
            <div class="decor-detail-strip">
                <span class="decor-detail-strip-item"><strong>ID</strong> #${decoracion.id}</span>
                <span class="decor-detail-strip-item"><strong>Estado</strong> ${modulos.badgeEstado(decoracion.estado || 'ACTIVO')}</span>
                ${decoracion.fechaCreacion ? `<span class="decor-detail-strip-item"><strong>Creado</strong> ${formatFechaHora(decoracion.fechaCreacion)}</span>` : ''}
            </div>

            ${decoracion.imagenUrl ? `
            <div class="decor-detail-image-wrap">
                <img src="${formatters.textoSeguro(decoracion.imagenUrl)}" alt="${formatters.textoSeguro(decoracion.nombre)}" class="decor-detail-image" loading="lazy">
            </div>` : ''}

            <section class="decor-detail-section">
                <h3>Resumen económico</h3>
                <div class="decor-detail-price-row">
                    <div class="decor-detail-price-main">
                        <span class="decor-detail-price-label">Precio de venta</span>
                        <strong class="decor-detail-price-value">$${formatters.precio(precio)}</strong>
                    </div>
                    <div class="decor-detail-price-sub">
                        <div class="decor-detail-stat ${margenClase}">
                            <span>Costo estimado</span>
                            <strong>$${formatters.precio(costoEstimado)}</strong>
                        </div>
                        <div class="decor-detail-stat ${margenClase}">
                            <span>Margen estimado</span>
                            <strong>$${formatters.precio(margen)}</strong>
                        </div>
                    </div>
                </div>
                <div class="decor-detail-kpis">
                    <div class="decor-detail-kpi"><span>Tipos</span><strong>${totalTipos}</strong></div>
                    <div class="decor-detail-kpi"><span>Unidades</span><strong>${totalUnidades}</strong></div>
                    <div class="decor-detail-kpi ${saludClase}"><span>Salud</span><strong>${saludTexto}</strong></div>
                </div>
            </section>

            <section class="decor-detail-section">
                <h3>Tipos de evento compatibles</h3>
                <div class="decor-detail-tipos">${tiposHtml}</div>
            </section>

            ${decoracion.descripcion ? `
            <section class="decor-detail-section">
                <h3>Descripción</h3>
                <p class="decor-detail-desc">${formatters.textoSeguro(decoracion.descripcion)}</p>
            </section>` : ''}

            <section class="decor-detail-section">
                <h3>Composición <span class="decor-detail-section-count">${totalTipos} producto${totalTipos === 1 ? '' : 's'} · ${totalUnidades} unidad${totalUnidades === 1 ? '' : 'es'}</span></h3>
                <div class="decor-detail-list">${productListHtml}</div>
            </section>`;
    }

    return {
        actualizarEstadoSincronizacion,
        actualizarResumenDecoraciones,
        aplicarRender,
        renderGrid,
        renderDetalleCuerpo
    };
})();
