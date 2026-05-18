/**
 * modules/configuracion/js/configuracion.validators.js
 * Validación de valores de configuración según tipo y reglas CONFIG_UI.
 */
(function () {
    'use strict';

    /**
     * Normaliza un valor: elimina espacios, convierte a string.
     * @param {*} valor
     * @returns {string}
     */
    function normalizarValor(valor) {
        return String(valor ?? '').trim();
    }

    /**
     * Valida un valor contra el tipo y reglas de una configuración.
     * @param {Object} config - { configClave, configTipo, ... }
     * @param {*} valorCrudo - el valor ingresado por el usuario
     * @returns {{ ok: boolean, valor?: string, mensaje?: string }}
     */
    function validarValorConfiguracion(config, valorCrudo) {
        const valor = normalizarValor(valorCrudo);
        const tipo = (config?.configTipo || '').toUpperCase();

        if (!tipo) {
            return { ok: true, valor };
        }

        if (tipo === 'INT') {
            if (!/^-?\d+$/.test(valor)) {
                return { ok: false, mensaje: `La configuración ${config.configClave} debe ser un número entero.` };
            }
            return { ok: true, valor };
        }

        if (tipo === 'DECIMAL') {
            const num = Number(valor);
            if (!Number.isFinite(num) || valor === '') {
                return { ok: false, mensaje: `La configuración ${config.configClave} debe ser un número decimal válido.` };
            }
            return { ok: true, valor };
        }

        if (tipo === 'BOOLEAN') {
            const normalizado = valor.toLowerCase();
            if (normalizado !== 'true' && normalizado !== 'false') {
                return { ok: false, mensaje: `La configuración ${config.configClave} debe ser true o false.` };
            }
            return { ok: true, valor: normalizado };
        }

        return { ok: true, valor };
    }

    window.ConfiguracionValidators = {
        normalizarValor,
        validarValorConfiguracion
    };
})();
