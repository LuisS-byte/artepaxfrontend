# Artepax Frontend — Agent Instructions

## Stack & Structure

- **Vanilla HTML/CSS/JS** — no bundler, no framework, no test suite
- Entry points: `index.html` (dashboard), `login.html` (Google OAuth), `modules/*/` per feature
- API calls go to a **separate backend** (Spring Boot + PostgreSQL, not in this repo)

## Script Load Order (mandatory)

```
js/core/config.js     → API_URL, TOKEN_KEY
js/core/auth.js       → requireAuth(), logout()
js/core/http.js       → api.get/post/put/patch/delete()
js/shared/api.js      → all endpoints (source of truth)
js/shared/modulos.js  → renderTabla(), limpiarForm(), abrirModal(), etc.
js/shared/formatters.js → formatFecha(), formatPrecio(), escapeStr()
js/shared/alerts.js   → mostrarAlerta(), mostrarAlertaModal()
modules/X/X.js        → module-specific logic (load last)
```

## API Layer (`js/shared/api.js`)

All backend calls go through `API.*`. Never hardcode fetch URLs in modules.

```js
API.clientes.list() / get(id) / crear(body) / actualizar(id, body) / eliminar(id)
API.eventos.list() / get(id) / crear(body) / actualizar(id, body)
    .programar(id) / confirmar(id) / iniciarMontaje(id) / finalizar(id)
    .cancelar(id, motivo) / disponibilidad(params) / rentabilidad(id)
API.decoraciones.list() / get(id) / crear(body) / actualizar(id, body)
API.inventario.entrada(body) / salida(body) / stock(productoId)
API.pagos.crear(body) / confirmar(id) / porEvento(eventoId)
API.cronogramas.list(idEvento) / get(id) / crear(body) / cambiarEstado(id, estado)
// ...full surface in FRONTEND_ESTADO.md section 3
```

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| JS functions | camelCase | `renderTabla`, `mostrarAlerta` |
| HTML element IDs | kebab-case | `modal-cliente`, `tabla-clientes` |
| CSS classes | kebab-case | `badge-programado`, `app-layout` |
| Badge states | `badge-{ESTADO}` | `badge-cancelado`, `badge-finalizado` |

## Event State Machine (backend enforces)

```
COTIZACION → PROGRAMADO → CONFIRMADO → EN_MONTAJE → FINALIZADO
     ↓            ↓            ↓             ↓
  CANCELADO  CANCELACION_PENDIENTE ───────→ CANCELADO
```

## Modules Implemented vs. Missing

| Module | Status |
|--------|--------|
| Clientes, Eventos, Decoraciones, Inventario, Cronograma, Gastos, Catálogos | ✅ Implemented |
| Documentos, Configuración, Auditoría, Notificaciones | ❌ Missing |

## Auth

- Login via Google OAuth at `login.html`
- Token stored in `localStorage` under key defined in `config.js` (TOKEN_KEY)
- Every protected page calls `requireAuth()` from `js/core/auth.js`
- Backend routes under `/api/*` require `Authorization: Bearer <token>`

## Database (backend reference)

- PostgreSQL, BIGSERIAL PKs, TIMESTAMP fields (not DATE)
- Source of truth for DB schema: `NOTAS_DB.md` (complete DDL v4.2)
- DDL file in repo: `Artepax_DDL_v4_2.sql`

## Key Patterns

- Modal pattern: same modal for create/edit (title + button change), separate modal for delete confirm
- Search: local filtering via `modulos.bindSearch(inputId, datos, filterFn, renderFn)`
- Stock alerts: `stock-bajo` badge when ≤5, `stock-ok` when >5

## Important Gotchas

- Routes must use `/api/...` prefix — frontend had hardcoded `/clientes` (without api) fixed in refactor
- `formatearFecha` (modulos.js) vs `formatFecha` (formatters.js) — use modulos.js version
- `cargarClientes` renamed to `cargarClientesSelect` in eventos.js to avoid collision with clientes.js
- `event_precio_total` is a PostgreSQL GENERATED column — never write to it directly

## Where to Find Things

| Info | File |
|------|------|
| Frontend architecture | `FRONTEND_ESTADO.md` |
| Full API surface | `FRONTEND_ESTADO.md` section 3 |
| DB schema & business rules | `NOTAS_DB.md` |
| DDL | `Artepax_DDL_v4_2.sql` |
| CSS | `css/global.css`, `css/dashboard.css`, per-module `X.css` |
