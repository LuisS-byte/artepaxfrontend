# Proposal: Control de Egresos — Cola de Eventos

## Intent

Reemplazar el combobox de la pestaña "Por evento" (búsqueda ciega: el admin debe saber qué buscar) por una cola visual de eventos con split layout, basada en el patrón ya probado en Pagos > Cobranza. El backend `GET /api/gastos/eventos-control` ya devuelve datos priorizados; solo falta consumirlo y renderizar la cola.

## Scope

### In Scope
- Renombrar pestaña "Por evento" → "Control de egresos"
- Panel izquierdo: cola de eventos con search, filter chips, KPIs, lista scrolleable
- Cada evento muestra: cliente, #ID, estado badge, fecha, ubicación, proyectado/desembolsado/pendiente
- Filter chips: "Pendientes", "Operativos", "En montaje", "Sin gastos", "Todos"
- KPIs de cola: contadores por categoría de filtro
- Panel derecho: mantiene summary card, finance grid, progress bar, tabla de gastos, botón registrar
- Nuevo endpoint wrapper: `API.gastos.eventosControl()` + `GastosAPI.eventosControl()`
- Remover HTML/JS del combobox (`#combobox-evento-gasto`, `#datalist-eventos-gasto`, fallback `<select>`)

### Out of Scope
- Sin cambios al backend (ya existe `eventos-control`)
- Sin cambios a la pestaña "Todos los gastos"
- Sin cambios al drawer, modal, ni lógica CRUD de gastos
- Sin cambios al renderizado de tabla de gastos

## Capabilities

### New Capabilities
- `gastos-control-cola`: cola de eventos con split layout, search, filter chips, KPIs, selección visual de evento

### Modified Capabilities
- `gastos-combobox`: eliminado — reemplazado completamente por `gastos-control-cola`

## Approach

Seguir el patrón de Pagos > Cobranza (`pagos.cobranza.js` + `pagos-queue.css`):
1. Cargar `API.gastos.eventosControl()` al iniciar la pestaña → normalizar DTOs → almacenar en state
2. Renderizar cola izquierda con `getEventosGastoFiltrados()` (filtro + search local)
3. Click en evento → cargar `GastosAPI.listarGastosPorEvento()` + `GastosAPI.obtenerResumenEvento()` en panel derecho (ya existe)
4. CSS: grid layout `.gastos-workspace` (300px cola + 1fr detalle), responsive: stack vertical en ≤1024px

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `modules/gastos/gastos.html` | Modified | Reemplazar `#view-evento` HTML: remover combobox, agregar cola + workspace |
| `modules/gastos/gastos.js` | Modified | Remover init combobox, agregar carga de cola + handlers de selección |
| `modules/gastos/gastos.css` | Modified | Agregar `.gastos-workspace`, `.gastos-queue-panel`, `.gastos-detail-panel` |
| `modules/gastos/js/gastos.state.js` | Modified | Agregar `eventosControl`, `filtroCola`, `busquedaCola` |
| `modules/gastos/js/gastos.api.js` | Modified | Agregar `eventosControl()` wrapper |
| `modules/gastos/js/gastos.actions.js` | Modified | Agregar `setFiltroCola()`, `seleccionarEventoCola()`; remover acciones combobox |
| `modules/gastos/js/gastos.render.js` | Modified | Agregar `renderColaEventos()`, `renderQueueKPIs()`, `renderEventoItem()` |
| `js/shared/api.js` | Modified | Agregar `API.gastos.eventosControl()` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Layout rompe en pantallas ≤1024px | Low | Stack vertical con cola arriba (accordion) y detalle abajo, igual que Pagos |
| Endpoint `eventos-control` no devuelve datos esperados | Low | Ya verificado en backend; wrapper solo mapea 1:1 |
| Estado `GastosState.eventosDisponibles` queda obsoleto | Low | Mantenerlo para retrocompatibilidad; migrar a `eventosControl` progresivamente |
| Doble carga al cambiar tabs | Low | Cargar cola solo en `cambiarTab('evento')` si `eventosControl` está vacío |

## Rollback Plan

1. Revertir `gastos.html` al HTML con combobox (git checkout del commit previo)
2. Eliminar wrappers `API.gastos.eventosControl()` y `GastosAPI.eventosControl()` agregados
3. Restaurar `gastos.state.js` removiendo campos `eventosControl`, `filtroCola`, `busquedaCola`
4. El endpoint backend queda sin consumir — sin impacto

## Dependencies

- Backend endpoint `GET /api/gastos/eventos-control` — ya desplegado y funcional
- Patrón de referencia: `modules/pagos/js/pagos.cobranza.js` + `modules/pagos/css/pagos-queue.css`
- Constantes de estado de evento: `COTIZACION`, `PROGRAMADO`, `CONFIRMADO`, `EN_MONTAJE`, `FINALIZADO`

## Success Criteria

- [ ] Admin ve la cola de eventos al abrir "Control de egresos" sin necesidad de buscar
- [ ] Filter chips filtran correctamente (Pendientes, Operativos, En montaje, Sin gastos, Todos)
- [ ] KPIs muestran conteos exactos por categoría
- [ ] Click en evento carga detalle en panel derecho (summary + finance + tabla + progress bar)
- [ ] Search filtra eventos localmente con debounce 300ms
- [ ] Layout responsive: split en ≥1024px, stacked en ≤1024px
- [ ] Botón "Registrar gasto" funciona igual que antes (mismo drawer, misma lógica)
- [ ] Código del combobox completamente removido (HTML, JS, CSS)
