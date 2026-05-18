## Exploration: Mejorar UX Filtros Documentos

### Current State
El módulo de Documentos está muy bien estructurado (MVC/Flux), pero carece de usabilidad en puntos clave para escalar:
1. La vista global de documentos lista los registros con paginación pero no permite filtrarlos ni buscarlos.
2. El selector de eventos (`select-evento-doc`) carga todos los eventos activos de golpe, ineficiente para más de 50 registros.
3. El editor de plantillas (Quill) no frena al usuario si intenta cerrar el modal con cambios no guardados.
4. No hay un botón de previsualización (Ver PDF) en la tabla de documentos, lo cual hace el reenvío a ciegas.

### Affected Areas
- `modules/documentos/documentos.html` — Nuevos inputs de búsqueda/filtros, modal de confirmación de descarte, nuevo datalist/combobox para selector.
- `modules/documentos/js/documentos.state.js` — Nuevo estado para filtros globales (`filtrosGlobales`).
- `modules/documentos/js/documentos.actions.js` — Funciones de previsualización y manejo de filtros.
- `modules/documentos/js/documentos.render.js` — Renderizado de chips de filtro y acciones (Botón Ver PDF).
- `modules/documentos/documentos.js` — Funciones integradoras para aplicar filtros y descarte de modal de plantilla.
- `modules/documentos/js/documentos.editor.js` — Control de estado "modificado" del editor y confirmación al cerrar modal.
- `modules/documentos/css/documentos-content.css` — Estilos para `filter-bar` global (reutilizable de otros módulos).

### Approaches

1. **Implementación de Filtros y Combobox Nativos**
   - Pros: Sigue el patrón Vanilla JS sin librerías de terceros (mantenemos stack actual). Se reutilizan clases CSS existentes (`filter-bar`, `search-box`). Combobox mediante `datalist` y `input` nativo o un componente JS liviano y rápido.
   - Cons: Combobox nativo `datalist` es feo en Safari/Firefox. Desarrollar un combobox custom en Vanilla requiere tiempo.
   - Effort: Medium

2. **Previsualización de Documento**
   - Pros: Añadir acción de previsualizar antes de reenviar brinda seguridad al usuario.
   - Cons: Depende de que la API retorne una URL del archivo (`pdfUrl` o similar) o sirva el binario. Si el backend no provee esto, no se podrá hacer.
   - Effort: Low/Medium (dependiendo del backend)

3. **Protección de Descarte en Quill**
   - Pros: Previene pérdida de datos accidental. Patrón ya validado en el formulario de Eventos.
   - Cons: Hay que trackear los eventos `text-change` de Quill.
   - Effort: Low

### Recommendation
Adoptar **Implementación de Filtros y Combobox Custom** siguiendo los estándares del módulo de Eventos. El Combobox debería armarse con JavaScript Vanilla (un input con un dropdown flotante) que busque asincrónicamente o filtre sobre el state, ya que `datalist` tiene limitaciones de UI. La **Protección de Descarte** en Quill debe igualarse al modal "Descartar cambios" ya existente en Eventos. Sobre la **Previsualización**, se añadirá el botón "Ver PDF" condicionado a que el objeto documento cuente con una URL accesible.

### Risks
- Construir un Combobox accesible en Vanilla JS puede requerir más trabajo que un `<select>`.
- El botón de "Ver PDF" depende exclusivamente del backend.
- Modificar el flujo de paginación global con filtros implicará resetear la página a 0 cada vez que se busca.

### Ready for Proposal
Yes. The problem is well understood and patterns exist in `modules/eventos` and `modules/gastos` to borrow from.