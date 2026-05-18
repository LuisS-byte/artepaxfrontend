/**
 * modules/configuracion/js/configuracion.render.js
 * Render del módulo Configuración — listado, settings, toolbar.
 */
(function () {
    'use strict';

    // -- Helpers internos -----------------------------------------------------

    function generarInput(config, ui) {
        const id = `config-${config.configClave}`;
        const valor = config.configValor;

        if (ui.inputType === 'select' && ui.opciones) {
            const opcionesHtml = ui.opciones.map(op =>
                `<option value="${op.value}" ${op.value === valor ? 'selected' : ''}>${op.label}</option>`
            ).join('');
            return `<select id="${id}" class="config-value-input" onchange="ConfiguracionActions.marcarCambio('${config.configClave}')">${opcionesHtml}</select>`;
        }

        if (ui.inputType === 'textarea') {
            return `<textarea id="${id}" class="config-value-input config-value-textarea" rows="3" onchange="ConfiguracionActions.marcarCambio('${config.configClave}')" oninput="ConfiguracionActions.marcarCambio('${config.configClave}')">${formatters.textoSeguro(valor ?? '')}</textarea>`;
        }

        const attrs = [
            `type="${ui.inputType}"`,
            `id="${id}"`,
            `value="${formatters.textoSeguro(valor ?? '')}"`,
            `class="config-value-input"`,
            `onchange="ConfiguracionActions.marcarCambio('${config.configClave}')"`,
            `oninput="ConfiguracionActions.marcarCambio('${config.configClave}')"`
        ];

        if (ui.inputType === 'number') {
            if (ui.min !== undefined) attrs.push(`min="${ui.min}"`);
            if (ui.max !== undefined) attrs.push(`max="${ui.max}"`);
        }

        const input = `<input ${attrs.join(' ')}>`;

        return ui.unidad
            ? `<div class="input-with-unit">${input}<span class="input-unit">${ui.unidad}</span></div>`
            : input;
    }

    function renderizarSetting(config) {
        const ui = ConfiguracionMeta.CONFIG_UI[config.configClave];
        if (!ui) return '';

        const inputHtml = generarInput(config, ui);

        return `
            <div class="setting-item" id="setting-${config.configClave}">
                <div class="setting-left" onclick="document.getElementById('config-${config.configClave}').focus()">
                    <div class="setting-label-row">
                        <i data-lucide="${ui.icon}" class="setting-icon"></i>
                        <h3>${ui.label}</h3>
                    </div>
                    <p>${ui.hint}</p>
                </div>
                <div class="setting-right">
                    ${inputHtml}
                    <button class="btn-save-single" id="btn-save-${config.configClave}" onclick="ConfiguracionActions.guardarConfiguracion('${config.configClave}')" title="Guardar">
                        <i data-lucide="check"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // -- Búsqueda -------------------------------------------------------------

    function configCoincideConBusqueda(config, query) {
        if (!query) return true;
        const q = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const ui = ConfiguracionMeta.CONFIG_UI[config.configClave];
        const bag = [
            config.configClave,
            ui?.label || '',
            ui?.hint || '',
            ui?.categoria || ''
        ].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return bag.includes(q);
    }

    // -- Render principal -----------------------------------------------------

    function renderizarConfiguracionGlobal() {
        const container = document.getElementById('config-global-list');
        const query = ConfiguracionState.busqueda;

        if (ConfiguracionState.configuraciones.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay claves de configuración disponibles.</div>';
            return;
        }

        // Filtrar por búsqueda
        const filtrados = query
            ? ConfiguracionState.configuraciones.filter(c => configCoincideConBusqueda(c, query))
            : ConfiguracionState.configuraciones;

        if (filtrados.length === 0) {
            container.innerHTML = `<div class="empty-state"><i data-lucide="search-x"></i><p>No hay configuraciones que coincidan con "<strong>${formatters.textoSeguro(query)}</strong>".</p></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            actualizarSearchCount(0, ConfiguracionState.configuraciones.length);
            return;
        }

        const porCategoria = {};
        filtrados.forEach(config => {
            const ui = ConfiguracionMeta.CONFIG_UI[config.configClave];
            const cat = ui?.categoria || 'otros';
            if (!porCategoria[cat]) porCategoria[cat] = [];
            porCategoria[cat].push(config);
        });

        let html = '';

        Object.keys(ConfiguracionMeta.CATEGORIAS).forEach(catKey => {
            const configs = porCategoria[catKey];
            if (!configs || configs.length === 0) return;

            const cat = ConfiguracionMeta.CATEGORIAS[catKey];
            html += `
                <div class="config-category">
                    <header class="config-category-header">
                        <i data-lucide="${cat.icon}"></i>
                        <h3>${cat.label}</h3>
                        <span class="config-category-count">${configs.length}</span>
                    </header>
                    <div class="config-category-body">
            `;

            configs.forEach(config => {
                html += renderizarSetting(config);
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        actualizarSearchCount(filtrados.length, ConfiguracionState.configuraciones.length);
    }

    // -- Toolbar --------------------------------------------------------------

    function actualizarToolbar() {
        const toolbar = document.getElementById('config-toolbar');
        if (!toolbar) return;

        const modificados = ConfiguracionActions.getModificados();
        const badge = toolbar.querySelector('.save-all-count');
        const btn = toolbar.querySelector('.save-all-btn');

        if (modificados.length > 0) {
            toolbar.classList.add('config-toolbar--visible');
            if (badge) badge.textContent = modificados.length;
            if (btn) btn.disabled = false;
        } else {
            toolbar.classList.remove('config-toolbar--visible');
            if (btn) btn.disabled = true;
        }
    }

    // -- Search count ---------------------------------------------------------

    function actualizarSearchCount(visibles, total) {
        const el = document.getElementById('config-search-count');
        if (!el) return;
        if (visibles < total) {
            el.textContent = `${visibles} de ${total}`;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    // -- Exports --------------------------------------------------------------

    window.ConfiguracionRender = {
        renderizarConfiguracionGlobal,
        renderizarSetting,
        generarInput,
        actualizarToolbar,
        actualizarSearchCount
    };
})();
