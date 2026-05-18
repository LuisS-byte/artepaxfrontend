# Documentos Listados Specification

## Purpose
Gestionar la visualización, filtrado y búsqueda de documentos generados tanto a nivel global como a nivel de evento.

## Requirements

### Requirement: Filtrado Global de Documentos
The system MUST permitir al usuario filtrar el listado global de documentos por estado de envío y buscar por cliente o ID de evento.

#### Scenario: Búsqueda por cliente
- GIVEN el usuario se encuentra en la pestaña "Listado Global"
- WHEN ingresa el nombre "Pérez" en el campo de búsqueda
- THEN la tabla se actualiza mostrando solo los documentos asociados al cliente "Pérez"
- AND el contador de resultados muestra el total de documentos encontrados

#### Scenario: Filtrado combinado
- GIVEN el usuario se encuentra en la pestaña "Listado Global"
- WHEN selecciona el estado "FALLIDO" y busca "Casamiento"
- THEN la tabla muestra documentos que cumplen ambas condiciones
- AND se renderizan los chips de filtros activos ("FALLIDO", "Casamiento")

### Requirement: Selector de Eventos Escalable
The system SHOULD usar un componente de autocompletado para el selector de eventos, permitiendo la selección eficiente entre gran cantidad de eventos.

#### Scenario: Búsqueda de evento por nombre
- GIVEN el usuario está en la vista "Por Evento"
- WHEN despliega el selector de eventos y escribe "Juan"
- THEN el selector filtra y muestra únicamente los eventos de "Juan"

### Requirement: Previsualización de Documento
The system MAY ofrecer la opción de previsualizar el documento generado si la API retorna una URL accesible.

#### Scenario: Documento con URL disponible
- GIVEN un documento que posee la propiedad `url` válida
- WHEN el usuario hace clic en "Ver PDF"
- THEN el sistema abre la URL en una nueva pestaña

#### Scenario: Documento sin URL disponible
- GIVEN un documento que no posee URL en la respuesta de la API
- THEN el botón "Ver PDF" no se muestra en la interfaz