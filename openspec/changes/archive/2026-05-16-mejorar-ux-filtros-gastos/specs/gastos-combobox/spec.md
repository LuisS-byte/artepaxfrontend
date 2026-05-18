# Gastos — Combobox Spec

## Description

El `<select id="select-evento-gasto">` actual se reemplaza por un `<input>` con `<datalist>` que permite buscar eventos escribiendo, mostrando el formato `[#ID] Cliente - Estado` en las sugerencias. Si el navegador no soporta datalist, cae suavemente al `<select>` tradicional. El filtrado de opciones usa debounce de 300ms para rendimiento con 500+ eventos.

## Requirements

- REQ-1: DEBE reemplazar el `<select>` por un `<input type="text" id="select-evento-gasto" list="evento-list">` + `<datalist id="evento-list">`
- REQ-2: Las opciones DEBEN mostrar formato `[#ID] Cliente - EstadoEvento` (ej: `[#42] María López - CONFIRMADO`)
- REQ-3: Al seleccionar una opción, DEBE llamar `cargarGastosEvento()` con el ID del evento seleccionado
- REQ-4: DEBE usar debounce de 300ms antes de filtrar las opciones del datalist
- REQ-5: DEBE tener fallback: si `!HTMLInputElement.prototype.list`, mantener `<select>` tradicional

## Acceptance Criteria

- [ ] GIVEN usuario escribe "maría" en el input combobox WHEN 300ms pasan THEN datalist muestra solo eventos de clientes cuyo nombre contiene "maría"
- [ ] GIVEN usuario escribe "#42" WHEN 300ms pasan THEN datalist muestra el evento con ID 42
- [ ] GIVEN usuario selecciona una opción del datalist WHEN se dispara el evento THEN se ejecuta `cargarGastosEvento()` con el ID correcto
- [ ] GIVEN navegador sin soporte datalist WHEN página carga THEN se muestra `<select>` tradicional como fallback

## UI States

- Normal: input vacío con placeholder "Buscar evento por ID, cliente..."
- Typing: sugerencias aparecen en datalist dropdown tras debounce
- Selected: input muestra texto `[#42] María López - CONFIRMADO`, valor interno es el ID
- Fallback: `<select>` tradicional visible si datalist no soportado
- Empty results: datalist vacío, sin sugerencias

## Interaction Details

- `oninput` con `debounce(filtrarEventosDatalist, 300)` filtra `GastosState.eventosDisponibles`
- Al hacer `change`, parsea el valor del input para extraer el ID numérico (`regex: /\[#(\d+)\]/`)
- Si el input no coincide con ningún evento conocido, no ejecuta carga
- La población del datalist se hace dinámicamente reconstruyendo `<option>` elements

## Dependencies

- `GastosState.eventosDisponibles` (ya poblado por `cargarEventosParaGastos()`)
- `window.debounce` de `formatters.js`
- No depende de otros specs (autocontenido)
