# Delta for Gastos — Combobox

## REMOVED Requirements

### Requirement: REQ-1 — Input con datalist para selección de eventos

(Reason: Reemplazado completamente por `gastos-control-cola`. El combobox de búsqueda ciega se elimina; la nueva cola visual de eventos con split layout provee selección visual directa sin necesidad de escribir para encontrar un evento.)

El `<input type="text" id="select-evento-gasto" list="evento-list">` con `<datalist id="evento-list">` DEBE ser eliminado. Todo el markup HTML, JS de inicialización y CSS asociado DEBEN ser removidos del código.

#### Scenario: Combobox already removed

- GIVEN la pestaña "Control de egresos" carga
- WHEN se inspecciona el DOM
- THEN no existe ningún elemento con id `select-evento-gasto` ni `evento-list`
- AND no existe el `<select id="select-evento-gasto">` de fallback

### Requirement: REQ-2 — Formato de opciones `[#ID] Cliente - Estado`

(Reason: Reemplazado por items visuales en la cola que muestran cliente, ID, estado badge, fecha, ubicación y montos. No se necesita un formato de texto plano para autocompletado.)

### Requirement: REQ-3 — Selección llama `cargarGastosEvento()`

(Reason: Reemplazado por `seleccionarEventoCola()` que llama internamente a la misma lógica de carga. El flujo ahora es click en la cola en lugar de selección en combobox.)

### Requirement: REQ-4 — Debounce 300ms en datalist

(Reason: El debounce ahora se aplica al campo de búsqueda de la cola (`egresos-queue`), siguiendo el patrón de `pagos.cobranza.js`. Funcionalidad similar pero en nuevo contexto.)

### Requirement: REQ-5 — Fallback `<select>` tradicional

(Reason: Ya no es necesario. La cola es markup estático (botones), no depende de soporte de datalist del navegador.)

## Removed Code Artifacts

| Artifact | Location | Action |
|----------|----------|--------|
| `<input id="select-evento-gasto">` | `gastos.html` | Remove |
| `<datalist id="evento-list">` | `gastos.html` | Remove |
| `<select id="select-evento-gasto">` | `gastos.html` | Remove |
| `filtrarEventosDatalist()` | `gastos.js` | Remove |
| `cargarEventosParaGastos()` (si existe como wrapper del combobox) | `gastos.js` | Remove |
| `.combobox-evento-gasto` CSS | `gastos.css` | Remove |
