# Proposal: Mejorar UX Filtros Gastos

## Intent

El módulo Gastos ya funciona correctamente a nivel backend, pero su capa de presentación carece de retroalimentación visual, navegación por filtros y micro-interacciones que sí tiene el módulo Eventos. Esto genera fricción operativa: el usuario no sabe qué filtros están activos, no puede buscar gastos por concepto, y los KPIs son estáticos (no clickeables). El objetivo es llevar Gastos al mismo nivel de pulido UX que Eventos sin cambiar contratos ni arquitectura.

## Scope

### In Scope
- Search box por concepto en vista global
- KPIs interactivos (click → filtrar, patrón Eventos)
- Filter chips visibles con × para remover filtros
- Results count ("X resultados encontrados")
- Barra de progreso % desembolsado vs proyectado en event-finance-grid
- Combobox para selector de eventos (filtrado local con +500 eventos)
- Sticky footer en drawer de registro
- Fade-out animation en eliminación de gasto
- Chips de conceptos sugeridos en el form de alta

### Out of Scope
- Migrar a framework, rediseñar layout, cambiar contratos backend
- Migrar filtros a server-side
- Confirmación inline de desembolso (mantener modal actual)
- Gráficos complejos (sin librería de charts)
- Formato de monto en vivo (frágil en Vanilla JS)

## Capabilities

### New Capabilities
- `gastos-filtering`: Filtros interactivos, chips visuales y contador de resultados
- `gastos-search`: Búsqueda local por concepto en vista global
- `gastos-progress-bar`: Barra de progreso % desembolsado vs proyectado
- `gastos-combobox`: Selector de eventos con búsqueda/filtrado local
- `gastos-form-ux`: Sticky footer, chips de conceptos sugeridos, fade-out delete

### Modified Capabilities
None — existing behavior se preserva, solo se agregan interacciones nuevas.

## Approach

Implementación Vanilla JS siguiendo los patrones del módulo Eventos como referencia. Se agregan funciones de render y filtrado en los archivos modulares existentes (state → helpers → render → actions). CSS via clases utilitarias + animaciones con keyframes en `gastos.css`. El combobox es un `<input>` + `<datalist>` con fallback a filtrado manual para eventos >500. La barra de progreso usa CSS width dinámico calculado desde los totales ya disponibles en `GastosHelpers.calcularTotales()`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `modules/gastos/gastos.html` | Modified | Search input, filter chips container, results count, progress bar HTML, concept chips container |
| `modules/gastos/gastos.js` | Modified | Search handler, KPI click handlers, combobox wiring |
| `modules/gastos/js/gastos.render.js` | Modified | Nuevas funciones: renderFilterChips, renderResultsCount, renderProgressBar, renderConceptChips |
| `modules/gastos/js/gastos.state.js` | Modified | Nuevos campos: filtroActivo, terminoBusqueda, resultadosVisibles |
| `modules/gastos/js/gastos.helpers.js` | Modified | Helper de filtrado combinado (búsqueda + filtros activos) |
| `modules/gastos/gastos.css` | Modified | CSS para filter chips, progress bar, fade-out, concept chips, sticky footer |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Combobox con >500 eventos lento en DOM | Medium | Datalist nativo + debounce 300ms + render bajo demanda |
| Filter chips vs filtros existentes generan estado inconsistente | Low | Unificar en `aplicarFiltrosCombinados()` que derive chips del estado |
| Sticky footer rompe drawer en mobile | Low | Media query: sticky solo en viewport >600px |
| Fade-out animation interfiere con remove del DOM | Low | `transitionend` event listener antes del `remove()` |

## Rollback Plan

Revertir commits individuales (uno por feature). Cada feature es autocontenida: search, KPIs, chips, progress bar, combobox, sticky footer, fade-out, concept chips. Si una feature falla en producción, revertir solo ese commit sin afectar las demás.

## Dependencies

- Ninguna externa. Todo es Vanilla JS/CSS sobre código existente.
- `GastosHelpers.calcularTotales()` ya expone totalProyectado/totalDesembolsado para la barra de progreso.

## Success Criteria

- [ ] Search box filtra gastos por concepto en tiempo real (<100ms para <500 items)
- [ ] KPI cards son clickeables y aplican filtro con feedback visual
- [ ] Filter chips muestran filtros activos y permiten remover individualmente
- [ ] Results count se actualiza dinámicamente con cada filtro
- [ ] Progress bar muestra % desembolsado con transición CSS
- [ ] Combobox permite buscar eventos escribiendo (no solo scroll)
- [ ] Sticky footer permanece visible al scrollear el drawer
- [ ] Eliminación de gasto tiene fade-out de 300ms antes de desaparecer
- [ ] Chips de conceptos sugeridos insertan texto en el input al clickear
