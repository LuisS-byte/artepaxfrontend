/**
 * modules/configuracion/js/configuracion.actions.js
 * Acciones del módulo Configuración — carga, persistencia, detección de cambios.
 */
(function () {
    'use strict';

    // -- Consultas ------------------------------------------------------------

    function obtenerConfigPorClave(clave) {
        return ConfiguracionState.configuraciones.find(config => config.configClave === clave) || null;
    }

    function getModificados() {
        return ConfiguracionState.configuraciones.filter(config => {
            const input = document.getElementById(`config-${config.configClave}`);
            return input && input.value.trim() !== ConfiguracionState.valoresOriginales[config.configClave];
        });
    }

    // -- Persistencia local ---------------------------------------------------

    function actualizarConfigLocal(configActualizada) {
        if (!configActualizada?.configClave) return;

        const indice = ConfiguracionState.configuraciones.findIndex(
            config => config.configClave === configActualizada.configClave
        );
        if (indice >= 0) {
            ConfiguracionState.configuraciones[indice] = {
                ...ConfiguracionState.configuraciones[indice],
                ...configActualizada
            };
        }

        ConfiguracionState.valoresOriginales[configActualizada.configClave] = String(configActualizada.configValor ?? '').trim();

        const input = document.getElementById(`config-${configActualizada.configClave}`);
        if (input) {
            input.value = ConfiguracionState.valoresOriginales[configActualizada.configClave];
        }

        const setting = document.getElementById(`setting-${configActualizada.configClave}`);
        if (setting) {
            setting.classList.remove('setting-item--modified');
        }
    }

    async function persistirConfiguracion(clave, valorCrudo) {
        const config = obtenerConfigPorClave(clave);
        const validacion = ConfiguracionValidators.validarValorConfiguracion(config, valorCrudo);

        if (!validacion.ok) {
            throw new Error(validacion.mensaje);
        }

        const respuesta = await API.configuracion.actualizar(clave, validacion.valor);
        actualizarConfigLocal(respuesta || { configClave: clave, configValor: validacion.valor });

        return respuesta;
    }

    // -- Carga inicial --------------------------------------------------------

    async function cargarConfiguracionGlobal() {
        const container = document.getElementById('config-global-list');
        container.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando configuración...</div>';

        try {
            const configuraciones = await API.configuracion.list();
            const porClave = new Map(configuraciones.map(config => [config.configClave, config]));

            ConfiguracionState.configuraciones = ConfiguracionMeta.CLAVES_CONFIGURACION
                .map(clave => porClave.get(clave))
                .filter(Boolean);

            ConfiguracionState.valoresOriginales = {};
            ConfiguracionState.configuraciones.forEach(config => {
                ConfiguracionState.valoresOriginales[config.configClave] = config.configValor;
            });

            ConfiguracionRender.renderizarConfiguracionGlobal();
        } catch (err) {
            container.innerHTML = `<div class="error-state">Error al cargar configuración: ${formatters.textoSeguro(err.message)}</div>`;
        }
    }

    // -- Detección de cambios -------------------------------------------------

    function marcarCambio(clave) {
        const input = document.getElementById(`config-${clave}`);
        if (!input) return;

        const valorActual = input.value.trim();
        const valorOriginal = ConfiguracionState.valoresOriginales[clave];
        const setting = document.getElementById(`setting-${clave}`);
        if (!setting) return;

        if (valorActual !== valorOriginal) {
            setting.classList.add('setting-item--modified');
        } else {
            setting.classList.remove('setting-item--modified');
        }

        ConfiguracionRender.actualizarToolbar();
    }

    // -- Guardado individual --------------------------------------------------

    async function guardarConfiguracion(clave) {
        const input = document.getElementById(`config-${clave}`);
        if (!input) return;

        const btn = document.querySelector(`#setting-${clave} .btn-save-single`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner spinner-sm"></span>';
        }

        try {
            await persistirConfiguracion(clave, input.value);

            // Feedback visual: pulso verde en el botón antes de volver al icono
            if (btn) {
                btn.classList.add('btn-save-single--success');
                btn.innerHTML = '✓';
            }

            ConfiguracionRender.actualizarToolbar();
        } catch (err) {
            mostrarAlerta('error', `No se pudo actualizar: ${err.message}`);
            if (btn) {
                btn.classList.add('btn-save-single--error');
                btn.innerHTML = '✕';
                setTimeout(() => btn.classList.remove('btn-save-single--error'), 1200);
            }
        } finally {
            if (btn) {
                setTimeout(() => {
                    btn.disabled = false;
                    btn.classList.remove('btn-save-single--success');
                    btn.innerHTML = '<i data-lucide="check"></i>';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 800);
            }
        }
    }

    // -- Guardado masivo ------------------------------------------------------

    async function guardarTodo() {
        const modificados = getModificados();
        if (modificados.length === 0) return;

        const btn = document.querySelector('.save-all-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner spinner-sm"></span> Guardando...';
        }

        let exitos = 0;
        let errores = 0;
        const clavesConError = [];

        for (const config of modificados) {
            const input = document.getElementById(`config-${config.configClave}`);
            if (!input) continue;

            try {
                await persistirConfiguracion(config.configClave, input.value);
                exitos++;
            } catch (err) {
                errores++;
                clavesConError.push(config.configClave);
            }
        }

        if (errores === 0) {
            mostrarAlerta('success', `${exitos} configuración${exitos > 1 ? 'es' : ''} actualizada${exitos > 1 ? 's' : ''} correctamente.`);
        } else {
            mostrarAlerta('warning', `${exitos} actualizada${exitos > 1 ? 's' : ''}, ${errores} con error${errores > 1 ? 'es' : ''}: ${clavesConError.join(', ')}.`);
        }

        ConfiguracionRender.actualizarToolbar();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save"></i> Guardar todo';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    // -- Búsqueda de settings --------------------------------------------------

    function buscarConfiguracion(query) {
        ConfiguracionState.busqueda = query;
        ConfiguracionRender.renderizarConfiguracionGlobal();
    }

    // -- Auto-init: bindear buscador -------------------------------------------

    function initSearchEvents() {
        const searchInput = document.getElementById('config-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function () {
                buscarConfiguracion(this.value);
            }, 200));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchEvents);
    } else {
        initSearchEvents();
    }

    // -- Namespace + window.* exports -----------------------------------------

    window.ConfiguracionActions = {
        cargarConfiguracionGlobal,
        obtenerConfigPorClave,
        actualizarConfigLocal,
        persistirConfiguracion,
        marcarCambio,
        getModificados,
        guardarConfiguracion,
        guardarTodo,
        buscarConfiguracion
    };

    window.guardarTodo = guardarTodo;
    window.guardarConfiguracion = guardarConfiguracion;
    window.marcarCambio = marcarCambio;
})();
