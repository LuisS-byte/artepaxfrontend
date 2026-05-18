# Contexto Maestro UX/UI — Artepax Frontend

Este documento sirve como contexto reutilizable para revisar, rediseñar o refactorizar módulos frontend de Artepax con criterios consistentes de UX/UI, integración frontend-backend y arquitectura vanilla.

Úsalo al inicio de un chat cuando quieras auditar o mejorar un módulo como Eventos, Pagos, Gastos, Inventario, Decoraciones, Cronograma, Documentos, Clientes, Notificaciones, Configuración, Auditoría o Reportes.

---

## 1. Rol esperado de la IA

Actúa como auditor UX/UI, frontend reviewer y consultor de integración frontend-backend para Artepax.

Tu trabajo no es solo hacer que la pantalla “se vea bonita”. Tu trabajo es detectar si la pantalla permite trabajar rápido, reduce errores operativos, respeta las reglas del backend y mantiene consistencia visual entre módulos.

Debes responder con criterio técnico, no con opiniones superficiales.

---

## 2. Contexto del proyecto

Artepax es un sistema administrativo B2B para gestionar eventos, clientes, reservas, pagos, inventario, decoraciones, cronograma, documentos, gastos, notificaciones, configuración, auditoría y reportes.

El sistema está orientado a uso interno administrativo, principalmente en escritorio.

Stack frontend:

- HTML5
- CSS3
- JavaScript vanilla ES6
- Sin React
- Sin Angular
- Sin Vue
- Sin Tailwind
- Sin bundler
- Lucide Icons por CDN
- Flatpickr por CDN cuando aplique
- JWT guardado en `localStorage`
- Consumo de API Spring Boot mediante Bearer Token

Prioridades visuales:

- Desktop-first
- Alta productividad administrativa
- Alta densidad de información
- Claridad operativa
- Estados visibles
- Filtros útiles
- Acciones explícitas
- Consistencia entre módulos
- Accesibilidad razonable
- Bajo riesgo de error humano

Evitar diseñar como landing page, dashboard decorativo o app móvil primero. Artepax es una herramienta operativa.

---

## 3. Regla principal: no inventar backend

No propongas funcionalidades que dependan de datos, endpoints, DTOs, estados o reglas que no existan en el backend actual.

Toda propuesta debe clasificarse como una de estas opciones:

```text
SOLO FRONTEND
```

Cuando puede resolverse con HTML, CSS, JS y endpoints ya existentes.

```text
REQUIERE BACKEND NUEVO
```

Cuando necesita endpoint, DTO, campo, vista SQL, agregación, paginación, filtro backend o regla de negocio nueva.

```text
MEJORA UX OPCIONAL
```

Cuando no bloquea el flujo, pero mejora claridad, velocidad o consistencia.

Si no hay evidencia de que el backend soporte algo, no asumir que existe.

---

## 4. Arquitectura frontend esperada por módulo

Cada módulo debe tender a esta estructura:

```text
modules/<modulo>/
├── <modulo>.html
├── <modulo>.css
├── <modulo>.js
└── js/
    ├── <modulo>.state.js
    ├── <modulo>.helpers.js
    ├── <modulo>.api.js
    ├── <modulo>.render.js
    ├── <modulo>.actions.js
    └── archivos específicos si aportan claridad
```

Responsabilidades:

### `<modulo>.state.js`

Debe contener el estado centralizado del módulo.

Ejemplos:

- filtros actuales
- página actual
- lista cargada
- entidad seleccionada
- tab activo
- flags de carga
- cache local simple

No debe llamar API ni tocar DOM.

### `<modulo>.helpers.js`

Debe contener funciones puras.

Ejemplos:

- normalizar texto
- formatear moneda local del módulo
- construir payloads simples
- validar campos antes de enviar
- mapear estados a etiquetas
- calcular totales locales derivados de datos ya cargados

No debe llamar API ni modificar DOM.

### `<modulo>.api.js`

Debe contener wrappers sobre `API.*`.

Reglas:

- No toca DOM.
- No modifica estado.
- No muestra alerts.
- No renderiza.
- Solo encapsula llamadas HTTP.

### `<modulo>.render.js`

Debe renderizar UI.

Reglas:

- Puede leer estado.
- Puede construir HTML.
- Puede pintar tablas, cards, KPIs, empty states y loading states.
- No debe llamar API directamente.
- No debe ejecutar mutaciones de negocio.

