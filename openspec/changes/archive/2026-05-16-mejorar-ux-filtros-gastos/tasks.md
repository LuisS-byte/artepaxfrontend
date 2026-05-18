# Tasks: Mejorar UX Filtros Gastos

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

~430 lines total. Split: PR 1 (~110 ln) → PR 2 (~100 ln) → PR 3 (~220 ln).

## Phase 1: Foundation

- [x] **1.1 State**: +`busqueda`,`kpiActivo`,`filtroCombinado` — `gastos.state.js`
- [x] **1.2 Helpers**: `aplicarFiltrosCombinados()` — `gastos.helpers.js`
- [x] **1.3 CSS entry**: `@import "gastos-ux.css"` — `gastos.css`
- [x] **1.4 gastos-ux.css**: Search wrapper, icon, clear btn, count, sticky headers, acciones gap — new file
- [x] **1.5 Sticky headers + acciones**: Sticky thead th, .acciones-wrapper gap 12px + separator — `gastos-tables.css`, `gastos-ux.css`

## Phase 2: KPI Fix & Search

- [x] **2.1 KPI labels**: Label text + encoding fix — `gastos.html`
- [x] **2.2 KPI render**: `actualizarResumenGlobal()` labels — `gastos.render.js`
- [x] **2.3 Search HTML**: `#search-gasto`, clear btn, `#filter-chips`, `#results-count` — `gastos.html`
- [x] **2.4 Search wire**: Debounced 300ms + clear restores — `gastos.js` + `gastos.actions.js`
- [x] **2.5 Results count**: `renderResultsCount(n)` — `gastos.render.js`

## Phase 3: KPI Filtering & Chips

- [x] **3.1 KPI attrs**: `data-estado-gasto` + `onclick` — `gastos.html`
- [x] **3.2 KPI click**: `clickKpiGasto()`, toggle `.active` — `gastos.actions.js`
- [x] **3.3 Chip remove**: `quitarChip(tipo)` — `gastos.actions.js`
- [x] **3.4 Filter chips**: `renderFilterChips()` — `gastos.render.js`
- [x] **3.5 `.active` CSS**: Highlight state — `gastos-hero.css`
- [x] **3.6 Chip CSS**: `.filter-chip`, `.filter-chips-container` — `gastos-ux.css`

## Phase 4: Progress Bar

- [x] **4.1 HTML**: `#progress-bar-container` after finance grid — `gastos.html`
- [x] **4.2 Render**: `actualizarBarraProgreso()`, 3 colors — `gastos.render.js`
- [x] **4.3 CSS**: `.progress-bar-fill` + `width` transition — `gastos-summary.css`

## Phase 5: Combobox

- [x] **5.1 HTML**: `<input list>` + `<datalist>` replace `<select>` — `gastos.html`
- [x] **5.2 Handler**: `handleComboboxChange()` + regex — `gastos.actions.js`
- [x] **5.3 Init**: Feature detect + fallback + wire events — `gastos.js`
- [x] **5.4 CSS**: Input/datalist styling — `gastos-ux.css`

## Phase 6: Form UX

- [x] **6.1 Chips**: `#concept-chips`, click inserts text — `gastos.html` + `gastos.render.js`
- [x] **6.2 Sticky**: `.drawer-footer` sticky > 600px — `gastos-drawer.css`
- [x] **6.3 Fade-out**: `row-deleting` + `animationend` remove — `gastos.actions.js`
- [x] **6.4 CSS**: `@keyframes fadeOutRow`, `.concept-chip`, `.row-deleting` — `gastos-ux.css` + `gastos-drawer.css`
- [x] **6.5 Responsive**: Footer non-sticky ≤ 600px — `gastos-responsive.css`

## Dependencies

| Phase | Depends on |
|-------|-----------|
| 1 | None |
| 2 | Phase 1 |
| 3 | Phase 1 + 2 |
| 4 | Phase 1 |
| 5 | Phase 1 |
| 6 | Phase 1 |

Phases 4-6 are independent of each other.
