/**
 * modules/documentos/js/documentos.policy.js
 * Política documental — tipos, estados permitidos, reglas de generación
 * y metadatos UX de prioridad por estado para jerarquía visual.
 * Fase 2 — Matriz UX de acciones por estado.
 */
(function () {
    'use strict';

    /**
     * ux.priority:          prioridad base del tipo documental
     *   'exclusive'  → único disponible (solo COTIZACION)
     *   'primary'    → acción principal recomendada
     *   'secondary'  → acción secundaria / tardía
     *
     * ux.estadoPriority:    override de prioridad para estados específicos
     *   ej. FINALIZADO: aviso = primary, confirmación = secondary
     */
    const DOC_POLICY = {
        COTIZACION_EVENTO: {
            titulo: 'Cotización del evento',
            descripcion: 'Generá la cotización formal del evento para presentar al cliente.',
            descripcionBloqueo: 'Solo disponible para eventos en estado Cotización.',
            estados: ['COTIZACION'],
            ux: {
                icon: 'file-text',
                priority: 'exclusive',
                estadoPriority: {}
            },
            action: () => generarDocumento('COTIZACION_EVENTO')
        },
        CONFIRMACION_RESERVA: {
            titulo: 'Confirmación de reserva',
            descripcion: 'Formalizá la reserva con todos los detalles acordados.',
            descripcionBloqueo: 'Requiere un evento Confirmado o posterior.',
            estados: ['CONFIRMADO', 'EN_MONTAJE', 'FINALIZADO'],
            ux: {
                icon: 'calendar-check',
                priority: 'primary',
                estadoPriority: {
                    'FINALIZADO': 'secondary'
                }
            },
            action: () => generarDocumento('CONFIRMACION_RESERVA')
        },
        AVISO_SALDO_PENDIENTE: {
            titulo: 'Aviso de saldo pendiente',
            descripcion: 'Notificá al cliente sobre saldos impagos.',
            descripcionBloqueo: 'Solo cuando hay saldo pendiente y el estado lo permite.',
            estados: ['PROGRAMADO', 'CONFIRMADO', 'EN_MONTAJE', 'FINALIZADO', 'PENDIENTE_COBRO'],
            ux: {
                icon: 'bell',
                priority: 'primary',
                estadoPriority: {
                    'FINALIZADO': 'primary'
                }
            },
            action: () => generarAvisoSaldoPendiente()
        }
    };

    /**
     * Determina si un tipo documental PUEDE generarse dado el contexto.
     * @param {string} tipo          - COTIZACION_EVENTO | CONFIRMACION_RESERVA | AVISO_SALDO_PENDIENTE
     * @param {string} estadoEvento  - estado actual del evento (backend)
     * @param {number} saldoPendiente
     * @returns {boolean}
     */
    function puedeGenerarTipo(tipo, estadoEvento, saldoPendiente) {
        const cfg = DOC_POLICY[tipo];
        if (!cfg) return false;
        // Explícitamente bloquear eventos cancelados
        if (estadoEvento === 'CANCELADO') return false;
        if (!cfg.estados.includes(estadoEvento)) return false;
        if (tipo === 'AVISO_SALDO_PENDIENTE' && !(Number(saldoPendiente || 0) > 0)) return false;
        if (DocumentosState.documentosActuales.some(doc => doc.docuTipo === tipo)) return false;
        return true;
    }

    /**
     * Devuelve la prioridad EFECTIVA para un (tipo, estadoEvento).
     * @param {string} tipo
     * @param {string} estadoEvento
     * @returns {'exclusive'|'primary'|'secondary'}
     */
    function getDocPriority(tipo, estadoEvento) {
        const cfg = DOC_POLICY[tipo];
        if (!cfg || !cfg.ux) return 'primary';
        const override = cfg.ux.estadoPriority?.[estadoEvento];
        return override || cfg.ux.priority || 'primary';
    }

    /**
     * Devuelve el icono Lucide para un tipo documental.
     * @param {string} tipo
     * @returns {string}
     */
    function getDocIcon(tipo) {
        const cfg = DOC_POLICY[tipo];
        return cfg?.ux?.icon || 'file-text';
    }

    /**
     * Genera el texto de razón por el que un botón está deshabilitado.
     * @param {string} tipo
     * @param {string} estadoEvento
     * @param {number} saldoPendiente
     * @param {boolean} existe
     * @param {boolean} enCurso
     * @returns {string}
     */
    function getDisabledReason(tipo, estadoEvento, saldoPendiente, existe, enCurso) {
        const cfg = DOC_POLICY[tipo];
        if (!cfg) return 'Tipo de documento desconocido.';
        if (enCurso) return 'Generando documento... por favor espera.';
        if (existe) return 'Ya existe un documento de este tipo para este evento.';
        if (estadoEvento === 'CANCELADO') return 'Evento cancelado — no se pueden generar documentos.';
        if (!cfg.estados.includes(estadoEvento)) return `No disponible para eventos en estado ${estadoEvento || 'actual'}.`;
        if (tipo === 'AVISO_SALDO_PENDIENTE' && !(saldoPendiente > 0)) return 'No hay saldo pendiente para emitir este aviso.';
        return cfg.descripcionBloqueo || 'No disponible.';
    }

    window.DocumentosPolicy = {
        DOC_POLICY,
        puedeGenerarTipo,
        getDocPriority,
        getDocIcon,
        getDisabledReason
    };
})();
