---
version: "0.3"
name: "Artepax Admin Design System"
description: "Sistema visual, estructural y de experiencia para Artepax, plataforma administrativa interna B2B de gestión de eventos y decoraciones."

product:
  type: "internal-admin-b2b"
  desktopFirst: true
  density: "compact-admin"
  audience: "administradores internos"
  usageProfile: "alta frecuencia operativa, alta densidad de datos, navegación por módulos"
  auth:
    method: "google-oauth-plus-jwt"
    publicRoutes:
      - "/auth/google"
    protectedArea: true

sourceOfTruth:
  visual: "DESIGN.md"
  functional: "PROYECTO_CONFIRMACION3.md"
  auditConstraint: "auditoria_completa_artepax.md + veredicto_final.md"
  precedence:
    - "Si una pantalla contradice el backend real confirmado, prevalece el backend"
    - "Si una pantalla contradice la auditoría técnica final, prevalece la auditoría"
    - "Si falta una decisión visual menor, mantener coherencia con este documento"

implementationScope:
  readyNow:
    - "Login"
    - "Clientes"
    - "UI states de Clientes"
  readyWithCorrections:
    - "Eventos lista"
    - "Detalle de Evento"
    - "Detalle de Evento Asociado"
    - "Inventario Movimientos"
    - "Documentos"
    - "Notificaciones"
    - "Auditoría"
    - "Plantillas de Documentos"
    - "Asignación de Personal"
  blockedUntilRedesignOrBackend:
    - "Pagos globales"
    - "Nueva Cotización actual"
    - "Inventario Productos actual"
    - "Inventario Decoraciones actual"
    - "Detalle de Decoración actual"
    - "Cronogramas globales"
    - "Configuración General actual"
    - "Gestión de Usuarios"

colors:
  primary: "#1F3A5F"
  primary-strong: "#16304D"
  secondary: "#5C6B7A"
  accent: "#1565C0"

  neutral-0: "#FFFFFF"
  neutral-25: "#FCFCFD"
  neutral-50: "#F7F8FA"
  neutral-100: "#EEF1F4"
  neutral-200: "#E2E8F0"
  neutral-300: "#CBD5E1"
  neutral-500: "#64748B"
  neutral-700: "#334155"
  neutral-900: "#0F172A"

  success: "#2E7D32"
  warning: "#ED6C02"
  danger: "#C62828"
  info: "#1565C0"

  event-cotizacion: "#64748B"
  event-programado: "#1565C0"
  event-confirmado: "#2E7D32"
  event-en-montaje: "#6D28D9"
  event-finalizado: "#14532D"
  event-cancelacion-pendiente: "#ED6C02"
  event-cancelado: "#C62828"

  cronograma-pendiente: "#64748B"
  cronograma-en-progreso: "#1565C0"
  cronograma-completado: "#2E7D32"
  cronograma-cancelado: "#C62828"

  pago-pendiente: "#ED6C02"
  pago-pagado: "#2E7D32"
  pago-cancelado: "#C62828"

  documento-pendiente: "#64748B"
  documento-enviado: "#2E7D32"
  documento-fallido: "#C62828"
  documento-reenviado: "#1565C0"

  gasto-proyectado: "#ED6C02"
  gasto-desembolsado: "#2E7D32"

  notificacion-pendiente: "#64748B"
  notificacion-enviada: "#1565C0"
  notificacion-fallida: "#C62828"
  notificacion-leida: "#2E7D32"

typography:
  fontFamilyBase: "Inter, system-ui, sans-serif"
  h1:
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2

spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"

rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"

layout:
  shell:
    sidebar: true
    topbar: true
    breadcrumbs: true
    contentMode: "full-width constrained by reading blocks"
    density: "compact-admin"
    desktopFirst: true
    sidebarStyle: "dark"
    topbarStyle: "light"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-0}"
    rounded: "{rounded.sm}"
    paddingY: "{spacing.sm}"
    paddingX: "{spacing.lg}"

  button-secondary:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.sm}"

  table-base:
    headerBackground: "{colors.neutral-100}"
    rowDivider: "{colors.neutral-200}"
    textColor: "{colors.neutral-900}"
    density: "compact"

  input-base:
    backgroundColor: "{colors.neutral-0}"
    borderColor: "{colors.neutral-300}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.sm}"

  card-base:
    backgroundColor: "{colors.neutral-0}"
    borderColor: "{colors.neutral-200}"
    rounded: "{rounded.md}"

  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.neutral-0}"

  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.neutral-0}"

  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.neutral-0}"

  badge-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.neutral-0}"

# Overview

