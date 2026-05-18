# Documentos Edición Specification

## Purpose
Gestionar la edición segura de las plantillas de documentos utilizando el editor Quill.

## Requirements

### Requirement: Prevención de Pérdida de Datos
The system MUST advertir al usuario si intenta cerrar el modal de edición de plantillas con cambios no guardados.

#### Scenario: Cierre con cambios no guardados
- GIVEN el usuario modificó el contenido del editor Quill
- WHEN hace clic en el botón de cerrar modal, fuera del modal o presiona "Escape"
- THEN el sistema muestra un modal de confirmación preguntando si desea descartar los cambios

#### Scenario: Cierre sin modificaciones
- GIVEN el usuario abrió el modal pero no realizó ningún cambio
- WHEN intenta cerrar el modal
- THEN el modal se cierra inmediatamente sin mostrar advertencia