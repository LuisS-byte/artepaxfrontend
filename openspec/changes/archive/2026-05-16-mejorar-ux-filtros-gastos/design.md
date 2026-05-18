# Design: Mejorar UX Filtros Gastos

## Technical Approach

Extender el módulo Gastos con 6 grupos de cambios autocontenidos, todos Vanilla JS/CSS siguiendo el patrón del módulo Eventos (`EventosFilters`). Se agrega filtrado combinado centralizado en `GastosHelpers.aplicarFiltrosCombinados()`, nuevos campos de estado en `GastosState`, y funciones de render autocontenidas en `GastosRender`. Cada feature es un commit independiente.

## Architecture Decisions

### Decision: Filter state centralization
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Dispersar filtros en cada handler | Simple pero inconsistente | ❌ |
| Unificar en `aplicarFiltrosCombinados()` | Un solo punto de entrada, chips derivados del state | ✅ **Elegido** |
| **Rationale**: Misma arquitectura que `EventosFilters.aplicarFiltros()`. Evita que KPI + search + estado select + fechas generen estado inconsistente. `aplicarFiltrosCombinados()` se llama después de `cargarGastosGlobales()` y al cambiar cualquier filtro local.

### Decision: KPI fix — label relabeling
| Option | Tradeoff | Decision |
|--------|----------|----------|
| `gastosGlobalesBase` | Base = page items unfiltered (still 50, not 500) | ❌ |
| **Relabel to "Totales de página actual"** | Honesto, mínimo cambio | ✅ **Elegido** |
| **Rationale**: Backend devuelve páginas de 50 items. `gastosGlobalesBase` NO es el dataset completo. Cambiar labels es transparente y evita falsa expectativa. Si en futuro hay endpoint de totales globales se puede cambiar.

### Decision: Combobox approach
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Custom div-based combobox | Control total pero +200 líneas de código | ❌ |
| `<input>` + `<datalist>` | Nativo, accesible, sin JS extra | ✅ **Elegido** |
| Fallback a `<select>` | Si `!HTMLInputElement.prototype.list` | ✅ **Elegido** |
| **Rationale**: Datalist cubre el caso de uso (500+ items filtrables) sin reinventar el wheel. El parseo del `[#ID]` se hace con regex simple.

### Decision: Fade-out delete approach
| Option | Tradeoff | Decision |
|--------|----------|----------|
| CSS animation + setTimeout | Timing frágil | ❌ |
| CSS transition + `transitionend` | Garantiza que la animación terminó | ✅ **Elegido** |
| **Rationale**: `transitionend` con `{ once: true }` es el patrón estándar. Se aplica tras la confirmación del modal y antes de la recarga.

## State Changes (`GastosState`)

| New Property | Type | Default | Used By |
|---|---|---|---|
| `filtroEstado` | `string\|null` | `null` | gastos-filtering (KPI click) |
| `filtroBusqueda` | `string` | `''` | gastos-search |
| `gastosFiltrados` | `array` | `[]` | Resultado de aplicarFiltrosCombinados() |

## HTML Elements

| Element ID | Tag | Location | Purpose |
|---|---|---|---|
| `#search-gasto` | `<input>` | Inside `.filter-bar`, after date filters | Text search input |
| `#search-gasto-clear` | `<button>` | Inside search-input-wrapper | Clear search button (×) |
| `#filter-chips` | `<div>` | After `.filter-bar` | Container for filter chips |
| `#results-count` | `<div>` | After `#filter-chips` | "Mostrando X resultados" |
| `#progress-bar-container` | `<div>` | After `.finance-grid` | Progress bar wrapper |
| `#concept-chips` | `<div>` | After `#input-concepto` form-group | Concept suggestion chips |

**Modified elements**:
- `.gastos-kpi-card` — add `data-estado-gasto="PROYECTADO|DESEMBOLSADO"` and `onclick`
- `.gastos-kpi-foot` — update label texts to "Totales de página actual"

## Data Flow

