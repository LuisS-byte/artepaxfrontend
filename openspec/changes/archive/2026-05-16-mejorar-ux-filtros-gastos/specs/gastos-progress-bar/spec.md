# Gastos — Progress Bar Spec

## Description

Una barra de progreso visual debajo de las 3 finance cards en la vista "Por evento" muestra la relación porcentual entre total desembolsado y total proyectado. Usa colores semánticos: verde cuando ≥70% desembolsado, naranja entre 1-69%, gris cuando 0%. La transición CSS anima el cambio de ancho al recargar o al registrar/desembolsar gastos.

## Requirements

- REQ-1: DEBE existir un contenedor `#progress-bar-container` dentro de `.event-finance-grid` con una barra interna `.progress-bar-fill` cuyo width refleje el porcentaje calculado
- REQ-2: El porcentaje DEBE calcularse como `(totalDesembolsado / totalProyectado) * 100` usando los valores ya disponibles en `GastosState.resumenEventoActual`
- REQ-3: DEBE tener 3 estados visuales: `progress-empty` (0% — gris), `progress-warning` (1-69% — naranja), `progress-ok` (70-100% — verde)
- REQ-4: DEBE animar con transición CSS `width 0.4s ease` al cambiar el valor
- REQ-5: Zero state: cuando `totalProyectado === 0`, mostrar barra vacía con texto "Sin gastos proyectados"

## Acceptance Criteria

- [ ] GIVEN evento con $1000 proyectado y $700 desembolsado WHEN se carga vista THEN barra muestra 70% con clase `progress-ok`
- [ ] GIVEN evento con $1000 proyectado y $300 desembolsado WHEN se carga vista THEN barra muestra 30% con clase `progress-warning`
- [ ] GIVEN evento con $0 proyectado WHEN se carga vista THEN barra muestra 0% con clase `progress-empty` y texto "Sin gastos proyectados"
- [ ] GIVEN evento con $1000 proyectado y $1000 desembolsado WHEN se carga vista THEN barra muestra 100% con clase `progress-ok`

## UI States

- Loaded with data: barra visible con ancho y color correspondiente
- Zero state: barra vacía, texto "Sin gastos proyectados", gris
- Loading: skeleton placeholder mientras se cargan los datos del evento

## Interaction Details

- Se renderiza desde `GastosRender.renderProgressBar()` llamada desde `renderResumenEventoSeleccionado()`
- Se actualiza automáticamente cuando se registra o desembolsa un gasto (via `recargarVistaActiva()`)

## Dependencies

- Depende de `GastosState.resumenEventoActual` (poblado por `GastosHelpers.calcularTotales()`)
- CSS en `gastos-summary.css`