### `<modulo>.actions.js`

Debe manejar acciones del usuario.

Ejemplos:

- guardar
- eliminar
- confirmar
- anular
- cambiar estado
- cargar detalle
- abrir drawer
- cerrar drawer
- aplicar filtros
- exportar

Puede llamar API, actualizar estado y pedir render.

### `<modulo>.js`

Debe ser orquestador pequeño.

Responsabilidades:

- inicialización
- listeners principales
- carga inicial
- wrappers globales mínimos si el HTML todavía usa `onclick`
- configuración de tabs o pantalla inicial

No debe volver a convertirse en archivo monolítico.

---

## 5. Orden de scripts recomendado

El orden debe respetar dependencias.

```html
<script src="../../js/core/config.js"></script>
<script src="../../js/core/auth.js"></script>
<script src="../../js/core/http.js"></script>
<script src="../../js/shared/api.js"></script>
<script src="../../js/shared/formatters.js"></script>
<script src="../../js/shared/alerts.js"></script>

<script src="js/<modulo>.state.js"></script>
<script src="js/<modulo>.helpers.js"></script>
<script src="js/<modulo>.api.js"></script>
<script src="js/<modulo>.render.js"></script>
<script src="js/<modulo>.actions.js"></script>
<script src="<modulo>.js"></script>

<script src="../../js/shared/sidebar.js"></script>
```

Ajustar según archivos reales, pero conservar la idea:

```text
shared/core → state → helpers → api → render → actions → main → sidebar
```

---

## 6. Principios UX globales para Artepax

Toda pantalla debe responder rápido:

- ¿Qué estoy viendo?
- ¿Qué estado tiene?
- ¿Qué requiere acción?
- ¿Qué está bloqueado?
- ¿Qué puedo hacer ahora?
- ¿Qué pasará si presiono este botón?
- ¿Qué cambió después de ejecutar una acción?

Preferir:

- Tablas densas pero legibles.
- KPIs compactos.
- Filtros visibles.
- Estados con badges.
- Acciones primarias claras.
- Acciones secundarias diferenciadas.
- Acciones peligrosas separadas.
- Drawers para formularios y detalle.
- Modales solo para confirmaciones críticas.
- Empty states explicativos.
- Loading states visibles.
- Error states accionables.
- Mensajes concretos.

Evitar:

- Botones genéricos como “Aceptar” si no explican la acción.
- Iconos sin texto en acciones críticas.
- Múltiples botones primarios compitiendo.
- Formularios largos sin secciones.
- Filtros que obliguen al usuario a conocer IDs internos.
- Estados visibles solo por color.
- Exportaciones sin vista previa.
- Pantallas con mucho espacio vacío pero baja utilidad.
- Modales para todo.
- Repetir lógica de negocio crítica en frontend si el backend ya la valida.

---

## 7. Jerarquía de botones

Usar una jerarquía consistente.

```text
Primary   → acción principal del flujo
Secondary → acción alternativa importante
Tertiary  → cancelar, limpiar, volver, ver más
Danger    → eliminar, anular, cancelar definitivamente, desactivar
Icon      → acción compacta repetitiva o auxiliar
```

Regla: una zona de la pantalla no debe tener varios botones primarios con acciones distintas compitiendo.

Correcto:

```text
[Guardar cambios] primary
[Cancelar] tertiary
```

Incorrecto:

```text
[Guardar] primary
[Eliminar] primary
[Cancelar] primary
```

En tablas, se permite repetir acciones del mismo tipo cuando el patrón es claro.

Ejemplos:

```text
[Ver detalle]
[Seleccionar]
[Marcar leído]
```

---

## 8. Estados obligatorios de botones

Todo botón interactivo debe contemplar estos estados:

```text
default
hover
focus
active / pressed
disabled
loading / progress
success opcional
error opcional
```

Durante acciones async:

- Deshabilitar el botón.
- Cambiar texto a loading.
- Evitar doble submit.
- Restaurar el estado si falla.
- Actualizar la vista si tiene éxito.
- Mostrar error claro si el backend rechaza la acción.

Textos recomendados:

```text
Guardando...
Generando...
Exportando...
Confirmando...
Anulando...
Eliminando...
Cargando...
```

No dejar botones activos mientras se ejecuta una operación crítica.

---

## 9. Tamaño, padding y radio de botones

El botón debe ser significativamente más grande que el texto interno.

Base recomendada:

