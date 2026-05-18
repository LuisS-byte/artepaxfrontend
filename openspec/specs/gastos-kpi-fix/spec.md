# Gastos — KPI Calculation Fix Spec

## Description

Corrige la función `actualizarResumenGlobal()` que actualmente calcula los KPIs globales sobre `GastosState.gastosGlobales` (subset filtrado por estado/fecha) cuando DEBERÍA calcularlos sobre `GastosState.gastosGlobalesBase` (datos completos del backend). Si se decide mantener el comportamiento actual (totales de página filtrada), el label de cada KPI card debe modificarse para decir claramente "Totales de esta página" en vez del genérico "Página global actual".

## Requirements

- REQ-1: `actualizarResumenGlobal()` DEBE calcular totales sobre `GastosState.gastosGlobalesBase` si la intención es mostrar totales globales reales, O BIEN cambiar los labels de las KPI cards a "Totales filtrados" si se mantiene el subset
- REQ-2: Los labels de pie de KPI card DEBEN reflejar exactamente qué datos representan: "Total global" si base, "Totales de página actual" si subset
- REQ-3: Los KPIs DEBEN actualizarse después de cada `cargarGastosGlobales()` (como ahora) pero con la fuente de datos correcta
- REQ-4: NO DEBE cambiar el contrato de `calcularTotales()` — solo cambia qué array se le pasa

## Acceptance Criteria

- [ ] GIVEN backend devuelve 500 gastos totales, filter muestra 50 WHEN KPIs se renderizan THEN montos reflejan los 500 (base) si se elige global, O 50 con label "Totales de página actual"
- [ ] GIVEN usuario aplica filtro por estado WHEN KPIs se actualizan THEN KPIs no cambian (si base) O cambian (si subset con label correcto)
- [ ] GIVEN ningún filtro activo WHEN tabla muestra todos los gastos THEN KPIs son idénticos en ambos modos (base === subset)

## UI States

- Normal: KPIs con valores correctos según decisión de diseño
- Loading: KPIs muestran valores previos mientras nueva data carga (sin cambio en este spec)

## Interaction Details

- Cambio de 1 línea en `gastos.render.js`:
  - Opción A: `calcularTotales(GastosState.gastosGlobalesBase)` + labels actualizados
  - Opción B: solo labels actualizados a "Totales de página actual" si se mantiene `gastosGlobales`
- Labels en HTML: editar los `.gastos-kpi-foot` de cada card en `gastos.html`

## Dependencies

- `GastosRender.actualizarResumenGlobal()` en `gastos.render.js`
- KPI cards HTML en `gastos.html`
- No depende de otros specs
