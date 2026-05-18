# Tasks: Control de Egresos — Cola de Eventos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~555 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (~100ln) → PR 2 (~360ln) → PR 3 (~95ln) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR |
|------|------|-----------|
| 1 | API wrapper + state + helpers + label updates | PR 1 |
| 2 | New cola.html CSS + cola.js + HTML layout | PR 2 (depends on PR 1) |
| 3 | Orchestrator updates + combobox removal cleanup | PR 3 (depends on PR 2) |

## Phase 1: Foundation (PR 1 — ~100ln)

- [x] 1.1 `js/shared/api.js` — add `eventosControl: () => api.get('/api/gastos/eventos-control')`
- [x] 1.2 `modules/gastos/js/gastos.api.js` — add `listarEventosControl()` wrapping `API.gastos.eventosControl()`
- [x] 1.3 `modules/gastos/js/gastos.state.js` — add `eventosControl: []`, `filtroCola: 'pendientes'`, `busquedaCola: ''`, `colaCargando: false`
- [x] 1.4 `modules/gastos/js/gastos.helpers.js` — add normalizer `normalizarEventoControl(row)` + export
- [x] 1.5 `modules/gastos/gastos.html` — rename "Total pendiente" → "Pendiente por desembolsar" (progress bar label rename deferred to PR 2)

## Phase 2: Queue UI + Layout (PR 2 — ~360ln) ✅

- [x] 2.1 `modules/gastos/css/gastos-cola.css` — create full queue styles: workspace grid, queue panel, search, chips, KPIs, item list, active state, responsive <=768px
- [x] 2.2 `modules/gastos/gastos.css` — add `@import "./css/gastos-cola.css"`
- [x] 2.3 `modules/gastos/js/gastos.cola.js` — create: `cargarEventosControl()`, `getColaEgresosFiltrados()`, `actualizarKPIsCola()`, `renderizarColaEgresos()`, `setFiltroCola()`, `initBusquedaCola()`, `limpiarBusquedaCola()`, `seleccionarEventoCola(id)`
- [x] 2.4 `modules/gastos/gastos.html` — replace combobox `.card.selector-card` with `.egresos-workspace` (aside + detail), rename tab to "Control de egresos", add `<script src="js/gastos.cola.js">` after gastos.api.js

## Phase 3: Wiring + Cleanup (PR 3 — ~95ln)

- [x] 3.1 `modules/gastos/gastos.js` — remove `cargarEventosParaGastos()` + combobox polling + `eventosDisponibles` usage; simplify `cargarGastosEvento()` to read from `GastosState.eventoSeleccionadoId` + `getEventoById()`; wire `cargarEventosControl()` on tab switch to 'evento'
- [x] 3.2 `modules/gastos/js/gastos.actions.js` — remove `initComboboxEvento()`, `handleComboboxChange()`, `limpiarComboboxEvento()`, `setComboboxEvento()`, `renderDatalistOptions()` references
- [x] 3.3 `modules/gastos/js/gastos.render.js` — remove `renderDatalistOptions()` function
- [x] 3.4 `modules/gastos/js/gastos.helpers.js` — remove `filtrarEventos()` (was combobox-only)
- [x] 3.5 `modules/gastos/css/gastos-ux.css` — remove combobox CSS rules
- [x] 3.6 `modules/gastos/gastos.js` — remove `eventosDisponibles` from state, verify no dangling references

## Next Step

Ready for implementation (sdd-apply). Auto-chain with stacked PRs:
1. Apply PR 1 first (foundation — tests pass safely in isolation)
2. Then PR 2 (UI — depends on new API/state/helpers)
3. Then PR 3 (wiring + cleanup — depends on new HTML/CSS/cola.js)
