# Design: Mejorar UX Filtros Documentos

## Technical Approach

La implementación se alinea con la arquitectura Vanilla JS (sin frameworks) y la estructura de archivos en fases (api, state, render, actions, etc.). Se integrarán componentes UI personalizados para los filtros y el selector de eventos, control del estado de descarte en el editor Quill, y comprobación condicional para la previsualización del documento.

## Architecture Decisions

### Decision: Filtrado Global (Cliente/Backend)

**Choice**: Filtrado de documentos a nivel cliente sobre los resultados paginados, o enviar parámetros al backend si la API lo soporta.
**Alternatives considered**: Backend-only search vs Client-only search de la página actual.
**Rationale**: Como Gastos filtra la "página actual" (`gastosGlobalesBase.filter`), si la API no soporta query de búsqueda (`q` o `cliente`), implementaremos el filtrado sobre el array cargado de la página actual. Si la API lo permite, inyectamos los parámetros en `params`.

### Decision: Selector de Eventos (Combobox Custom)

**Choice**: Input text con lista flotante customizada (Vanilla JS).
**Alternatives considered**: `datalist` nativo HTML5.
**Rationale**: `datalist` no permite estilar las opciones ni la caja de selección y se comporta inconsistente entre navegadores. Un input que renderice `div`s relativos es mantenible y reutilizable.

### Decision: Tracker de Cambios en Quill

**Choice**: Escuchar evento `text-change` de Quill y mutar `DocumentosState.formularioModificado`.
**Alternatives considered**: Comparar el innerHTML inicial con el final al cerrar.
**Rationale**: El evento de Quill es nativo de la librería y menos costoso que parsear DOM en cada intento de cierre. Sigue el estándar de `formularioModificado` usado en Eventos.

## Data Flow

    [Input Búsqueda / Select Estado] 
         │ (on input/change)
         ▼
    DocumentosState.filtrosGlobales
         │
         ▼
    filtrarDocumentosGlobales() (filtrado local o fetch API)
         │
         ▼
    DocumentosRender.renderTabla()

    [Editor Quill] ── text-change ──▶ DocumentosState.formularioModificado = true
         │
    [Boton Cerrar] ── evalúa ──▶ Si true: mostrar modalConfirmacion
                             ──▶ Si false: cerrarModal()

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `documentos.html` | Modify | Añadir `filter-bar` en view-global, cambiar `<select id="select-evento-doc">` por input custom combobox, añadir modal de descarte de cambios. |
| `js/documentos.state.js` | Modify | Añadir `filtrosGlobales` (query, estado) y `formularioModificado`. |
| `js/documentos.actions.js` | Modify | Lógica para confirmar descarte y abrir visor PDF (`window.open`). |
| `js/documentos.editor.js` | Modify | Integrar listener `text-change` de Quill, resetear estado al guardar. |
| `js/documentos.render.js` | Modify | Añadir render de `filter-bar` activo, botón "Ver PDF" en la tabla si el DTO tiene URL, y el renderizado dinámico de la lista del Combobox. |
| `documentos.js` | Modify | Enganche de los event listeners del buscador, estado y combobox. |

## Interfaces / Contracts

```javascript
// Nuevo estado
DocumentosState.filtrosGlobales = { query: '', estado: 'todos' };
DocumentosState.formularioModificado = false;

// Nuevo action de descarte
window.confirmarDescartePlantilla = function() { ... }
window.cancelarDescartePlantilla = function() { ... }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | State Mutación | Ver que los filtros se apliquen correctamente a la data mockeada localmente (Testing manual). |
| Integration | Descarte de Quill | Escribir en Quill -> Apretar cerrar -> Asegurar que el modal frena la acción. Cancelar y asegurar que el modal se cierra y el texto sigue ahí. |
| E2E | Flujo Búsqueda | Ingresar texto en search global -> Validar que la tabla reaccione o la API se llame. |

## Migration / Rollout
No migration required. Cambios UI/UX locales que no rompen el contrato actual con el backend.

## Open Questions
- [ ] ¿La API de `documentos.list` soporta parámetros como `cliente` o `query` y `estadoEnvio`? Si no, se filtra solo la página actual como en Gastos.
- [ ] ¿El backend retorna el binario o un `pdfUrl` en el listado de documentos? Esto condicionará el botón "Ver PDF".