Artepax es un sistema administrativo interno B2B para gestión de clientes, eventos, cronogramas, inventario, decoraciones, pagos, documentos, notificaciones, auditoría y configuración. La interfaz debe priorizar velocidad operativa, claridad de estados, bajo ruido visual y alta densidad de información.

No es una experiencia comercial ni una aplicación orientada a clientes finales. Todo el sistema debe sentirse como una herramienta de trabajo interna: estable, legible, sobria y eficiente.

Este documento define la verdad visual del sistema. La verdad funcional se valida contra el backend real y contra la auditoría forense de mockups.

# Functional Scope Confirmed

## Módulos confirmados en backend

- Autenticación
- Clientes
- Eventos
- Tipos de evento
- Gastos por evento
- Cronogramas
- Documentos
- Plantillas de documento
- Inventario
  - Productos
  - Decoraciones
  - Movimientos
  - Vista de stock
- Pagos
- Catálogos de pago
- Notificaciones
- Auditoría
- Configuración

## Módulos o variantes fuera de alcance actual

No diseñar ni maquetar como si estuvieran listos:
- gestión completa de usuarios
- gestión avanzada de roles y permisos
- dashboards ejecutivos no respaldados
- reportes genéricos sin endpoints
- configuraciones inventadas como moneda, IVA u OAuth visual editable
- pagos globales si no existe endpoint global
- cronogramas globales si no existe endpoint global

# Design Principles

- Priorizar claridad operativa sobre decoración.
- Diseñar para escritorio primero.
- Mostrar mucha información sin perder legibilidad.
- Mantener acciones críticas visibles y contextualizadas.
- Reflejar explícitamente el estado real del registro.
- No sugerir acciones que el backend bloqueará.
- Reducir clics en tareas frecuentes.
- Separar lectura, edición, confirmación y acciones destructivas.
- Usar componentes consistentes entre módulos.
- Evitar dashboards genéricos o estilos de marketing.

# Navigation

## Primary Modules

- Dashboard
- Clientes
- Eventos
- Cronogramas
- Inventario
  - Productos
  - Decoraciones
  - Movimientos
- Pagos
- Documentos
- Notificaciones
- Auditoría
- Configuración

## Navigation Rules

- El sidebar es persistente y estable.
- La topbar muestra contexto, breadcrumbs, usuario y notificaciones.
- Las acciones del registro no van en el sidebar.
- No duplicar navegación principal dentro del contenido.
- Todos los mockups y maquetaciones deben usar la misma estructura de shell.

# Layout

## App Shell

- Sidebar fijo izquierdo oscuro
- Topbar clara
- Breadcrumbs visibles
- Encabezado del módulo
- Área principal de contenido
- Zona de acciones contextuales
- Drawers y modales consistentes

## Layout Rules

- Vistas de lista: título + filtros + CTA + tabla
- Vistas de detalle: resumen superior + bloques temáticos + acciones por estado
- Formularios largos: agrupados por secciones
- Ediciones rápidas: drawer
- Confirmaciones destructivas: modal bloqueante

## Density Strategy

- Tablas compactas
- Espaciado controlado
- Badges pequeños
- Filtros visibles
- Acciones claras
- Tipografía sobria
- Información secundaria en texto pequeño

No usar tarjetas grandes como patrón principal en módulos operativos.

# Typography

## Role of Typography

- H1: módulo o pantalla principal
- H2: secciones grandes
- H3: bloques y paneles
- body-md: formularios y contenido principal
- body-sm: tablas, ayuda contextual, metadatos
- label: labels y badges

# Colors

## Semantic Use

- `primary`: acciones primarias, foco, navegación
- `secondary`: apoyo visual
- `neutral-*`: superficies, bordes, fondos
- `success`: acciones correctas y estados válidos
- `warning`: pendientes y transiciones intermedias
- `danger`: errores, bloqueos, cancelaciones
- `info`: información y estados activos no finales

# Shapes

- Bordes suaves pero discretos
- Tablas y inputs con geometría controlada
- Sin estética orgánica o blanda
- El sistema debe sentirse preciso

# Elevation & Depth

- Cards con elevación mínima
- Modales y drawers con separación clara
- Sombras discretas
- Evitar profundidad decorativa

# Components

## App Shell

Incluye:
- sidebar
- topbar
- breadcrumbs
- usuario
- notificaciones
- módulo activo

## Data Table

Uso principal:
- clientes
- eventos
- productos
- decoraciones
- movimientos
- pagos
- auditoría
- notificaciones
- configuración
- documentos
- plantillas

Características:
- compacta
- configurable
- búsqueda
- filtros
- ordenamiento cuando exista soporte real
- acciones por fila
- estados empty/no-results/loading/error
- paginación real si existe soporte backend
- paginación visual solo si está prevista y no engaña sobre la realidad de datos

