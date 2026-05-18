/**
 * modules/gastos/js/gastos.helpers.js
 * Helpers puros y constantes para el módulo Gastos.
 * Fase 1 — Extracción desde gastos.js monolítico.
 */
(function () {
    'use strict';

    // -- Constantes -----------------------------------------------------------

    const ESTADOS_EVENTO_PERMITEN_GASTO = ['PROGRAMADO', 'CONFIRMADO', 'EN_MONTAJE'];

    const ESTADOS_GASTO = {
        PROYECTADO: { clase: 'badge-proyectado', label: 'Proyectado' },
        DESEMBOLSADO: { clase: 'badge-desembolsado', label: 'Desembolsado' }
    };

    /**
     * Aplica filtros combinados (búsqueda + KPI) sobre un array de gastos.
     * @param {Array} gastos
     * @param {{ busqueda?: string, kpiActivo?: string|null }} filtros
     * @returns {Array}
     */
    function aplicarFiltrosCombinados(gastos, filtros) {
        if (!Array.isArray(gastos)) return [];

        let resultado = gastos;

        // Filtro por búsqueda textual (concepto / nota)
        const busqueda = (filtros.busqueda || '').trim().toLowerCase();
        if (busqueda) {
            resultado = resultado.filter(g => {
                const concepto = (g.gastoConcepto || '').toLowerCase();
                const nota = (g.gastoNota || '').toLowerCase();
                return concepto.includes(busqueda) || nota.includes(busqueda);
            });
        }

        // Filtro por estado KPI
        if (filtros.kpiActivo) {
            resultado = resultado.filter(g => g.gastoEstado === filtros.kpiActivo);
        }

        return resultado;
    }

    // -- Helpers --------------------------------------------------------------

    /**
     * Normaliza un registro de la API de eventos-control para la cola de egresos.
     * @param {Object} row - DTO desde GET /api/gastos/eventos-control
     * @returns {Object}
     */
    function normalizarEventoControl(row) {
        return {
            id: row.eventoId,
            clienteNombre: row.clienteNombre,
            estadoEventoNombre: row.estadoEventoNombre,
            fecha: row.fecha,
            ubicacion: row.ubicacion,
            totalProyectado: Number(row.totalProyectado || 0),
            totalDesembolsado: Number(row.totalDesembolsado || 0),
            totalPendiente: Number(row.totalPendiente || 0),
            cantidadGastos: Number(row.cantidadGastos || 0),
            cantidadProyectados: Number(row.cantidadProyectados || 0),
            cantidadDesembolsados: Number(row.cantidadDesembolsados || 0),
            permiteRegistrarGasto: !!row.permiteRegistrarGasto
        };
    }

    /**
     * Calcula el progreso de desembolso vs proyectado.
     * @param {number} proyectado
     * @param {number} desembolsado
     * @returns {{ percent: number, class: string }}
     */
    function calcularProgreso(proyectado, desembolsado) {
        if (!proyectado || Number(proyectado) <= 0) {
            return { percent: 0, class: 'is-empty' };
        }
        var percent = Math.round((Number(desembolsado || 0) / Number(proyectado)) * 100);
        var cls = percent >= 80 ? 'is-ok' : 'is-warning';
        return { percent: Math.min(percent, 100), class: cls };
    }

    /**
     * Convierte un valor de fecha (string ISO, datetime, etc.) a objeto Date.
     * @param {string|null} value
     * @param {boolean} endOfDay — si true, setea la hora a 23:59:59
     * @returns {Date|null}
     */
    function toComparableDate(value, endOfDay = false) {
        if (!value) return null;
        const raw = String(value).trim();
        if (!raw) return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            return new Date(`${raw}T${endOfDay ? '23:59:59' : '00:00:00'}`);
        }

        const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const parsed = new Date(normalized);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    /**
     * Devuelve la clase CSS del badge según el estado del evento.
     * @param {string} estado
     * @returns {string}
     */
    function getBadgeEstadoEvento(estado) {
        const map = {
            COTIZACION: 'badge-cotizacion',
            PROGRAMADO: 'badge-programado',
            CONFIRMADO: 'badge-confirmado',
            EN_MONTAJE: 'badge-en-montaje',
            FINALIZADO: 'badge-finalizado',
            CANCELACION_PENDIENTE: 'badge-cancelacion-pendiente',
            CANCELADO: 'badge-cancelado'
        };
        return map[estado] || 'badge-cotizacion';
    }

    /**
     * Indica si un evento está en un estado que permite registrar gastos.
     * @param {Object} evento
     * @returns {boolean}
     */
    function eventoPermiteGasto(evento) {
        return ESTADOS_EVENTO_PERMITEN_GASTO.includes(evento?.estadoEventoNombre);
    }

    /**
     * Genera el HTML de badge para un estado de gasto.
     * @param {string} estado
     * @returns {string}
     */
    function getBadgeGasto(estado) {
        return window.modulos.badgeEstado(estado || 'PROYECTADO', ESTADOS_GASTO);
    }

    /**
     * Formatea un monto como precio ($XXX.XX).
     * @param {number|string} value
     * @returns {string}
     */
    function getMonto(value) {
        return `$${window.formatters.precio(Number(value || 0))}`;
    }

    /**
     * Calcula totales proyectado / desembolsado / pendiente / general.
     * @param {Array} gastos
     * @returns {{ totalProyectado: number, totalDesembolsado: number, totalPendiente: number, totalGeneral: number }}
     */
    function calcularTotales(gastos) {
        const totalProyectado = gastos
            .filter(gasto => gasto.gastoEstado === 'PROYECTADO')
            .reduce((sum, gasto) => sum + Number(gasto.gastoMonto || 0), 0);

        const totalDesembolsado = gastos
            .filter(gasto => gasto.gastoEstado === 'DESEMBOLSADO')
            .reduce((sum, gasto) => sum + Number(gasto.gastoMonto || 0), 0);

        return {
            totalProyectado,
            totalDesembolsado,
            totalPendiente: totalProyectado,
            totalGeneral: totalProyectado + totalDesembolsado
        };
    }

    // -- Exports --------------------------------------------------------------

    window.GastosHelpers = {
        ESTADOS_EVENTO_PERMITEN_GASTO,
        ESTADOS_GASTO,
        toComparableDate,
        getBadgeEstadoEvento,
        eventoPermiteGasto,
        getBadgeGasto,
        getMonto,
        calcularTotales,
        aplicarFiltrosCombinados,
        calcularProgreso,
        normalizarEventoControl
    };
})();
