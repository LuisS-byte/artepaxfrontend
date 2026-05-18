# Gastos — Filtering Spec

## Description

Las 3 KPI cards del hero (Proyectado, Desembolsado, Total) se vuelven clickeables y actúan como filtro de estado sobre la tabla global. Al hacer click en una card, la tabla se filtra por ese estado (PROYECTADO / DESEMBOLSADO) y se renderizan chips visuales que muestran los filtros activos con botón × para removerlos. Un contador dinámico muestra "Mostrando X resultados" cuando hay filtros activos. La lógica de filtrado combinado soporta estado + búsqueda + rango de fechas simultáneamente.

## Requirements

- REQ-1: KPI cards `gastos-kpi-card` (Proyectado, Desembolsado, Total) DEBEN responder a click agregando/removiendo clase `.active` y aplicando filtro por estado a `GastosState.gastosGlobales`
- REQ-2: Filter chips DEBEN renderizarse en un contenedor `#filter-chips` debajo de la filter-bar, con clase `.filter-chip`, texto del filtro y botón ×
- REQ-3: Results count DEBE mostrarse en `#results-count` con texto "Mostrando X resultados" solo cuando hay al menos un filtro activo
- REQ-4: Re-click en misma KPI card DEBE togglear el filtro (quitarlo si ya está activo)
- REQ-5: Filter chips DEBEN integrarse con filtros existentes (select estado, fecha desde/hasta) a través de una función central `aplicarFiltrosCombinados()`

## Acceptance Criteria

- [ ] GIVEN usuario en vista "Todos los gastos" WHEN hace click en KPI Desembolsado THEN tabla se filtra, chip "Desembolsado" aparece, contador se actualiza
- [ ] GIVEN filtro Desembolsado activo WHEN usuario hace click otra vez en misma KPI THEN filtro se quita, chip desaparece, tabla vuelve a datos completos
- [ ] GIVEN filtro activo + búsqueda por texto WHEN ambos aplicados THEN tabla muestra intersección de ambos filtros
- [ ] GIVEN chip visible WHEN usuario clickea × THEN solo ese filtro se remueve sin afectar otros

## UI States

- Normal: KPI cards sin clase `.active`, sin chips, sin contador
- Active Filter: KPI card con clase `.active`, chips visibles, contador visible
- Combined Filters: múltiples chips visibles, datos tabla reflejan intersección
- Empty Result: KPI y chips visibles, tabla muestra empty state, contador dice "Mostrando 0 resultados"

## Interaction Details

- Click en KPI card: toggle `state.filtroEstado = card.dataset.estadoGasto` (o `null` si ya activo), llamar `aplicarFiltrosCombinados()`
- Chip × click: remover filtro correspondiente del state, actualizar KPI active state, re-render
- Timeline: <16ms (síncrono, no hay llamada API — filtra sobre datos ya en memoria)

## Dependencies

- Depende de `GastosState.gastosGlobales` y `gastosGlobalesBase` (todos los datos cargados)
- Sigue patrón de `EventosFilters.actualizarChipsFiltros` y `EventosFilters.actualizarResultsCount`
- `GastosState` necesita campo nuevo: `filtroEstado` (string | null)