```
cargarGastosGlobales()
    │
    ├─ API call → response.content
    ├─ gastosGlobalesBase = response.content
    ├─ filter by select-estado + fechas → gastosGlobales
    │
    └─ aplicarFiltrosCombinados()
         │
         ├─ filter gastosGlobales by filtroEstado (KPI)
         ├─ filter by filtroBusqueda (search)
         ├─ gastosFiltrados = result
         ├─ renderFilterChips()
         ├─ renderResultsCount()
         └─ modulos.renderTabla(gastosFiltrados)
```

**Trigger points for `aplicarFiltrosCombinados()`**:
1. After `cargarGastosGlobales()` completes (in orchestrator)
2. KPI card click (toggles `filtroEstado`)
3. Search input (debounced 300ms, updates `filtroBusqueda`)
4. Search clear button (resets `filtroBusqueda`)
5. Chip × click (clears specific filter)

## New JS Functions

### `GastosRender` (render.js)

| Function | Signature | Responsibility |
|---|---|---|
| `renderFilterChips()` | `() => void` | Render chips from state, × buttons call handlers |
| `renderResultsCount(n)` | `(n: number) => void` | Show/hide "Mostrando X resultados" |
| `renderProgressBar(resumen)` | `(resumen) => void` | Render bar with % + color class |
| `renderConceptChips()` | `() => void` | Render [Flete], [Comida], etc. in drawer |

### `GastosHelpers` (helpers.js)

| Function | Signature | Responsibility |
|---|---|---|
| `aplicarFiltrosCombinados()` | `() => void` | Combined filter + chips + count + re-render |

### `GastosActions` (actions.js)

| Function | Signature | Responsibility |
|---|---|---|
| `clickKpiGasto(estado)` | `(estado: string) => void` | Toggle `filtroEstado`, call `aplicarFiltrosCombinados()` |
| `limpiarBusqueda()` | `() => void` | Reset search, call `aplicarFiltrosCombinados()` |
| `quitarChip(tipo)` | `(tipo: string) => void` | Remove specific filter by type |
| `handleComboboxChange()` | `() => void` | Parse `[#ID]`, call `cargarGastosEvento()` |

## CSS Strategy

New file: `modules/gastos/css/gastos-ux.css` (imported from `gastos.css` after `gastos-responsive.css`)

| CSS Class | Property | Purpose |
|---|---|---|
| `.search-input-wrapper` | `position: relative` | Wrapper for input + icon + clear button |
| `.search-icon` | `position: absolute; left: 12px` | Lucide search icon inside input |
| `.search-clear` | `position: absolute; right: 12px` | × button, visible only when text |
| `.filter-chip` | `display: inline-flex; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 0.82rem` | Chip style (follow Eventos pattern) |
| `.filter-chip-remove` | `cursor: pointer; border: none; background: none` | × button inside chip |
| `.filter-chips-container` | `display: flex; gap: 8px; flex-wrap: wrap; padding: 8px 0` | Container |
| `.results-count-container` | `font-size: 0.86rem; color: var(--neutral-600)` | Counter text |
| `.gastos-kpi-card.active` | `box-shadow: 0 0 0 2px var(--accent); transform: scale(1.02)` | Active filter state |
| `.progress-bar-container` | `height: 8px; border-radius: 999px; background: var(--neutral-200)` | Outer bar track |
| `.progress-bar-fill` | `height: 100%; border-radius: 999px; transition: width 0.4s ease` | Inner animated fill |
| `.progress-ok` | `background: var(--success)` | Green ≥70% |
| `.progress-warning` | `background: var(--warning)` | Orange 1-69% |
| `.progress-empty` | `background: var(--neutral-300)` | Gray 0% |
| `.concept-chip` | `padding: 4px 12px; border-radius: 999px; font-size: 0.82rem; cursor: pointer` | Concept suggestion chip |
| `.fade-out` | `opacity: 0; transition: opacity 0.3s ease` | Delete animation class |
| `.drawer-footer.sticky` | `position: sticky; bottom: 0` | Sticky footer (added via media query) |
| `.progress-label` | `font-size: 0.76rem; color: var(--neutral-500)` | Label below progress bar |

## Animation Strategy

