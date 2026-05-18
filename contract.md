# Contrato Frontend — Administración de Usuarios

## Resumen

Módulo administrativo que permite a un usuario con rol **ADMIN** gestionar usuarios del sistema. Solo se crean usuarios de tipo `LOCAL` (email + password). No se modifican los flujos de autenticación existentes.

---

## Índice

1. [Autenticación y autorización](#1-autenticación-y-autorización)
2. [Endpoints](#2-endpoints)
   - [POST /api/usuarios — Crear usuario](#21-post-apiusuarios--crear-usuario)
   - [GET /api/usuarios — Listar usuarios](#22-get-apiusuarios--listar-usuarios)
   - [PATCH /api/usuarios/{id}/estado — Cambiar estado](#23-patch-apiusuariosidestado--cambiar-estado)
   - [GET /api/usuarios/me — Usuario actual](#24-get-apiusuariosme--usuario-actual)
3. [Flujo completo](#3-flujo-completo)
4. [Códigos de error](#4-códigos-de-error)
5. [Implementación frontend](#5-implementación-frontend)
   - [Servicio API](#51-servicio-api)
   - [Pantalla de lista de usuarios](#52-pantalla-lista-de-usuarios)
   - [Drawer de creación](#53-drawer-de-creación)
   - [Manejo de errores](#54-manejo-de-errores)
6. [Checklist de implementación](#6-checklist-de-implementación)

---

## 1. Autenticación y autorización

Todos los endpoints administrativos (`POST`, `GET` lista, `PATCH estado`) requieren:

```
Authorization: Bearer <JWT>
```

Y el usuario autenticado debe tener el rol `ADMIN`. Si no, el backend responde con `403 Forbidden`.

El endpoint `GET /api/usuarios/me` está disponible para cualquier usuario autenticado (sin importar el rol).

---

## 2. Endpoints

### 2.1 POST /api/usuarios — Crear usuario

Crea un nuevo usuario LOCAL con password hasheado en backend.

**Request:**

```
POST http://localhost:8080/api/usuarios
Content-Type: application/json
Authorization: Bearer <ADMIN_JWT>
```

```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@artepax.com",
  "telefono": "099123456",
  "password": "MiPassword123",
  "rolId": 1
}
```

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `nombre` | string | ✅ | No vacío, máx 100 caracteres |
| `correo` | string | ✅ | Email válido, único (case-insensitive), máx 100 |
| `telefono` | string | ❌ | Máx 20 caracteres |
| `password` | string | ✅ | Mínimo 8, máximo 72 caracteres |
| `rolId` | integer | ✅ | Debe existir en la tabla `rol` |

> **Importante**: el frontend envía el password en texto plano. El backend lo hashea con BCrypt antes de guardarlo. Nunca viaja hasheado desde el frontend ni se devuelve en respuestas.

**Success Response — `201 Created`:**

```json
{
  "id": 2,
  "nombre": "Juan Pérez",
  "correo": "juan@artepax.com",
  "telefono": "099123456",
  "tipoAuth": "LOCAL",
  "estado": true,
  "rolId": 1,
  "rol": "ADMIN",
  "fechaCreacion": "2026-05-16T15:30:00"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID del usuario |
| `nombre` | string | Nombre completo |
| `correo` | string | Email (normalizado a lowercase) |
| `telefono` | string | Teléfono |
| `tipoAuth` | string | Siempre `"LOCAL"` |
| `estado` | boolean | Siempre `true` al crear |
| `rolId` | number | ID del rol |
| `rol` | string | Nombre del rol (`"ADMIN"` o `"EMPLEADO"`) |
| `fechaCreacion` | string | Timestamp ISO |

> **Nota**: el campo `password` **nunca** aparece en la respuesta.

---

### 2.2 GET /api/usuarios — Listar usuarios

Devuelve todos los usuarios del sistema. No incluye passwords.

**Request:**

```
GET http://localhost:8080/api/usuarios
Authorization: Bearer <ADMIN_JWT>
```

**Success Response — `200 OK`:**

```json
[
  {
    "id": 1,
    "nombre": "Admin Artepax",
    "correo": "admin@artepax.com",
    "telefono": "099111222",
    "tipoAuth": "LOCAL",
    "estado": true,
    "rolId": 1,
    "rol": "ADMIN",
    "fechaCreacion": "2026-01-15T10:00:00"
  },
  {
    "id": 2,
    "nombre": "Juan Pérez",
    "correo": "juan@artepax.com",
    "telefono": "099123456",
    "tipoAuth": "LOCAL",
    "estado": true,
    "rolId": 2,
    "rol": "EMPLEADO",
    "fechaCreacion": "2026-05-16T15:30:00"
  }
]
```

> El campo `password` **nunca** aparece en ningún elemento de la lista.

---

### 2.3 PATCH /api/usuarios/{id}/estado — Cambiar estado

Activa o desactiva un usuario.

**Request:**

```
PATCH http://localhost:8080/api/usuarios/2/estado
Content-Type: application/json
Authorization: Bearer <ADMIN_JWT>
```

```json
{
  "activo": false
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `activo` | boolean | ✅ | `true` para activar, `false` para desactivar |

**Success Response — `200 OK`:**

```json
{
  "id": 2,
  "nombre": "Juan Pérez",
  "correo": "juan@artepax.com",
  "telefono": "099123456",
  "tipoAuth": "LOCAL",
  "estado": false,
  "rolId": 1,
  "rol": "ADMIN",
  "fechaCreacion": "2026-05-16T15:30:00"
}
```

**Reglas de negocio (importantes):**

| Regla | Qué pasa |
|-------|----------|
| Autodesactivación | Un ADMIN **no puede desactivarse a sí mismo** → `400 Bad Request` |
| Último ADMIN activo | No se puede desactivar al **último ADMIN con estado activo** → `400 Bad Request` |
| Usuario no encontrado | Si el `id` no existe → `404 Not Found` |
| Usuario inactivo → activar | Permitido, no hay restricciones |
| Desactivar EMPLEADO | Permitido, las restricciones de "último ADMIN" no aplican |

> **Nota para el frontend**: si el usuario que ejecuta el PATCH es el mismo que el usuario target (autodesactivación), o si es el último ADMIN activo, el backend rechaza la operación con 400. Mostrar el mensaje de error al usuario.

---

### 2.4 GET /api/usuarios/me — Usuario actual

Devuelve los datos del usuario autenticado. Endpoint existente — **sin cambios**.

**Request:**

```
GET http://localhost:8080/api/usuarios/me
Authorization: Bearer <JWT>
```

**Success Response — `200 OK`:**

```json
{
  "id": 1,
  "nombre": "Admin Artepax",
  "correo": "admin@artepax.com",
  "telefono": "099111222",
  "rol": "ADMIN"
}
```

> Este endpoint NO requiere rol ADMIN. Cualquier usuario autenticado puede consumirlo.

---

## 3. Flujo completo

### 3.1 Creación de usuario LOCAL por ADMIN

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │ Backend  │         │    DB    │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ POST /api/usuarios │                    │
     │ {nombre, correo,   │                    │
     │  password, rolId}  │                    │
     │ Bearer: ADMIN_JWT  │                    │
     │───────────────────>│                    │
     │                    │  Validar ADMIN      │
     │                    │  (@PreAuthorize)    │
     │                    │                    │
     │                    │  existsByCorreo     │
     │                    │  IgnoreCase?        │
     │                    │────────────────────>│
     │                    │<────────────────────│
     │                    │                    │
     │                    │  findById(rolId)    │
     │                    │────────────────────>│
     │                    │<────────────────────│
     │                    │                    │
     │                    │  BCrypt.encode()    │
     │                    │  → hash password    │
     │                    │                    │
     │                    │  INSERT usuario     │
     │                    │  tipoAuth='LOCAL'   │
     │                    │  estado=true        │
     │                    │────────────────────>│
     │                    │                    │
     │ 201 {id, nombre,   │                    │
     │ correo, rol,       │                    │
     │ tipoAuth, estado,  │                    │
     │ fechaCreacion}     │                    │
     │<───────────────────│                    │
```

### 3.2 Login del nuevo usuario

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │ Backend  │         │    DB    │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ POST /auth/login   │                    │
     │ {email, password}  │                    │
     │───────────────────>│                    │
     │                    │  findByCorreoAnd    │
     │                    │  TipoAuth(, LOCAL)  │
     │                    │────────────────────>│
     │                    │<────────────────────│
     │                    │                    │
     │                    │  BCrypt.matches()   │
     │                    │  → verificar hash   │
     │                    │                    │
     │ 200 {token}        │                    │
     │<───────────────────│                    │
     │                    │                    │
     │ GET /api/usuarios/me                    │
     │ Bearer: <token>    │                    │
     │───────────────────>│                    │
     │                    │  Validar JWT        │
     │                    │  → extraer usuario  │
     │                    │                    │
     │ 200 {id, nombre,   │                    │
     │ correo, telefono,  │                    │
     │ rol}               │                    │
     │<───────────────────│                    │
```

---

## 4. Códigos de error

### 4.1 Endpoints administrativos (POST, GET lista, PATCH)

| Código | Condición | Cuerpo de ejemplo |
|--------|-----------|-------------------|
| `201` | Creación exitosa | `{ "id": 2, "nombre": "...", ... }` |
| `200` | Listado o cambio de estado exitoso | `{ "id": 2, ... }` o `[...]` |
| `400` | Validación de campos (Bean Validation) | `{ "nombre": "must not be blank", "password": "size must be between 8 and 72" }` |
| `400` | Correo duplicado (case-insensitive) | `"Ya existe un usuario con ese correo"` |
| `400` | Rol inexistente | `"Rol no válido"` |
| `400` | Autodesactivación | `"No puede desactivarse a sí mismo"` |
| `400` | Último ADMIN activo | `"No puede desactivar al último ADMIN activo"` |
| `403` | Sin rol ADMIN | `"Access Denied"` (respuesta de Spring Security) |
| `404` | Usuario no encontrado (PATCH) | `"Usuario no encontrado"` |

### 4.2 GET /api/usuarios/me

| Código | Condición |
|--------|-----------|
| `200` | Usuario autenticado — devuelve datos |
| `401` | Token inválido o ausente |

---

## 5. Implementación frontend

### 5.1 Servicio API

```javascript
// services/usuarioService.js
const BASE_URL = '/api/usuarios';

function getAuthHeaders() {
  const token = localStorage.getItem('jwt');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function listarUsuarios() {
  const res = await fetch(BASE_URL, {
    headers: getAuthHeaders()
  });

  if (res.status === 403) {
    throw new Error('No tienes permisos de administrador');
  }
  if (!res.ok) {
    throw new Error('Error al cargar usuarios');
  }

  return res.json();
  // → [{ id, nombre, correo, telefono, tipoAuth, estado, rolId, rol, fechaCreacion }, ...]
}

export async function crearUsuario({ nombre, correo, telefono, password, rolId }) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nombre, correo, telefono, password, rolId })
  });

  if (res.status === 400) {
    const error = await res.json();
    throw { status: 400, body: error };
  }
  if (res.status === 403) {
    throw { status: 403, message: 'No tienes permisos de administrador' };
  }
  if (!res.ok) {
    throw { status: res.status, message: 'Error al crear usuario' };
  }

  return res.json();
  // → { id, nombre, correo, telefono, tipoAuth, estado, rolId, rol, fechaCreacion }
}

export async function cambiarEstado(id, activo) {
  const res = await fetch(`${BASE_URL}/${id}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ activo })
  });

  if (res.status === 400) {
    const error = await res.text();
    throw { status: 400, message: error };
  }
  if (res.status === 403) {
    throw { status: 403, message: 'No tienes permisos de administrador' };
  }
  if (res.status === 404) {
    throw { status: 404, message: 'Usuario no encontrado' };
  }
  if (!res.ok) {
    throw { status: res.status, message: 'Error al cambiar estado' };
  }

  return res.json();
  // → { id, nombre, correo, telefono, tipoAuth, estado, rolId, rol, fechaCreacion }
}
```

### 5.2 Pantalla de lista de usuarios

```javascript
// pages/Usuarios.jsx (ejemplo con React)

import { useState, useEffect } from 'react';
import { listarUsuarios, crearUsuario, cambiarEstado } from '../services/usuarioService';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCrear(datos) {
    try {
      await crearUsuario(datos);
      setShowDrawer(false);
      await cargarUsuarios();
    } catch (err) {
      if (err.status === 400 && err.body) {
        // Errores de validación por campo
        setError(JSON.stringify(err.body));
      } else {
        setError(err.message || 'Error al crear usuario');
      }
    }
  }

  async function handleToggleEstado(usuario) {
    try {
      await cambiarEstado(usuario.id, !usuario.estado);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Usuarios</h1>
      
      {error && <div className="error">{error}</div>}

      <button onClick={() => setShowDrawer(true)}>
        + Crear usuario
      </button>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Tipo Auth</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.correo}</td>
              <td>{u.telefono}</td>
              <td>{u.rol}</td>
              <td>{u.tipoAuth}</td>
              <td>{u.estado ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button
                  onClick={() => handleToggleEstado(u)}
                  disabled={/* opcional: bloquear si es el usuario actual */}
                >
                  {u.estado ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDrawer && (
        <CrearUsuarioDrawer
          onSubmit={handleCrear}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  );
}
```

### 5.3 Drawer de creación

```javascript
// components/CrearUsuarioDrawer.jsx

import { useState } from 'react';

const ROLES = [
  { id: 1, nombre: 'ADMIN' },
  { id: 2, nombre: 'EMPLEADO' }
];

export default function CrearUsuarioDrawer({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    password: '',
    rolId: 1
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!form.correo.trim()) errs.correo = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.correo)) errs.correo = 'Correo inválido';
    if (!form.password) errs.password = 'La contraseña es requerida';
    else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres';
    else if (form.password.length > 72) errs.password = 'Máximo 72 caracteres';
    if (!form.rolId) errs.rolId = 'El rol es requerido';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  return (
    <div className="drawer-overlay">
      <div className="drawer">
        <h2>Crear usuario</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre *
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
            {errors.nombre && <span className="field-error">{errors.nombre}</span>}
          </label>

          <label>
            Correo *
            <input
              type="email"
              value={form.correo}
              onChange={e => setForm({ ...form, correo: e.target.value })}
            />
            {errors.correo && <span className="field-error">{errors.correo}</span>}
          </label>

          <label>
            Teléfono
            <input
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
            />
          </label>

          <label>
            Contraseña temporal *
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <label>
            Rol *
            <select
              value={form.rolId}
              onChange={e => setForm({ ...form, rolId: parseInt(e.target.value) })}
            >
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            {errors.rolId && <span className="field-error">{errors.rolId}</span>}
          </label>

          <div className="drawer-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>

        <p className="note">
          El usuario se creará con estado activo y podrá iniciar sesión
          inmediatamente con el correo y contraseña ingresados.
        </p>
      </div>
    </div>
  );
}
```

### 5.4 Manejo de errores

**Validaciones del lado del frontend (antes de enviar):**

```javascript
function validarFormulario(datos) {
  const errores = {};

  if (!datos.nombre?.trim()) {
    errores.nombre = 'El nombre es obligatorio';
  }

  if (!datos.correo?.trim()) {
    errores.correo = 'El correo es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
    errores.correo = 'Formato de correo inválido';
  }

  if (!datos.password) {
    errores.password = 'La contraseña es obligatoria';
  } else if (datos.password.length < 8) {
    errores.password = 'La contraseña debe tener al menos 8 caracteres';
  } else if (datos.password.length > 72) {
    errores.password = 'La contraseña debe tener máximo 72 caracteres';
  }

  if (!datos.rolId) {
    errores.rolId = 'Debe seleccionar un rol';
  }

  return errores;
}
```

**Manejo de errores del backend:**

```javascript
try {
  const usuario = await crearUsuario(datos);
  // Success: mostrar toast, recargar lista, cerrar drawer
} catch (err) {
  if (err.status === 400) {
    if (err.body && typeof err.body === 'object') {
      // Errores de validación por campo (Bean Validation)
      // err.body = { nombre: "must not be blank", password: "size must be between 8 and 72" }
      setFieldErrors(err.body);
    } else {
      // Error de negocio: correo duplicado, rol inválido
      // err.body = "Ya existe un usuario con ese correo"
      mostrarAlerta(err.body || err.message);
    }
  } else if (err.status === 403) {
    // Sin permisos de ADMIN
    redirigirALogin();
  } else {
    mostrarAlerta('Error inesperado al crear usuario');
  }
}
```

---

## 6. Integración con el login existente

Después de crear un usuario LOCAL desde el panel de ADMIN, ese usuario puede:

1. Iniciar sesión con `POST /auth/login` (email + password)
2. Recibir un JWT
3. Usar ese JWT en `GET /api/usuarios/me` para obtener sus datos
4. Acceder a endpoints protegidos (si tiene rol ADMIN)

El flujo de login **no cambia**. El nuevo `POST /api/usuarios` es un endpoint administrativo separado.

---

## 7. Roles disponibles

Actualmente el sistema tiene estos roles en la DB:

| id_rol | nombre | Descripción |
|--------|--------|-------------|
| 1 | `ADMIN` | Acceso completo a todos los módulos |
| 2 | `EMPLEADO` | Acceso limitado (no puede acceder a la mayoría de módulos protegidos con `@PreAuthorize`) |

> **Nota para el frontend**: si vas a mostrar un selector de roles, podés obtener la lista desde `GET /api/roles` si existe ese endpoint, o hardcodear los valores conocidos mientras tanto. El backend valida que el `rolId` exista en la tabla `rol`.

---

## 8. Checklist de implementación

### Backend (ya implementado ✅)

- [x] POST /api/usuarios → 201
- [x] GET /api/usuarios → 200
- [x] PATCH /api/usuarios/{id}/estado → 200
- [x] GET /api/usuarios/me preservado
- [x] @PreAuthorize en endpoints nuevos
- [x] Password BCrypt, no plano
- [x] Password nunca en responses
- [x] Correo único case-insensitive
- [x] Autodesactivación bloqueada
- [x] Último ADMIN activo bloqueado

### Frontend (pendiente)

- [ ] Servicio API con `listarUsuarios()`, `crearUsuario()`, `cambiarEstado()`
- [ ] Pantalla con tabla de usuarios (nombre, correo, teléfono, rol, tipoAuth, estado)
- [ ] Botón "Crear usuario" que abre drawer/formulario
- [ ] Formulario de creación con: nombre, correo, teléfono, password, rol
- [ ] Validación client-side antes de enviar
- [ ] Manejo de errores 400 (validación por campo y errores de negocio)
- [ ] Manejo de 403 (redirigir a login)
- [ ] Botón activar/desactivar por usuario
- [ ] Protección contra autodesactivación (ocultar/deshabilitar botón para el usuario actual)
- [ ] Feedback visual al usuario (toast de éxito/error)
- [ ] Recargar lista después de crear o cambiar estado

### Verificación manual final

- [ ] ADMIN crea usuario LOCAL → 201
- [ ] Nuevo usuario hace login → 200 + JWT
- [ ] JWT funciona en GET /api/usuarios/me
- [ ] Listar usuarios muestra datos sin password
- [ ] Desactivar/activar usuario funciona
- [ ] Autodesactivación rechazada
- [ ] Sin rol ADMIN → 403
