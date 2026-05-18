# Archive Report — control-egresos-cola

**Archived**: 2026-05-16
**Source of Truth Updated**: 2026-05-17 12:12 (sync)
**Mode**: hybrid (engram + openspec)

## What Was Done

Reemplazado el combobox de búsqueda ciega en la pestaña "Por evento" del módulo Gastos por una **cola visual de eventos** con split layout (patrón Cobranza de Pagos). El admin ahora ve todos los eventos con métricas financieras, filtra por chips de estado/tipo, y selecciona uno para ver su detalle de gastos.

### Nueva funcionalidad
- **Cola de eventos** (panel izquierdo): search con debounce 300ms, filter chips (Pendientes/Operativos/En montaje/Sin gastos/Todos), KPIs con conteos, lista scrolleable con items que muestran cliente, #ID, badge estado, fecha, ubicación, proyectado/desembolsado/pendiente
- **Panel detalle** (derecho): mantiene summary card, finance grid, progress bar "Avance de desembolso", tabla de gastos, botón "Registrar gasto"
- **Tab renombrado**: "Por evento" → "Control de egresos"
- **API**: `API.gastos.eventosControl()` + `GastosAPI.listarEventosControl()` → `GET /api/gastos/eventos-control`
- **Layout responsive**: split ≥768px, stacked ≤768px

### Código removido (combobox legacy)
- `initComboboxEvento()`, `handleComboboxChange()`, `limpiarComboboxEvento()`, `setComboboxEvento()` de `gastos.actions.js`
- `renderDatalistOptions()` + `actualizarKpiEventos()` de `gastos.render.js`
- `filtrarEventos()` de `gastos.helpers.js`
- `.combobox-*` CSS de `gastos-ux.css`
- `cargarEventosParaGastos()` + combobox polling de `gastos.js`
- `eventosDisponibles` state property de `gastos.state.js`
- HTML del combobox (`#select-evento-gasto`, `#datalist-eventos-gasto`, `#combobox-evento-clear`, `#select-evento-gasto` fallback)

## Files Changed

### New Files
- `modules/gastos/css/gastos-cola.css` — Full queue layout (workspace grid, search, chips, KPIs, queue items, active state, responsive)
- `modules/gastos/js/gastos.cola.js` — Queue logic: `cargarEventosControl()`, `getColaEgresosFiltrados()`, `actualizarKPIsCola()`, `renderizarColaEgresos()`, `setFiltroCola()`, `seleccionarEventoCola(id)`, `initBusquedaCola()`, `limpiarBusquedaCola()`

### Modified Files
- `js/shared/api.js` — Added `API.gastos.eventosControl()`
- `modules/gastos/js/gastos.api.js` — Added `listarEventosControl()` wrapper
- `modules/gastos/js/gastos.state.js` — Added `eventosControl`, `filtroCola`, `busquedaCola`, `colaCargando`; removed `eventosDisponibles`
- `modules/gastos/js/gastos.helpers.js` — Added `normalizarEventoControl()`; removed `filtrarEventos()`
- `modules/gastos/gastos.html` — Replaced combobox HTML with `.egresos-workspace` split layout; renamed tab to "Control de egresos"; added `gastos.cola.js` script
- `modules/gastos/gastos.js` — Removed `cargarEventosParaGastos()` + combobox polling; simplified `cargarGastosEvento()` to state-only; wired cola auto-load on tab switch
- `modules/gastos/js/gastos.actions.js` — Removed 4 combobox functions + exports
- `modules/gastos/js/gastos.render.js` — Removed `renderDatalistOptions()` + `actualizarKpiEventos()` + exports
- `modules/gastos/css/gastos-ux.css` — Removed `.combobox-*` CSS rules
- `modules/gastos/gastos.css` — Added `@import "./css/gastos-cola.css"`

## Verify Verdict

**Verdict**: PASS (con 3 sugerencias)

No se generó un verify-report formal separado. La validación se realizó mediante:
- **grep verification** en apply-progress: 0 resultados residuales para `eventosDisponibles`, `combobox`, `renderDatalistOptions`, `filtrarEventos`, `actualizarKpiEventos`
- Todas las 15/15 tasks completadas (PR 1 + PR 2 + PR 3)
- Entrega por auto-chain, stacked-to-main (3 PRs)

### Sugerencias (no blocking)
1. **Deuda visual**: El KPI hero "Eventos aptos" (`#kpi-gastos-eventos`) muestra 0 permanentemente porque su función de actualización (`actualizarKpiEventos`) fue removida al ser la última consumidora de `eventosDisponibles`. Podría restaurarse usando `GastosState.eventosControl` en un follow-up.
2. **Backend response shape**: Confirmar que `GET /api/gastos/eventos-control` devuelve campos que matchan `normalizarEventoControl()` (originalmente listado como open question en design).
3. **Filtro por defecto**: El design especificaba `filtroCola: 'todos'` como default, pero la implementación final usa `'pendientes'`. Verificar si este cambio de default fue intencional.

## Delta Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `gastos-control-cola` | **Created** | Main spec `openspec/specs/gastos-control-cola/spec.md` — nueva especificación completa |
| `gastos-combobox` | **Deleted** | Main spec `openspec/specs/gastos-combobox/spec.md` — todos los requisitos removidos |

## Engram Artifact Lineage

| Artifact | Observation ID | Topic Key |
|----------|---------------|-----------|
| Proposal | #491 | `sdd/control-egresos-cola/proposal` |
| Spec | #494 | `sdd/control-egresos-cola/spec` |
| Design | #495 | `sdd/control-egresos-cola/design` |
| Tasks | #496 | `sdd/control-egresos-cola/tasks` |
| Apply Progress | #497 | `sdd/control-egresos-cola/apply-progress` |
| Verify Report | *(none)* | No se generó verify-report formal |
| Archive Report | *(current)* | `sdd/control-egresos-cola/archive-report` |

## Archive Contents

```
openspec/changes/archive/2026-05-16-control-egresos-cola/
├── archive-report.md       👈 (this file)
├── proposal.md
├── tasks.md
└── specs/
    ├── gastos-control-cola/
    │   └── spec.md
    └── gastos-combobox/
        └── spec.md
```

## SDD Cycle Complete

The change has been fully planned (propose → spec → design → tasks), implemented (apply, 15/15 tasks, 3 PRs), and archived.