### Fade-out delete: key CSS + transitionend
```css
/* gastos-ux.css */
.fade-out {
    opacity: 0;
    transition: opacity 0.3s ease;
}

/* En confirmarAccionGasto(), tipo 'eliminar': */
const row = document.querySelector(`#tabla-gastos-global tr[data-gasto-id="${id}"], #tabla-gastos tr[data-gasto-id="${id}"]`);
if (row) {
    row.classList.add('fade-out');
    row.addEventListener('transitionend', async () => {
        row.remove();
        await recargarVistaActiva();
    }, { once: true });
}
```

### Progress bar: CSS width transition
```css
.progress-bar-fill {
    transition: width 0.4s ease;
}
```

## Combobox Implementation

```html
<input type="text" id="select-evento-gasto" list="evento-list"
       placeholder="Buscar evento por ID, cliente..."
       autocomplete="off">
<datalist id="evento-list"></datalist>
```

**JS flow**:
1. On `DOMContentLoaded`: feature-detect `HTMLInputElement.prototype.list`
2. If supported: hide `<input>` version, show datalist version
3. On `input`: debounce 300ms → filter `GastosState.eventosDisponibles` → rebuild `<option>` elements matching text
4. On `change`/`blur`: parse `[#(\d+)]` regex, if match → `cargarGastosEvento(id)`
5. If not supported: keep existing `<select>` as fallback

## File Change Plan

| File | Action | What |
|---|---|---|
| `modules/gastos/gastos.html` | Modify | Add search input, filter-chips, results-count, progress-bar, concept-chips HTML. Add `data-estado-gasto` to KPI cards. Update KPI foot labels. |
| `modules/gastos/js/gastos.state.js` | Modify | Add `filtroEstado`, `filtroBusqueda`, `gastosFiltrados` |
| `modules/gastos/js/gastos.helpers.js` | Modify | Add `aplicarFiltrosCombinados()` — centralized filter + chip + count logic |
| `modules/gastos/js/gastos.render.js` | Modify | Add `renderFilterChips()`, `renderResultsCount()`, `renderProgressBar()`, `renderConceptChips()`. Update `actualizarResumenGlobal()` labels. |
| `modules/gastos/js/gastos.actions.js` | Modify | Add `clickKpiGasto()`, `limpiarBusqueda()`, `quitarChip()`, `handleComboboxChange()`. Update `confirmarAccionGasto()` for fade-out. |
| `modules/gastos/gastos.js` | Modify | Wire search input, KPI click, combobox events in `DOMContentLoaded`. Add `aplicarFiltrosCombinados()` call after `cargarGastosGlobales()`. |
| `modules/gastos/gastos.css` | Modify | Add `@import "./css/gastos-ux.css"` |
| `modules/gastos/css/gastos-hero.css` | Modify | Add `.gastos-kpi-card.active` style |
| `modules/gastos/css/gastos-drawer.css` | Modify | Add `.drawer-footer` sticky styles, `.concept-chip` styles |
| `modules/gastos/css/gastos-summary.css` | Modify | Add progress bar styles |
| `modules/gastos/css/gastos-responsive.css` | Modify | Add `.drawer-footer` non-sticky at ≤600px, progress bar responsive |
| `modules/gastos/css/gastos-ux.css` | **Create** | Filter chips, search input, fade-out, results count — all new UX CSS |

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `aplicarFiltrosCombinados()` | Pure function test with known data: filter by estado, search, both |
| Unit | Progress bar % calculation | `GastosHelpers.calcularTotales()` remains unchanged; test render function |
| Visual | All UI states | Manual: KPI active, chips, search, progress bar colors, fade-out |
| Integration | Combobox selection | Manual: type, select, verify event loads |
| E2E | Full filter flow | Manual: select estado + KPI + search + dates, verify chips match |

## Open Questions

- None. All decisions resolved and documented.

## Implementation Order

1. **gastos-kpi-fix** — simplest, 1-line change + label updates (commit 1)
2. **gastos-search** — self-contained input + debounce (commit 2)
3. **gastos-filtering** — KPI click, chips, results count, depends on (2) for combined filters (commit 3)
4. **gastos-progress-bar** — self-contained render + CSS (commit 4)
5. **gastos-combobox** — self-contained input replacement (commit 5)
6. **gastos-form-ux** — sticky footer, concept chips, fade-out (commit 6)
