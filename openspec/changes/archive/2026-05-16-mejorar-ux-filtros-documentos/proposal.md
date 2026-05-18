# Proposal: Mejorar UX Filtros Documentos

## Intent

Mejorar la usabilidad del módulo de Documentos para permitir escalabilidad a medida que el sistema crezca. Actualmente carece de filtros globales, usa un select nativo ineficiente para eventos, el editor Quill es propenso a pérdida de datos, y no hay feedback de vista previa en PDFs.

## Scope

### In Scope
- Barra de búsqueda y filtros en la vista global de documentos (Search Input, Filtro por Estado, Contador de resultados).
- Selector de eventos basado en combobox/autocomplete.
- Modal de confirmación de descarte de cambios en el editor de plantillas.
- Funcionalidad de "Ver PDF" si el backend provee la URL.

### Out of Scope
- Migrar el stack a un framework moderno.
- Cambiar la librería Quill por otra.
- Reestructurar el layout general del dashboard.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `documentos-listados`: Incorporación de filtros de búsqueda, estado y previsualización.
- `documentos-edicion`: Protección contra cierre accidental del modal de Quill.

## Approach

1. **Filtros Globales:** Implementar `filter-bar` y `search-box` copiando el HTML/CSS de Eventos. Añadir la lógica al `documentos.filters.js` (si no existe, integrarlo a `documentos.js` o separar módulo).
2. **Select de Eventos:** Reemplazar `<select>` por un componente `<input>` que filtre dinámicamente un `datalist` o construya un dropdown custom `div`.
3. **Descarte Quill:** Escuchar cambios en `DocumentosState.plantillaEditando`. Interceptar clicks de cierre del modal para invocar confirmación.
4. **Ver PDF:** Chequear si la API retorna campo `pdfUrl`. Si existe, renderizar un botón extra en la tabla que haga `window.open(url, '_blank')`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `documentos.html` | Modified | Nuevos campos de UI. |
| `js/documentos.state.js` | Modified | Estado de filtros y track de descarte. |
| `js/documentos.actions.js` | Modified | Lógica de previsualización. |
| `js/documentos.editor.js` | Modified | Lógica confirmación descarte. |
| `js/documentos.render.js` | Modified | Botón de preview y chips. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Combobox Vanilla JS complejo o inaccesible | Med | Usar `datalist` nativo en primera instancia, si no probar con un dropdown custom simple y testeado. |
| API sin previsualización | High | Condicionar la UI a la existencia de la URL en el objeto documento. |

## Rollback Plan

Revertir los cambios en los archivos afectados usando control de versiones (`git restore modules/documentos`). No requiere rollback de base de datos o backend.

## Dependencies

- API de Backend (para soporte de preview).

## Success Criteria

- [ ] Los usuarios pueden buscar documentos por cliente o ID.
- [ ] El selector de eventos soporta búsqueda tipeada.
- [ ] El editor alerta antes de perder trabajo.
- [ ] Muestra el total de documentos filtrados en la vista global.