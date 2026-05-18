(function () {
    const { EVENTO_ESTADOS, EVENTO_ACCIONES, KPI_FILTERS } = window.EventosConstants;

    const EVENTO_LABELS = Object.freeze({
        [EVENTO_ESTADOS.COTIZACION]: 'Cotizaciones',
        [EVENTO_ESTADOS.PROGRAMADO]: 'Programados',
        [EVENTO_ESTADOS.CONFIRMADO]: 'Confirmados',
        [EVENTO_ESTADOS.EN_MONTAJE]: 'En Montaje',
        [EVENTO_ESTADOS.PENDIENTE_COBRO]: 'Pend. Cobro',
        [EVENTO_ESTADOS.CANCELACION_PENDIENTE]: 'Canc. Pendientes',
        [EVENTO_ESTADOS.FINALIZADO]: 'Finalizados',
        [EVENTO_ESTADOS.CANCELADO]: 'Cancelados'
    });

    const EVENTO_ACTION_LABELS = Object.freeze({
        [EVENTO_ACCIONES.DETALLE]: 'Ver detalle',
        [EVENTO_ACCIONES.EDITAR]: 'Editar',
        [EVENTO_ACCIONES.EDITAR_PARCIAL]: 'Editar',
        [EVENTO_ACCIONES.PROGRAMAR]: 'Programar',
        [EVENTO_ACCIONES.CONFIRMAR]: 'Confirmar',
        [EVENTO_ACCIONES.INICIAR_MONTAJE]: 'Iniciar Montaje',
        [EVENTO_ACCIONES.FINALIZAR]: 'Finalizar',
        [EVENTO_ACCIONES.CANCELAR]: 'Cancelar',
        [EVENTO_ACCIONES.REVERTIR_CANCELACION]: 'Revertir',
        [EVENTO_ACCIONES.CONFIRMAR_CANCELACION]: 'Confirmar Baja Definitiva',
        [EVENTO_ACCIONES.EXTRAS]: 'Extras',
        [EVENTO_ACCIONES.PAGOS]: 'Pagos',
        [EVENTO_ACCIONES.RENTABILIDAD]: 'Rentabilidad'
    });

    const KPI_FILTER_LABELS = Object.freeze(Object.keys(KPI_FILTERS).reduce((acc, key) => {
        acc[key] = KPI_FILTERS[key].label;
        return acc;
    }, {}));

    window.EventosLabels = Object.freeze({
        EVENTO_LABELS,
        EVENTO_ACTION_LABELS,
        KPI_FILTER_LABELS
    });
})();