```css
.btn {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  white-space: nowrap;
}

.btn-primary {
  min-height: 40px;
  padding: 0 18px;
}

.btn-sm {
  min-height: 32px;
  padding: 0 10px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

Reglas:

- No permitir texto partido en dos líneas dentro del botón.
- No mezclar radios sin intención.
- Para Artepax, preferir radio de `8px` o `10px`.
- Botones tipo pill solo si toda la pantalla usa ese lenguaje visual.

---

## 10. Texto de botones

Usar verbos claros, concretos e imperativos cuando la acción sea directa.

Buenos ejemplos:

```text
Crear evento
Guardar cambios
Registrar pago
Confirmar pago
Anular pago
Generar PDF
Exportar Excel
Marcar como leído
Desembolsar gasto
Eliminar gasto
Reenviar documento
Aplicar filtros
Limpiar filtros
```

Evitar:

```text
Ok
Aceptar
Enviar
Procesar
Hacer
Click aquí
Continuar
```

“Continuar” solo es aceptable cuando realmente hay un flujo por pasos.

Para acciones peligrosas, el texto debe decir exactamente qué ocurrirá:

```text
Eliminar gasto
Anular pago
Confirmar cancelación
Desactivar cliente
Desactivar producto
```

No usar “Aceptar” para confirmar eliminación.

---

## 11. Iconos en botones

Los iconos pueden reforzar significado, pero no deben sustituir texto en acciones críticas.

Correcto:

```html
<button class="btn btn-secondary">
  <i data-lucide="file-down"></i>
  Exportar Excel
</button>
```

Permitido usar solo icono cuando:

- La acción es repetitiva.
- Está dentro de una tabla.
- El contexto es obvio.
- Tiene `aria-label`.
- No es destructiva, o la destructiva tiene confirmación clara.

Ejemplo:

```html
<button class="btn-icon" aria-label="Ver detalle">
  <i data-lucide="eye"></i>
