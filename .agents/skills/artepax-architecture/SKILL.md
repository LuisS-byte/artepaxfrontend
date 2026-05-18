---
name: artepax-architecture
description: Reglas estrictas de arquitectura, stack tecnológico (Vanilla JS) y convenciones UI para el Frontend administrativo de Artepax. Úsalo siempre que modifiques, audites o crees código en este repositorio.
---

# Arquitectura Frontend de Artepax

Estás trabajando en el frontend del sistema administrativo **Artepax Fiesta**. Este proyecto tiene reglas estrictas de desarrollo que garantizan un rendimiento óptimo y una integración exacta con el backend (Spring Boot + PostgreSQL).

## 1. Stack Tecnológico (Estricto)
- **HTML5 Semántico**: Uso correcto de `<header>`, `<main>`, `<section>`, `<aside>`.
- **CSS3 Puro**: CERO frameworks CSS. No utilices Tailwind, Bootstrap ni similares. Todo el diseño se basa en las variables CSS nativas definidas en `css/global.css`.
- **Vanilla JavaScript (ES6)**: CERO frameworks JS. No utilices React, Vue, Angular ni jQuery. Toda la lógica se maneja con módulos nativos y manipulación directa del DOM.

## 2. Integración con Backend (API Layer)
El backend es una aplicación separada. El frontend **NUNCA** debe hacer fetch directo dentro de los módulos.
- Toda llamada HTTP debe pasar por los métodos registrados en `js/shared/api.js`.
- La capa HTTP (`js/core/http.js`) maneja automáticamente el envío del token JWT (Bearer) y las redirecciones 401/403.
- Los nombres de las propiedades en JS deben coincidir **exactamente** con los DTOs del backend (usar `camelCase`).

## 3. Orden de Carga de Scripts (Obligatorio en HTML)
Al crear un nuevo módulo HTML, los scripts deben cargarse al final del `<body>` estrictamente en este orden:
```html
<script src="../../js/core/config.js"></script>
<script src="../../js/core/auth.js"></script>
<script src="../../js/core/http.js"></script>
<script src="../../js/shared/api.js"></script>
<script src="../../js/shared/modulos.js"></script>
<script src="../../js/shared/formatters.js"></script>
<script src="../../js/shared/alerts.js"></script>
<script src="nombre_modulo.js"></script>
<script>requireAuth();</script>
```

## 4. Convenciones de Diseño y UI (Design System)
- **Altas y Ediciones**: Utilizar **Drawers** (paneles laterales que se deslizan desde la derecha) definidos en `global.css` (`.drawer-overlay`, `.drawer`). Nunca abrir pantallas nuevas para editar.
- **Eliminaciones**: Utilizar **Modales** centrales pequeños para confirmar la acción antes de borrar.
- **Tablas**: Utilizar siempre la función global `modulos.renderTabla(datos, idContenedor, columnasDef)` para renderizar listas de datos.
- **Formateo**: Usar los helpers en `js/shared/formatters.js` para renderizar fechas (`modulos.formatearFecha`), monedas (`formatters.precio`) y sanear texto (`formatters.textoSeguro`).
- **Estados (Badges)**: Las clases de estado en CSS siguen el formato `.badge-{ESTADO}`. Ejemplo: `.badge-programado`, `.badge-confirmado`, `.badge-cancelado`. Usar `modulos.badgeEstado()`.

## 5. Naming Conventions (Nomenclatura)
- **Archivos y carpetas**: `kebab-case` o minúsculas simples (ej. `modules/cronograma/cronograma.js`).
- **IDs y Clases CSS**: `kebab-case` (ej. `btn-guardar`, `tabla-clientes`).
- **Funciones y Variables JS**: `camelCase` (ej. `cargarClientes()`, `eventoSeleccionadoId`).
- **Atributos de Base de Datos / DTOs**: El backend usa PostgreSQL, pero la API serializa a JSON en `camelCase` (ej. `fechaCreacion`, no `fecha_creacion`).

## 6. Manejo de Errores
- Utilizar siempre `mostrarAlerta('error', mensaje)` o `mostrarAlertaId('contenedor-alert', 'error', mensaje)` (desde `alerts.js`) para notificar al usuario. Nunca usar `alert()` nativo del navegador.