## Filter Bar

Permitidos según backend:
- búsqueda textual
- estado
- fecha
- chips
- limpiar filtros

No inventar filtros que el backend no soporte, salvo que se indique explícitamente que serán client-side.

## Form

- labels arriba
- validación inline
- errores debajo del campo
- ayuda breve
- CTA visible
- agrupación por bloques

## Drawer

Uso preferido:
- crear/editar cliente
- crear/editar producto
- crear/editar decoración
- asignaciones rápidas
- ajustes operativos rápidos

## Modal

Uso obligatorio:
- eliminar lógico
- cancelar
- confirmar cancelación
- confirmar pago
- anular pago
- acciones irreversibles

## Detail Panel

Para:
- cliente
- evento
- producto
- decoración
- pago
- documento

Debe mostrar:
- resumen
- estado
- acciones válidas
- datos relacionados
- historial si existe

## KPI Card

Solo usar si existe soporte real de datos:
- saldo pendiente por evento
- total cobrado por evento
- rentabilidad por evento
- stock bajo alerta
- eventos próximos
- cotizaciones por vencer

No usar KPIs inventados ni globales sin endpoint.

## Toast

- success
- warning
- error
- info

## Confirmation Dialog

Siempre en acciones destructivas o sensibles.

# State Badges

## Event State Badges

- COTIZACION → neutral gris
- PROGRAMADO → azul
- CONFIRMADO → verde
- EN_MONTAJE → violeta
- FINALIZADO → verde oscuro
- CANCELACION_PENDIENTE → naranja
- CANCELADO → rojo

## Cronograma State Badges

- PENDIENTE → gris
- EN_PROGRESO → azul
- COMPLETADO → verde
- CANCELADO → rojo

No usar:
- EN CAMINO
- EN CURSO

## Documento State Badges

- PENDIENTE → gris
- ENVIADO → verde
- FALLIDO → rojo
- REENVIADO → azul

## Gasto State Badges

- PROYECTADO → naranja
- DESEMBOLSADO → verde

## Pago State Badges

- PENDIENTE → naranja
- PAGADO → verde
- CANCELADO → rojo

## Notificación State Badges

- PENDIENTE → gris
- ENVIADA → azul
- FALLIDA → rojo
- LEIDA → verde

## Producto y Decoración

- Producto: ACTIVO / INACTIVO + indicador separado de `stock_bajo_alerta`
- Decoración: ACTIVO / INACTIVO

No usar para decoraciones:
- DISPONIBLE
- BAJO STOCK
- EN USO
- AGOTADO

# Data Fidelity Rules

- No inventar columnas fuera de DTOs reales.
- No inventar KPIs sin endpoint.
- No inventar filtros sin soporte.
- No inventar módulos fuera de alcance.
- No inventar estados distintos a los del backend.
- No convertir datos derivados en campos base sin indicarlo.
- No mezclar producto físico con paquete de decoración.
- No mostrar stock, SKU, ubicación o movimientos en decoraciones si no existen en backend.
- No usar categorías en productos o decoraciones si no existen en backend.
- No usar “nombre del evento” si el backend no lo tiene.
- No permitir selección manual de productos en nueva cotización si el backend no la soporta en ese flujo.

# Module Rules

## Login

- flujo con Google OAuth
- sin login tradicional como principal
- acceso exclusivo para administradores internos

## Dashboard

Solo puede mostrar:
- eventos próximos
- alertas
- saldos pendientes
- notificaciones recientes
- métricas reales soportadas

No diseñar dashboard definitivo mientras no existan todos los endpoints de resumen.

## Clientes

Vistas:
- lista
- detalle
- crear
- editar
- inactivos

Datos base reales:
- nombre
- teléfono
- correo
- dirección
- activo/inactivo

## Eventos

Vistas:
- lista
- detalle
- crear cotización corregida
- editar cotización
- calendario
- rentabilidad
- cancelación y reversión

### Reglas por estado

- COTIZACION: editar, programar, cancelar
- PROGRAMADO: confirmar, cancelar, pagos
- CONFIRMADO: iniciar montaje, cancelar, pagos, cronograma, documentos
- EN_MONTAJE: finalizar, cancelar, pagos, cronograma, documentos
- CANCELACION_PENDIENTE: revertir cancelación, confirmar cancelación
- FINALIZADO: solo lectura, rentabilidad, documentos, historial
- CANCELADO: solo lectura e historial

No mostrar Editar en FINALIZADO o CANCELADO.
No mostrar Cancelar en FINALIZADO o CANCELADO.
No mostrar pagos donde el backend los bloquearía.

