## Exploration: Mejorar UX de Calendarios e Inputs de Fecha/Hora

### Current State
Actualmente, el sistema utiliza inputs nativos de HTML5 (`<input type="date">`, `<input type="time">`, `<input type="datetime-local">`). 
Esto presenta varios problemas de UX:
1. **Inconsistencia Visual**: Los navegadores renderizan estos inputs de forma muy diferente (Chrome vs Safari vs Firefox).
2. **UX Pobre en Escritorio**: La selección de meses/años o la escritura manual suele ser tosca.
3. **Falta de Restricciones Visuales**: No se pueden deshabilitar fechas pasadas o fines de semana de forma intuitiva sin lógica pesada en JS.

### Affected Areas
La búsqueda en el código revela 13 instancias de estos inputs distribuidos en funciones de filtrado y formularios de creación:
- `modules/pagos/pagos.html` — Filtros `fecha-desde` y `fecha-hasta`.
- `modules/inventario/inventario.html` — Filtros `fecha-desde` y `fecha-hasta`.
- `modules/gastos/gastos.html` — Filtros `fecha-desde` y `fecha-hasta`.
- `modules/eventos/eventos.html` — Formulario de evento (`input-fecha`, `input-hora-inicio`, `input-hora-fin`).
- `modules/cronograma/cronograma.html` — Filtros y formulario de tareas (`input-fecha-inicio`, `input-fecha-fin`).

### Approaches

1. **Native Inputs con CSS (Rechazado)**
   - Pros: Cero dependencias extra.
   - Cons: Imposible igualar la experiencia entre navegadores.
   - Effort: Low.

2. **Integrar Flatpickr (Recomendado)**
   - Pros: Ligero, sin dependencias (Vanilla JS), altamente personalizable, soporte para rangos de fechas, modo 24h, y fácil inyección de estilos de la marca (`--primary`).
   - Cons: Requiere añadir un script global y actualizar la lógica de limpieza de formularios (`modulos.limpiarForm`).
   - Effort: Medium.

### Recommendation
**Integrar Flatpickr** como la librería estándar del sistema para la selección de fechas.
Se debe agregar a `index.html` vía CDN (JS y CSS), crear una configuración global en español dentro de `modulos.js`, y luego instanciarlo en los inputs afectados. Se deberá modificar `modulos.limpiarForm` para que maneje correctamente la limpieza de instancias de Flatpickr.

### Risks
- `modulos.limpiarForm` actualmente usa `input.value = ''`. Con Flatpickr, es mejor usar el método `clear()` de la instancia, por lo que habrá que hacer un pequeño ajuste en `modulos.js` para detectar si el input es un Flatpickr.
- Las funciones de `onchange="cargarPagosGlobales()"` en los filtros deben ser compatibles con el evento `onChange` de Flatpickr.

### Ready for Proposal
Yes. Podemos proceder a armar la propuesta y diseño técnico para inyectar Flatpickr.