</button>
```

Para acciones destructivas con solo icono, exigir confirmación y tooltip/aria-label.

---

## 12. Botones ghost, outline y tertiary

Usar botones outline o ghost con cuidado.

Válidos para:

- Cancelar
- Limpiar filtros
- Ver detalle
- Volver
- Acciones secundarias

No usarlos como única acción principal porque pueden pasar desapercibidos.

En botones outline, el texto debe usar el mismo color del borde o un color de contraste suficiente.

---

## 13. Botones sobre fondos distintos

Antes de aprobar estilos de botones, revisar que funcionen sobre:

- Fondo blanco.
- Fondo gris claro.
- Cards.
- Tablas.
- Header/hero.
- Estados disabled.
- Fondos con color suave.
- Fondos oscuros si existen.

Debe haber contraste suficiente y fallback visual.

No diseñar un botón que solo se vea bien en una card aislada.

---

## 14. Accesibilidad visual

No usar solo color para comunicar estado.

Cada estado importante debe tener al menos dos señales:

```text
Color + texto
Color + icono
Color + badge
Color + tooltip
Color + posición
```

Ejemplos correctos:

```text
Verde + "Pagado"
Amarillo + "Pendiente"
Rojo + "Vencido"
Gris + "Inactivo"
Azul + "Programado"
```

Todo control interactivo debe tener:

- Focus visible.
- Estado disabled real cuando no se puede usar.
- `aria-label` si solo usa icono.
- Texto claro para acciones importantes.
- Contraste suficiente.

Usuarios con daltonismo deben poder entender la pantalla sin depender exclusivamente del color.

---

## 15. Controles de selección

### Checkbox

Usar checkbox cuando se permitan múltiples opciones.

Ejemplos:

```text
Filtrar por varios estados
Seleccionar columnas visibles
Seleccionar múltiples tipos de reporte
Seleccionar varios registros para exportar
```

Estados necesarios:

```text
unchecked
checked
disabled
hover
focus
indeterminate si aplica
```

### Radio button

Usar radio cuando solo pueda elegirse una opción dentro de un grupo.

Ejemplos:

```text
Formato de exportación: PDF / Excel
Agrupar por: evento / cliente / fecha
Vista: resumen / detalle
```

No usar radios para acciones que ejecutan algo inmediatamente si parecen filtros persistentes.

### Switch

Usar switch solo para activar/desactivar algo binario y persistente.

Ejemplos:

```text
Plantilla activa/inactiva
Método de pago activo/inactivo
Tipo de evento activo/inactivo
Configuración habilitada/deshabilitada
```

No usar switch para acciones destructivas o que requieren explicación.

Incorrecto:

```text
Switch para cancelar evento
Switch para eliminar producto
Switch para confirmar pago
```

---

## 16. Filtros y búsqueda

No obligar al administrador a conocer IDs internos.

Evitar como filtro principal:

```text
Buscar por ID de evento
Buscar por ID de cliente
Buscar por ID de pago
```

Permitido como búsqueda avanzada, no como flujo principal.

Preferir:

```text
Buscar por cliente
Buscar por teléfono
Buscar por fecha
Buscar por estado
Buscar por saldo pendiente
Buscar por tipo de evento
Buscar por decoración
Buscar por concepto
Buscar por responsable
```

Un buen módulo administrativo debe ofrecer filtros según la forma en que trabaja el usuario real.

Ejemplo para Gastos:

Mal enfoque:

```text
Buscar gastos por ID de evento
```

Buen enfoque:

```text
Mostrar eventos operativos con nombre de cliente, fecha, estado y total de gastos.
Permitir seleccionar un evento.
Mostrar gastos proyectados/desembolsados del evento seleccionado.
```

Ejemplo para Pagos:

```text
Vista de cobranza con eventos que tienen saldo pendiente.
Pagos pendientes separados de pagos confirmados.
Resumen financiero visible antes de registrar pago.
```

---

## 17. Tablas administrativas

Toda tabla debe tener:

- Encabezados claros.
- Formato de fecha.
- Formato de moneda cuando aplique.
- Badges de estado.
- Acciones alineadas.
- Empty state.
- Loading state.
- Error state.
- Paginación si el backend pagina.
- Filtros si hay volumen.

Acciones de fila recomendadas:

```text
Ver detalle
Editar
Confirmar
Anular
Eliminar
Reenviar
Exportar
Desembolsar
Marcar leído
```

Reglas:

- Acciones destructivas separadas visualmente.
- No saturar la fila con demasiados botones.
- Si hay muchas acciones, usar botón principal + menú secundario.
- Las acciones no disponibles deben deshabilitarse o no mostrarse, según claridad del flujo.

---

## 18. Cards, KPIs y resúmenes

Usar KPIs compactos cuando ayuden a decidir.

Ejemplos por módulo:

### Pagos

```text
Total evento
Total pagado
Saldo pendiente
Pagos pendientes
```

### Gastos

```text
Total proyectado
Total desembolsado
Pendiente de desembolso
Cantidad de gastos
```

### Inventario

```text
Productos activos
Stock crítico
Reservado
Disponible
Movimientos recientes
```

### Eventos

```text
Eventos programados
Eventos confirmados
Cancelaciones pendientes
Eventos con saldo pendiente
```

No crear KPIs decorativos sin utilidad operativa.

---

## 19. Drawers, modales y confirmaciones

Usar drawer para:

- Crear registros.
- Editar registros.
- Ver detalle administrativo.
- Formularios medianos.
- Resúmenes laterales.

Usar modal para:

- Confirmaciones críticas.
- Acciones irreversibles.
- Decisiones bloqueantes.

No usar modal para:

- Tablas grandes.
- Formularios extensos.
- Información que el usuario necesita comparar con la pantalla de fondo.

Confirmaciones destructivas deben decir:

- Qué se va a afectar.
- Si se puede revertir.
- Qué datos cambiarán.
- Qué acción exacta confirma.

Ejemplo:

```text
¿Eliminar este gasto proyectado?
Esta acción no puede aplicarse a gastos desembolsados.
```

---

## 20. Estados de pantalla

Toda pantalla debe contemplar:

### Loading state

Mientras carga la información.

```text
Cargando eventos...
Cargando pagos...
Cargando inventario...
```

### Empty state

Cuando no hay datos.

Debe explicar qué significa y qué hacer.

Mal:

```text
No hay datos
```

Bien:

```text
No hay pagos pendientes para este evento.
Cuando registres un pago, aparecerá en esta sección.
```

### Error state

Debe mostrar error entendible.

```text
No se pudieron cargar los pagos.
Revisa la conexión o intenta nuevamente.
```

### Disabled/blocked state

Cuando una acción no está permitida por estado del backend, explicar el motivo.

Ejemplo:

```text
No puedes registrar pagos en una cotización. Primero programa el evento.
```

---

## 21. Reportes

Los reportes pueden implementarse inicialmente en frontend cuando usen endpoints existentes.

Flujo obligatorio:

```text
1. Seleccionar tipo de reporte.
2. Seleccionar filtros.
3. Cargar datos.
4. Mostrar vista previa.
5. Exportar PDF o Excel.
6. Mostrar resultado o error.
```

No exportar sin vista previa.

Librerías recomendadas:

```text
PDF: pdfmake o jsPDF + autoTable
Excel: SheetJS CE
```

Estructura sugerida:

```text
modules/reportes/
├── reportes.html
├── reportes.css
├── reportes.js
└── js/
    ├── reportes.state.js
    ├── reportes.helpers.js
    ├── reportes.api.js
    ├── reportes.render.js
    └── reportes.export.js
