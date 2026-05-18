# Gastos — Control de Egresos (Cola de Eventos)

## Purpose

Reemplazar el combobox de búsqueda ciega en la pestaña "Por evento" por una cola visual de eventos con split layout (patrón Cobranza de Pagos). El admin ve todos los eventos con agregaciones financieras, filtra por estado/tipo, y selecciona uno para ver su detalle de gastos.

## Requirements

### REQ-1: Split Layout + Tab Rename

La pestaña "Por evento" DEBE renombrarse a "Control de egresos". El workspace DEBE usar CSS Grid con dos paneles: izquierdo (cola, 300px fijo) y derecho (detalle, 1fr). Sin evento seleccionado, el panel derecho DEBE mostrar un empty state instructivo. En viewport ≤768px DEBE apilar verticalmente (cola arriba, detalle abajo).

#### Scenario: Layout renders on tab switch

- GIVEN el usuario cambia a la pestaña "Control de egresos"
- WHEN la vista se carga
- THEN el layout muestra cola izquierda (300px) y detalle derecho (1fr)
- AND si no hay evento seleccionado, el panel derecho muestra "Seleccioná un evento de la cola"

#### Scenario: Responsive stack ≤768px

- GIVEN viewport de 600px de ancho
- WHEN se carga la vista de Control de egresos
- THEN cola y detalle se apilan verticalmente (una fila cada uno)

### REQ-2: Event Queue (Cola)

La cola izquierda DEBE contener, en este orden: (a) campo de búsqueda con debounce 300ms que filtre por `clienteNombre`, `eventoId`, `ubicacion`; (b) filter chips: Pendientes (`totalProyectado>0`), Operativos (`permiteRegistrarGasto`), En montaje (`estado=EN_MONTAJE`), Sin gastos (`cantidadGastos=0`), Todos; (c) KPIs con conteos por cada chip; (d) lista scrolleable de eventos.

Cada evento DEBE mostrar: nombre de cliente, `#ID`, badge de estado, fecha del evento, ubicación, montos proyectado/desembolsado/pendiente. El evento activo DEBE tener estilo visual diferenciado (borde + sombra). Click DEBE cargar detalle en panel derecho.

#### Scenario: Filter chips filter correctly

- GIVEN cola cargada con eventos mixtos
- WHEN el usuario clickea chip "Pendientes"
- THEN la lista muestra solo eventos con `totalProyectado > 0`
- AND el KPI "Pendientes" refleja el conteo correcto

#### Scenario: Search filters by multiple fields

- GIVEN cola cargada
- WHEN el usuario escribe "maría" en el campo de búsqueda
- AFTER 300ms de debounce
- THEN la lista se filtra a eventos cuyo `clienteNombre` contiene "maría"

#### Scenario: Search by eventoId

- GIVEN cola cargada
- WHEN el usuario escribe "#42"
- AFTER 300ms
- THEN solo se muestra el evento con ID 42

#### Scenario: Select event loads right panel

- GIVEN cola visible con eventos
- WHEN el usuario clickea un evento
- THEN ese evento queda marcado como activo en la cola
- AND el panel derecho carga resumen + tabla de gastos de ese evento

#### Scenario: Empty search results

- GIVEN cola cargada
- WHEN el usuario escribe "zzzznoexiste"
- AFTER 300ms
- THEN la cola muestra empty state "No hay eventos que coincidan"

### REQ-3: Right Detail Panel

El panel derecho DEBE mantener toda la funcionalidad existente: event summary card, finance grid (proyectado, desembolsado, pendiente por desembolsar), progress bar con label "Avance de desembolso", tabla de gastos, botón "Registrar gasto". DEBE renombrar "Pendiente" → "Pendiente por desembolsar" y "Desembolsado vs Proyectado" → "Avance de desembolso". El CRUD de gastos, drawer y modal DEBEN funcionar idéntico a como funcionan hoy.

#### Scenario: Detail shows renamed labels

- GIVEN un evento seleccionado en la cola
- WHEN el panel derecho se renderiza
- THEN la etiqueta "Pendiente" en el finance grid muestra "Pendiente por desembolsar"
- AND la etiqueta del progress bar muestra "Avance de desembolso"

#### Scenario: Register expense opens drawer

- GIVEN detalle visible de un evento
- WHEN el usuario clickea "Registrar gasto"
- THEN se abre el mismo drawer de registro existente (sin cambios)

### REQ-4: API Wrapper

DEBE agregarse `API.gastos.eventosControl()` en `js/shared/api.js` que invoque `GET /api/gastos/eventos-control`. DEBE agregarse `GastosAPI.listarEventosControl()` como wrapper del módulo que normalice la respuesta (similar a `normalizarEventoCobranza()` en pagos).

#### Scenario: API calls correct endpoint

- GIVEN el módulo de gastos se inicializa
- WHEN se invoca `GastosAPI.listarEventosControl()`
- THEN se ejecuta `GET /api/gastos/eventos-control`
- AND retorna un array de eventos con campos: `eventoId`, `clienteNombre`, `estadoEventoNombre`, `fechaEvento`, `ubicacion`, `totalProyectado`, `totalDesembolsado`, `pendienteDesembolso`, `permiteRegistrarGasto`, `cantidadGastos`

#### Scenario: Error handling

- GIVEN el endpoint retorna error 500
- WHEN se invoca `GastosAPI.listarEventosControl()`
- THEN se muestra alerta de error "Error al cargar eventos de control"
- AND la cola muestra empty state con mensaje de error

## UI States

| State | Cola (izquierda) | Detalle (derecha) |
|-------|-------------------|-------------------|
| Loading | Spinner/skeleton | Empty state "Cargando..." |
| Loaded | Lista con eventos, chips, KPIs | — |
| No selection | — | "Seleccioná un evento de la cola" |
| Selected | Evento activo resaltado | Summary + finance + progress + tabla |
| Filtered | Solo eventos del chip activo | — |
| Searching | Eventos filtrados por query | — |
| Empty | "No hay eventos que coincidan" | — |
| Error | "Error al cargar" + reintentar | — |
| Loading detail | — | Spinner en panel derecho |

## Dependencies

- `GET /api/gastos/eventos-control` (backend existente)
- `GastosState` — agregar `eventosControl`, `filtroCola`, `busquedaCola`, `eventoSeleccionadoColaId`
- `GastosAPI.listarGastosPorEvento()` + `GastosAPI.obtenerResumenEvento()` (existentes, sin cambios)
- Patrón de referencia: `pagos.cobranza.js` / `pagos-queue.css`
- Constantes de estado: `COTIZACION`, `PROGRAMADO`, `CONFIRMADO`, `EN_MONTAJE`, `FINALIZADO`
