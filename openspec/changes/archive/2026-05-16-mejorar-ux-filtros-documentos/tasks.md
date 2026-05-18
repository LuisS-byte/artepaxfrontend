# Tasks: Mejorar UX Filtros Documentos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Combobox de Eventos

- [x] 1.1 `documentos.html`: Reemplazar `<select id="select-evento-doc">` por un input text con `<datalist id="datalist-evento-doc">`.
- [x] 1.2 `documentos.js`: Actualizar lógica en `cargarEventosParaDocs` para poblar el `<datalist>` en lugar del select.
- [x] 1.3 `documentos.js`: Actualizar event listener del combobox para disparar `cargarDocumentosEvento` cuando cambie el input (validando que exista el ID).

## Phase 2: Filtros Globales de Documentos

- [x] 2.1 `documentos.html`: Añadir div `.filter-bar` en `#view-global` con input text para búsqueda y select para estadoEnvio.
- [x] 2.2 `js/documentos.state.js`: Declarar objeto `filtrosGlobales: { query: '', estado: 'todos' }`.
- [x] 2.3 `documentos.js`: Configurar event listeners (oninput con debounce para búsqueda, onchange para estado) mutando el estado.
- [x] 2.4 `documentos.js`: Modificar `cargarDocumentosGlobales` para aplicar `filtrosGlobales` a `DocumentosState.documentosGlobalesBase` antes de pasarlo a la paginación local o enviarlo en params si la API lo permite (implementación default: client-side actual-page filter).

## Phase 3: Botón de Previsualización (Ver PDF)

- [x] 3.1 `js/documentos.actions.js`: Crear método `abrirPrevisualizacionPdf(url)` que abra una nueva pestaña.
- [x] 3.2 `js/documentos.render.js`: En `COLUMNAS_DOCS` y `COLUMNAS_DOCS_GLOBAL`, modificar el renderizado de la columna 'Acciones' para chequear si existe `row.pdfUrl` o `row.url`, y agregar botón "Ver PDF".

## Phase 4: Prevención de Pérdida en Quill

- [x] 4.1 `js/documentos.state.js`: Añadir flag `formularioModificado: false`.
- [x] 4.2 `documentos.html`: Agregar `<div id="modal-descartar-cambios">` (copiado del de eventos).
- [x] 4.3 `js/documentos.editor.js`: Agregar callback al evento `text-change` de Quill para cambiar flag a `true`. Resetear flag al guardar correctamente.
- [x] 4.4 `js/documentos.editor.js`: Interceptar función `cerrarModalPlantilla`. Si `formularioModificado` es true, abrir `modal-descartar-cambios` en su lugar.
- [x] 4.5 `js/documentos.editor.js`: Implementar `confirmarDescartePlantilla()` (cierra edit) y `cancelarDescartePlantilla()` (cierra modal adv).