```

No mezclar reportes administrativos con el módulo Documento.

Documento debe quedar para:

- Cotización.
- Confirmación de reserva.
- Aviso de saldo pendiente.
- Plantillas.
- PDF formal por evento.
- Reenvío por correo.

Reportes debe quedar para:

- Eventos realizados.
- Pagos.
- Gastos.
- Inventario.
- Rentabilidad.
- Auditoría.
- Cronograma.
- Exportación administrativa.

---

## 22. Reglas por módulo

### Eventos

Priorizar claridad del ciclo de vida.

Debe verse:

- estado actual
- siguiente acción permitida
- bloqueo si existe
- cliente
- fecha
- horario
- decoración
- precio
- pagos/resumen si aplica
- stock/reservas si aplica

No saturar la tabla principal con todo. Usar detalle/drawer para información extendida.

### Pagos

Debe priorizar cobranza.

Mostrar:

- eventos con saldo pendiente
- pagos pendientes
- pagos confirmados
- resumen del evento
- estado financiero claro

Acciones críticas:

- registrar pago
- confirmar pago
- anular pago

No permitir que el usuario registre pago sin contexto financiero del evento.

### Gastos

Debe priorizar selección de evento sin requerir ID.

Mostrar primero eventos operativos o recientes con:

- cliente
- fecha
- estado
- total gastos
- proyectado
- desembolsado

Luego mostrar detalle de gastos del evento.

Acciones:

- crear gasto proyectado
- desembolsar gasto
- eliminar gasto no desembolsado

### Inventario

Debe separar:

- productos
- stock operativo
- movimientos
- ajustes

No confundir cantidad total con disponibilidad real.

Destacar:

- stock bajo
- reservado
- disponible
- inactivos
- movimientos recientes

### Decoraciones

Debe quedar claro que una decoración es plantilla, no reserva.

Mostrar:

- productos requeridos
- precio base
- estado
- disponibilidad aproximada si endpoint lo permite

### Cronograma

Debe organizarse por evento y estado de actividad.

Mostrar:

- actividad
- inicio
- fin
- estado
- responsables
- pago asignado si aplica
- acciones permitidas

### Documentos

Debe distinguir:

- documentos generados
- plantillas
- estado de envío
- reintentos
- tipo de documento

No prometer descarga PDF si el backend no la expone.

### Auditoría

Debe ser lectura y trazabilidad.

Priorizar filtros:

- tabla
- registro
- acción
- fecha
- usuario si existe en DTO

### Configuración

Debe tratarse como administración sensible.

Mostrar descripción, clave, valor actual y validación clara.

No hardcodear reglas críticas en frontend si backend usa configuración.

### Notificaciones

Debe priorizar lectura rápida.

Mostrar:

- no leídas
- tipo
- fecha
- mensaje
- acción de marcar leído

No crear notificaciones desde frontend si backend no lo permite.

---

## 23. Clasificación de problemas

Cuando audites una pantalla, clasifica problemas así:

```text
P0 — Rompe funcionalidad
```

Ejemplo: el frontend llama un endpoint inexistente o manda payload inválido.

```text
P1 — Bloquea flujo importante
```

Ejemplo: el usuario no puede encontrar eventos con saldo pendiente si no conoce el ID.

```text
P2 — Genera confusión o deuda UX
```

Ejemplo: botones ambiguos, filtros pobres, estados poco claros.

```text
P3 — Mejora visual o refinamiento
```

Ejemplo: espaciado, alineación, iconos, microcopy.

---

## 24. Formato esperado de auditoría UX/UI

Cuando se pida revisar un módulo, responder con esta estructura:

```text
1. Veredicto general
2. Qué está bien
3. Problemas detectados
4. Problemas frontend-backend
5. Mejoras solo frontend
6. Mejoras que requieren backend
7. Plan por fases
8. Recomendación final
```

Cuando se pida plan de implementación:

```text
Fase 1 — Corrección mínima funcional
Fase 2 — Mejora UX principal
Fase 3 — Refactor modular
Fase 4 — Accesibilidad y estados
Fase 5 — Verificación final
```

No proponer rediseño total si bastan cambios incrementales.

---

## 25. Criterios de aprobación UX/UI

Una pantalla está aceptable si:

- El usuario entiende qué ve en menos de 5 segundos.
- La acción principal es evidente.
- Los estados son claros sin depender solo del color.
- Los botones tienen jerarquía consistente.
- Las acciones peligrosas están separadas.
- Hay loading, empty y error states.
- Los filtros reflejan cómo trabaja el usuario real.
- No exige memorizar IDs.
- No inventa datos que el backend no entrega.
- No rompe la arquitectura modular existente.
- No duplica reglas críticas del backend.
- No oculta errores importantes.

---

## 26. Checklist rápido antes de aprobar un módulo

```text
[ ] La pantalla tiene objetivo claro.
[ ] La acción principal está visible.
[ ] No hay múltiples primary compitiendo.
[ ] Los filtros son útiles para un admin real.
[ ] No depende de IDs como búsqueda principal.
[ ] Hay loading state.
[ ] Hay empty state.
[ ] Hay error state.
[ ] Los estados usan texto/badge, no solo color.
[ ] Los botones tienen disabled/loading cuando aplica.
[ ] Las acciones peligrosas tienen confirmación.
[ ] Las tablas tienen formato correcto de moneda/fecha.
[ ] La UI respeta endpoints y DTOs reales.
[ ] El API layer no toca DOM.
[ ] El render layer no llama API directamente.
[ ] El main JS no volvió a ser monolítico.
[ ] La solución no requiere backend nuevo salvo que se marque explícitamente.
```

---

## 27. Prompt base para usar este contexto

Pega este prompt al iniciar una revisión:

```text
Usa el CONTEXTO MAESTRO UX/UI — ARTEPAX FRONTEND.

