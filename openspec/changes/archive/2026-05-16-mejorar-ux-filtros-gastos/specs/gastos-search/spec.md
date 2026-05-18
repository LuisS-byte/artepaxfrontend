# Gastos — Search Spec

## Description

Un campo de búsqueda con ícono de lupa y botón de limpiar (×) se agrega a la filter-bar global. La búsqueda filtra la tabla global en tiempo real buscando coincidencias en los campos `gastoConcepto` y `gastoNota` de los gastos visibles con debounce de 300ms, siguiendo el patrón `modulos.bindSearch` existente.

## Requirements

- REQ-1: DEBE existir un `<input type="text">` con id `#search-gasto` y placeholder "Buscar por concepto..." en la filter-bar
- REQ-2: DEBE mostrar un ícono de búsqueda (lucide `search`) dentro del input y un botón × (id `#search-gasto-clear`) que se muestra solo cuando hay texto
- REQ-3: DEBE aplicar debounce de 300ms usando `window.debounce` (ya definido en `formatters.js`)
- REQ-4: DEBE filtrar por coincidencia case-insensitive en `gastoConcepto` y `gastoNota`
- REQ-5: El botón × DEBE limpiar el input y restaurar la tabla sin búsqueda

## Acceptance Criteria

- [ ] GIVEN usuario escribe "transporte" en search WHEN 300ms pasan THEN tabla se filtra mostrando solo gastos con "transporte" en concepto o nota
- [ ] GIVEN search activo WHEN usuario clickea × THEN input se limpia y tabla vuelve a datos completos
- [ ] GIVEN search + KPI filter + fecha filter WHEN todos activos THEN tabla muestra solo gastos que cumplen las 3 condiciones
- [ ] GIVEN búsqueda sin resultados WHEN ejecutada THEN tabla muestra empty state "Sin resultados para tu búsqueda"

## UI States

- Normal: input vacío, ícono lupa visible, × oculto
- Typing: × visible al primer caracter, loading de debounce en curso
- Active: tabla filtrada, × visible, placeholder reemplazado visualmente por término buscado
- Empty Result: tabla con mensaje "No se encontraron gastos para tu búsqueda"

## Interaction Details

- El input usa `oninput` con `debounce(aplicarFiltrosCombinados, 300)`
- El × se muestra/oculta según `input.value.length > 0`
- Se integra con `GastosState.filtroBusqueda` como campo nuevo en state

## Dependencies

- `window.debounce` de `formatters.js`
- Depende de `gastos-filtering` spec (comparten `aplicarFiltrosCombinados()`)
- `GastosState` necesita campo nuevo: `filtroBusqueda` (string)