## Nueva Cotización

Debe incluir:
- cliente
- decoración
- tipo de evento
- fecha
- horario
- ubicación
- nota
- precio adicional y nota si aplica

No debe incluir:
- nombre del evento
- selección manual de productos

Los productos pueden mostrarse solo como referencia derivada de la decoración.

## Tipos de Evento

Catálogo simple:
- listado
- crear
- activar/desactivar

## Gastos por Evento

- disponibles solo en estados válidos
- asociados al evento
- con estado PROYECTADO o DESEMBOLSADO

## Cronogramas

Diseñar preferentemente como submódulo por evento mientras no exista endpoint global consolidado.

Si se usa vista global, debe marcarse como dependiente de backend nuevo.

No mostrar delete/editar en COMPLETADO o CANCELADO.

## Asignación de Personal

El formulario debe incluir obligatoriamente:
- usuario
- pagoAsignado
- pagoTipo

No basta con checkboxes de usuario.

## Inventario

### Productos
- lista
- detalle
- crear
- editar
- buscar
- reactivar
- stock y alerta

No usar categoría si no existe.

### Decoraciones
- lista
- detalle
- crear
- editar
- composición de productos
- estado ACTIVO/INACTIVO

No usar stock propio, ubicación, SKU ni movimientos.

### Movimientos
- entrada
- salida
- ajuste
- stock por producto
- historial por producto

Separar claramente:
- tipo_movimiento
- tipo_origen

No mezclar ajuste como si fuera tipo de movimiento base único.

## Pagos

Diseñar preferentemente:
- pagos por evento
- resumen por evento
- registrar
- confirmar
- anular

No diseñar lista global de pagos como canon mientras no exista `GET /api/pagos`.

No inventar KPI global de vencimientos ni fechas de vencimiento.

Debe mostrarse también:
- concepto de pago
- método
- estado
- monto
- resumen por evento

## Documentos

- documentos por evento
- detalle
- generar
- reenviar
- plantillas
- edición de plantilla

“Generar Documento” siempre requiere contexto de evento o selector de evento.
No asumir descarga/previsualización si no existe soporte.
Usar placeholders reales del backend y naming consistente.

## Notificaciones

- bandeja personal
- marcar leída individual
- bulk mark-as-read solo si existe endpoint

## Auditoría

- listado
- filtro por tabla
- filtro por registro
- detalle de cambios

Los filtros de fecha solo deben mostrarse como definitivos si tienen soporte real o si se declara filtrado client-side.

## Configuración

Solo mostrar claves reales del backend:
- PORCENTAJE_ANTICIPO_MINIMO
- TIEMPO_GRACIA_CANCELACION_MINUTOS
- POLITICA_CANCELACION_MONTAJE
- PORCENTAJE_STOCK_MINIMO_GLOBAL
- DIAS_EXPIRACION_COTIZACION
- NEGOCIO_NOMBRE
- NEGOCIO_CORREO
- NEGOCIO_TELEFONO
- DIAS_AVISO_SALDO_PENDIENTE
- DIAS_RECORDATORIO_EVENTO

No diseñar:
- moneda
- IVA
- integración OAuth editable
como parte de este módulo actual.

## Gestión de Usuarios

No implementar ni maquetar como módulo confirmado hasta que exista backend real para CRUD de usuarios y roles.

# Error Handling UX

- 400: error contextual claro
- 404: recurso no encontrado
- 409: conflicto con mensaje específico
- 422: transición o estado inválido
- 500: toast + mensaje persistente si rompe flujo

# Loading States

- tablas: skeleton
- paneles: skeleton
- botones: spinner interno
- filtros: estado deshabilitado temporal
- drawers/modales: loading de submit

# Accessibility

- contraste alto
- foco visible
- body-sm mínimo en tablas
- iconos con texto o tooltip
- nunca depender solo del color

# Implementation Rules for AI

- usar este documento como verdad visual
- usar backend confirmado como verdad funcional
- usar la auditoría como restricción de alcance
- no generar pantallas rojas/bloqueadas como si fueran listas para producción
- maquetar por módulos, no todo a la vez
- priorizar primero pantallas verdes y amarillas corregidas
- cualquier dato mock debe respetar nombres y forma reales del backend

# Do

- usar badges visibles
- mostrar acciones contextuales válidas
- mantener filtros cerca del listado
- usar tablas compactas
- priorizar claridad operativa
- respetar backend y auditoría

# Don't

- no inventar métricas
- no inventar columnas
- no inventar filtros
- no inventar estados
- no inventar módulos
- no mostrar acciones inválidas
- no mezclar navegación con acciones del registro
- no reutilizar mockups inválidos como si fueran canon