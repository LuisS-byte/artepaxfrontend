# Gastos — Form UX Spec

## Description

Tres mejoras en el drawer de registro de gasto: (1) sticky footer que mantiene los botones visibles al scrollear, (2) chips de conceptos sugeridos ([Flete], [Comida], [Material], [Decoración], [Transporte]) que aparecen debajo del input-concepto al enfocarlo y al clickearlo insertan el texto, (3) animación fade-out de 300ms al eliminar un gasto antes de remover la fila del DOM.

## Requirements

- REQ-1: `.drawer-footer` DEBE tener `position: sticky; bottom: 0` dentro del drawer para mantener botones visibles al scrollear (solo en viewport >600px)
- REQ-2: Chips de conceptos DEBEN renderizarse en `#concept-chips` debajo del input-concepto, solo visibles cuando el input está enfocado (`:focus` dentro del contenedor)
- REQ-3: Click en un chip DEBE insertar su texto en `#input-concepto` y mantener el foco en el input
- REQ-4: Cada chip DEBE ser un `<button type="button" class="concept-chip" data-concepto="Flete">[Flete]</button>` para accesibilidad (Enter/Espacio para activar)
- REQ-5: Al eliminar un gasto (vía `confirmarAccionGasto`), la fila DEBE recibir clase `.fade-out` por 300ms antes de removerse del DOM (mediante listener `transitionend`)

## Acceptance Criteria

- [ ] GIVEN drawer abierto con contenido largo WHEN usuario scrollea THEN footer permanece visible al final del viewport
- [ ] GIVEN input-concepto enfocado WHEN usuario clickea chip [Flete] THEN input muestra "Flete" y chips siguen visibles
- [ ] GIVEN usuario presiona Enter en chip [Comida] WHEN activo THEN input muestra "Comida"
- [ ] GIVEN usuario clickea Eliminar en tabla WHEN modal se confirma THEN fila obtiene clase fade-out, tras 300ms desaparece del DOM
- [ ] GIVEN viewport <600px WHEN drawer abierto THEN footer no es sticky (flujo normal)

## UI States

- Drawer normal: footer al fondo, scroll normal
- Drawer scrolled: footer pegado al fondo visible
- Input focused: chips visibles debajo del input
- Input blurred: chips ocultos (con delay 150ms para permitir click)
- Deleting row: fila con opacidad 0 → 300ms → removida

## Interaction Details

- Chips: `onfocus` del input muestra chips, `onblur` los oculta con `setTimeout(150ms)` para dar tiempo al click
- Fade-out: `row.classList.add('fade-out')`, luego `row.addEventListener('transitionend', () => row.remove(), { once: true })`
- CSS: `.fade-out { opacity: 0; transition: opacity 0.3s ease; }`
- Sticky footer: `.drawer-footer { position: sticky; bottom: 0; }` con `@media (max-width: 600px) { .drawer-footer { position: static; } }`

## Dependencies

- Depende de `gastos.actions.js` → `confirmarAccionGasto()` y `abrirDrawerGasto()`
- CSS en `gastos-drawer.css`
- No depende de otros specs
