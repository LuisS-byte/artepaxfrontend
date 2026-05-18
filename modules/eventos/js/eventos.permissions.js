(function () {
    const { EVENTO_ESTADOS, EVENTO_ACCIONES } = window.EventosConstants;

    function getAccionesPermitidasEvento(estado) {
        const reglas = {
            [EVENTO_ESTADOS.COTIZACION]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.EDITAR,
                EVENTO_ACCIONES.PROGRAMAR,
                EVENTO_ACCIONES.CANCELAR
            ],
            [EVENTO_ESTADOS.PROGRAMADO]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.EDITAR_PARCIAL,
                EVENTO_ACCIONES.CONFIRMAR,
                EVENTO_ACCIONES.EXTRAS,
                EVENTO_ACCIONES.CANCELAR
            ],
            [EVENTO_ESTADOS.CONFIRMADO]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.INICIAR_MONTAJE,
                EVENTO_ACCIONES.EXTRAS,
                EVENTO_ACCIONES.CANCELAR
            ],
            [EVENTO_ESTADOS.EN_MONTAJE]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.FINALIZAR,
                EVENTO_ACCIONES.CANCELAR
            ],
            [EVENTO_ESTADOS.PENDIENTE_COBRO]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.PAGOS
            ],
            [EVENTO_ESTADOS.CANCELACION_PENDIENTE]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.REVERTIR_CANCELACION,
                EVENTO_ACCIONES.CONFIRMAR_CANCELACION
            ],
            [EVENTO_ESTADOS.FINALIZADO]: [
                EVENTO_ACCIONES.DETALLE,
                EVENTO_ACCIONES.RENTABILIDAD
            ],
            [EVENTO_ESTADOS.CANCELADO]: [
                EVENTO_ACCIONES.DETALLE
            ]
        };

        return reglas[estado] || [EVENTO_ACCIONES.DETALLE];
    }

    function getAccionesPrimariasEvento(estado) {
        const reglas = {
            [EVENTO_ESTADOS.COTIZACION]: [EVENTO_ACCIONES.PROGRAMAR],
            [EVENTO_ESTADOS.PROGRAMADO]: [EVENTO_ACCIONES.CONFIRMAR],
            [EVENTO_ESTADOS.CONFIRMADO]: [EVENTO_ACCIONES.INICIAR_MONTAJE],
            [EVENTO_ESTADOS.EN_MONTAJE]: [EVENTO_ACCIONES.FINALIZAR],
            [EVENTO_ESTADOS.PENDIENTE_COBRO]: [EVENTO_ACCIONES.PAGOS],
            [EVENTO_ESTADOS.CANCELACION_PENDIENTE]: [EVENTO_ACCIONES.REVERTIR_CANCELACION],
            [EVENTO_ESTADOS.FINALIZADO]: [EVENTO_ACCIONES.RENTABILIDAD],
            [EVENTO_ESTADOS.CANCELADO]: []
        };

        return reglas[estado] || [];
    }

    function permiteEditarEvento(estado) {
        return estado === EVENTO_ESTADOS.COTIZACION || estado === EVENTO_ESTADOS.PROGRAMADO;
    }

    function esEdicionParcialEvento(estado) {
        return estado === EVENTO_ESTADOS.PROGRAMADO;
    }

    function permiteExtrasEvento(estado) {
        return estado === EVENTO_ESTADOS.PROGRAMADO || estado === EVENTO_ESTADOS.CONFIRMADO;
    }

    window.EventosPermissions = Object.freeze({
        getAccionesPermitidasEvento,
        getAccionesPrimariasEvento,
        permiteEditarEvento,
        esEdicionParcialEvento,
        permiteExtrasEvento
    });
})();
