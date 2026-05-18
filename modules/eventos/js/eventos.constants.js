(function () {
    const EVENTO_ESTADOS = Object.freeze({
        COTIZACION: 'COTIZACION',
        PROGRAMADO: 'PROGRAMADO',
        CONFIRMADO: 'CONFIRMADO',
        EN_MONTAJE: 'EN_MONTAJE',
        PENDIENTE_COBRO: 'PENDIENTE_COBRO',
        FINALIZADO: 'FINALIZADO',
        CANCELACION_PENDIENTE: 'CANCELACION_PENDIENTE',
        CANCELADO: 'CANCELADO'
    });

    const EVENTO_ACCIONES = Object.freeze({
        DETALLE: 'detalle',
        EDITAR: 'editar',
        EDITAR_PARCIAL: 'editarParcial',
        PROGRAMAR: 'programar',
        CONFIRMAR: 'confirmar',
        INICIAR_MONTAJE: 'iniciarMontaje',
        FINALIZAR: 'finalizar',
        CANCELAR: 'cancelar',
        REVERTIR_CANCELACION: 'revertirCancelacion',
        CONFIRMAR_CANCELACION: 'confirmarCancelacion',
        EXTRAS: 'extras',
        PAGOS: 'pagos',
        RENTABILIDAD: 'rentabilidad'
    });

    const KPI_FILTERS = Object.freeze({
        todos: Object.freeze({ label: 'Total', estados: null }),
        accion: Object.freeze({
            label: 'Requieren acción',
            estados: Object.freeze([
                EVENTO_ESTADOS.COTIZACION,
                EVENTO_ESTADOS.PROGRAMADO,
                EVENTO_ESTADOS.CANCELACION_PENDIENTE
            ])
        }),
        ejecucion: Object.freeze({
            label: 'En ejecución',
            estados: Object.freeze([
                EVENTO_ESTADOS.CONFIRMADO,
                EVENTO_ESTADOS.EN_MONTAJE
            ])
        }),
        PENDIENTE_COBRO: Object.freeze({
            label: 'Pend. Cobro',
            estados: Object.freeze([EVENTO_ESTADOS.PENDIENTE_COBRO])
        })
    });

    window.EventosConstants = Object.freeze({
        EVENTO_ESTADOS,
        EVENTO_ACCIONES,
        KPI_FILTERS
    });
})();
