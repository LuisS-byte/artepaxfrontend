(function () {
    const state = {
        eventos: [],
        todosLosEventos: null,
        clientesDisponibles: [],
        decoracionesDisponibles: [],
        tiposEventoDisponibles: [],
        eventoAccionId: null,
        eventoEditandoId: null,
        eventoCancelandoEstado: null,
        formularioModificado: false,
        resolveDescarte: null,
        filtros: {
            fechaDesde: null,
            fechaHasta: null,
            kpi: 'todos'
        },
        vistaActual: 'lista'
    };

    function getState() {
        return state;
    }

    function setEventos(eventos) {
        state.eventos = Array.isArray(eventos) ? eventos : [];
    }

    function setTodosLosEventos(eventos) {
        state.todosLosEventos = Array.isArray(eventos) ? eventos : eventos === null ? null : [];
    }

    function setFiltro(nombre, valor) {
        state.filtros[nombre] = valor;
    }

    function setEventoSeleccionado(id) {
        state.eventoAccionId = id;
    }

    window.EventosState = Object.freeze({
        getState,
        setEventos,
        setTodosLosEventos,
        setFiltro,
        setEventoSeleccionado
    });
})();