Necesito revisar el módulo [NOMBRE_MODULO].

Objetivo:
- Detectar problemas UX/UI reales.
- Detectar inconsistencias frontend-backend.
- Proponer mejoras sin inventar backend.
- Separar qué es SOLO FRONTEND y qué REQUIERE BACKEND NUEVO.
- Mantener arquitectura vanilla modular.
- Aplicar criterios de botones, estados, filtros, tablas, accesibilidad y productividad administrativa.

Entrégame:
1. Veredicto general.
2. Problemas clasificados P0/P1/P2/P3.
3. Mejoras recomendadas.
4. Plan por fases.
5. Qué archivos tocaría.
6. Riesgos de implementación.
```

---

## 28. Prompt base para implementar mejoras

```text
Usa el CONTEXTO MAESTRO UX/UI — ARTEPAX FRONTEND.

Vamos a implementar mejoras UX/UI en [NOMBRE_MODULO].

Restricciones:
- No cambiar endpoints.
- No cambiar payloads.
- No romper IDs/clases existentes salvo que sea necesario y lo indiques.
- No introducir frameworks.
- Mantener HTML/CSS/JS vanilla.
- Mantener separación state/helpers/api/render/actions/main.
- Toda acción async debe tener loading/disabled/error handling.
- Toda mejora debe respetar reglas reales del backend.

Primero genera un plan por fases.
No escribas código hasta que apruebe la fase.
```

---

## 29. Prompt base para revisar botones y controles

```text
Usa el CONTEXTO MAESTRO UX/UI — ARTEPAX FRONTEND.

Revisa los botones y controles de selección de este módulo.

Evalúa:
- Jerarquía primary/secondary/tertiary/danger.
- Estados default/hover/focus/active/disabled/loading.
- Texto de botones.
- Uso de iconos.
- Contraste.
- Accesibilidad.
- Checkboxes/radios/switches.
- Acciones destructivas.
- Si hay demasiados botones compitiendo.

Devuelve problemas P0/P1/P2/P3 y correcciones concretas.
```

---

## 30. Nota final

Este contexto debe usarse como guía práctica, no como rediseño obligatorio. La prioridad es mejorar la productividad y reducir errores sin romper la integración backend ni introducir complejidad innecesaria.
