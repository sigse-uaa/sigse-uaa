# Contrato de API REST — SIGSE

- **Base URL local:** `http://localhost:3000/api`
- **Formato:** JSON UTF-8 (`application/json`) salvo subida de evidencias
  (`multipart/form-data`).
- **Autenticación:** `Authorization: Bearer <jwt>` en todas las rutas marcadas.
- **Fechas:** ISO 8601 en UTC (`2026-11-18T18:30:00.000Z`).
- **Evidencias:** `filePath` es relativo (`/uploads/archivo.jpg`). El cliente lo resuelve
  contra el origen del backend (`http://localhost:3000`) y envía el mismo token Bearer al descargar.

---

## 0. Convenciones de nombres

- **Base de datos:** columnas en `snake_case` (`created_at`, `category_id`).
- **API (JSON, query params y valores de `sort`):** `camelCase` (`createdAt`, `categoryId`).
- La traducción fila → JSON se hace **solo** en `backend/src/serializers.js`; ningún otro
  archivo arma respuestas con nombres de columna.
- Los **valores de dominio** (estados como `en_proceso`, acciones como `cambio_estado`,
  roles, prioridades) no cambian: son datos, no nombres de campo.

---

## 1. Formato de error

```json
{
  "error": {
    "message": "Texto apto para mostrar al usuario",
    "code": "VALIDATION_ERROR",
    "details": [
      { "path": "email", "message": "Correo inválido" }
    ]
  }
}
```

| Código HTTP | Uso |
| --- | --- |
| `200` | Consulta/actualización correcta |
| `201` | Recurso creado |
| `204` | Sin contenido (borrado lógico) |
| `400` | JSON malformado (`INVALID_JSON`) o multipart malformado (`INVALID_MULTIPART`) |
| `401` | Token ausente, inválido o expirado |
| `403` | Sin permiso para la operación |
| `404` | Recurso inexistente |
| `409` | Conflicto (correo duplicado, categoría duplicada) |
| `413` | Archivo de más de 8 MB (`FILE_TOO_LARGE`) o cuerpo JSON demasiado grande (`PAYLOAD_TOO_LARGE`) |
| `415` | Tipo de archivo no permitido (`UNSUPPORTED_FILE_TYPE`) |
| `422` | Validación o regla de negocio incumplida |
| `500` | Error no controlado |
| `503` | MySQL no está disponible para la comprobación de salud |

---

## 2. Roles

| Rol | Descripción |
| --- | --- |
| `usuario` | Reporta y consulta sus inspecciones; cancela las propias pendientes |
| `operador` | Ve todo, asigna, atiende, cambia estados, finaliza y administra catálogos |

Los permisos **siempre** se validan en el backend.

---

## 3. Salud

### `GET /health` — público

```json
{ "status": "ok", "service": "sigse-api", "uptime": 123.45, "timestamp": "..." }
```

### `GET /health/db` — público

```json
{ "status": "ok", "database": "connected" }
```

Devuelve `503` con el código `DATABASE_UNAVAILABLE` si MySQL no responde.

---

## 4. Autenticación

### `POST /auth/register` — público

Crea un usuario con rol `usuario` (el rol enviado se ignora).

```json
{
  "name": "Ana López",
  "email": "ana@uaa.mx",
  "password": "Secreta123!"
}
```

Reglas: nombre 3–120, correo válido, contraseña ≥ 8 con al menos una letra y un número.

**201**

```json
{
  "token": "eyJ...",
  "user": {
    "id": 4,
    "name": "Ana López",
    "email": "ana@uaa.mx",
    "role": "usuario"
  }
}
```

**409** si el correo ya existe · **422** si no cumple validación.

### `POST /auth/login` — público

```json
{ "email": "usuario@example.com", "password": "SigseDemo2026!" }
```

**200**

```json
{
  "token": "eyJ...",
  "user": { "id": 3, "name": "Usuario Demo", "email": "usuario@example.com", "role": "usuario" }
}
```

**401** credenciales inválidas · **403** usuario inactivo.

**Códigos de error de autenticación** (campo `error.code`):

| HTTP | `code` | Cuándo |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Datos inválidos; `details` trae `{ path, message }` por campo |
| `409` | `EMAIL_TAKEN` | El correo ya está registrado (`/auth/register`) |
| `401` | `INVALID_CREDENTIALS` | Correo o contraseña incorrectos (misma respuesta para correo inexistente) |
| `403` | `USER_INACTIVE` | Cuenta desactivada (`/auth/login` o token de un usuario dado de baja) |
| `401` | `MISSING_TOKEN` | Falta la cabecera `Authorization: Bearer <jwt>` |
| `401` | `INVALID_TOKEN` | Token malformado, expirado, firmado con otro secreto, o usuario inexistente |
| `403` | `FORBIDDEN` | El rol no puede realizar la operación |

El correo se normaliza (sin espacios y en minúsculas) tanto en el registro como en el login.
La contraseña admite hasta 72 **bytes** (límite de bcrypt): con acentos o emojis caben menos de 72 caracteres.

### `GET /auth/me` — autenticado

**200**

```json
{ "user": { "id": 3, "name": "Usuario Demo", "email": "usuario@example.com", "role": "usuario" } }
```

---

## 5. Usuarios

### `GET /users` — operador

Lista usuarios activos. Filtros: `?role=operador`, `?q=texto`.

```json
{
  "data": [
    { "id": 1, "name": "Operador Demo 1", "email": "operador1@example.com", "role": "operador" }
  ]
}
```

### `GET /users/me` — autenticado

Igual que `/auth/me`.

### `PATCH /users/me` — autenticado

```json
{ "name": "Nombre actualizado", "currentPassword": "...", "newPassword": "Nueva123!" }
```

Todos los campos son opcionales. Si se cambia la contraseña, se exige `currentPassword`.
**200** con el usuario actualizado.

### `POST /users` — operador

Crea un operador.

```json
{ "name": "Nuevo Operador", "email": "operador3@example.com", "password": "Operador123!" }
```

**201** con `{ "user": { ... } }` y el rol `operador`. **409 `EMAIL_TAKEN`** si el correo existe.

---

## 6. Categorías

### `GET /categories` — autenticado

Devuelve categorías activas. `?includeInactive=true` solo para operador.

```json
{
  "data": [
    { "id": 1, "name": "Evacuación", "description": "Salidas de emergencia, señalización y puntos de reunión.", "color": "#2E7D32", "icon": "exit_to_app", "isActive": true }
  ]
}
```

### `POST /categories` — operador

```json
{ "name": "Informativa", "description": "Señales informativas", "color": "#1976D2", "icon": "info" }
```

**201** con `{ "data": { ... } }`. **409 `CATEGORY_NAME_TAKEN`** si el nombre existe.

### `PATCH /categories/:id` — operador

```json
{ "name": "Informativa y direccional", "isActive": false }
```

**200** con `{ "data": { ... } }`. **404 `NOT_FOUND`** si no existe y **409 `CATEGORY_NAME_TAKEN`** si el nombre ya está en uso.

### `DELETE /categories/:id` — operador

Baja lógica (`is_active = 0`). **204**. No borra inspecciones históricas.

---

## 7. Inspecciones

### 7.1 `GET /inspections` — autenticado

Lista paginada. El usuario general solo ve las suyas; el operador ve todas.

**Query params**

| Parámetro | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `q` | string | — | Busca en folio, título, descripción, edificio y referencia |
| `status` | enum | — | `pendiente`, `asignada`, `en_proceso`, `finalizada`, `cancelada` |
| `categoryId` | int | — | Filtra por categoría |
| `priority` | enum | — | `baja`, `media`, `alta` |
| `assignedToMe` | bool | false | Solo asignadas al operador actual |
| `mine` | bool | false | Solo creadas por el usuario actual |
| `from` / `to` | fecha ISO `YYYY-MM-DD` | — | Rango de creación en UTC, con ambos días incluidos |
| `page` | int | 1 | Página |
| `limit` | int | 20 | Máx. 50 |
| `sort` | enum | `createdAt` | `createdAt`, `updatedAt`, `priority`. También se aceptan `created_at` y `updated_at`. |
| `order` | enum | `desc` | `asc`, `desc` |

**200**

```json
{
  "data": [
    {
      "id": 12,
      "folio": "SIG-2026-00012",
      "title": "Extintor sin señalización",
      "status": "pendiente",
      "priority": "alta",
      "category": { "id": 3, "name": "Equipo contra incendio" },
      "createdBy": { "id": 3, "name": "Usuario Demo" },
      "assignedTo": null,
      "building": "Edificio 14",
      "area": "Pasillo norte",
      "latitude": 21.9131,
      "longitude": -102.3157,
      "createdAt": "2026-11-18T18:30:00.000Z",
      "updatedAt": "2026-11-18T18:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 7.2 `POST /inspections` — autenticado

Los campos obligatorios son `title`, `description` y `categoryId`. La categoría debe estar
activa. El servidor toma el creador del JWT y fija el estado inicial en `pendiente`.
Si se omite la prioridad, usa `media`.

```json
{
  "title": "Señal de evacuación obstruida",
  "description": "La señal del pasillo está tapada por un mueble.",
  "categoryId": 1,
  "priority": "alta",
  "building": "Edificio 14",
  "area": "Pasillo norte",
  "reference": "Frente al aula 204",
  "latitude": 21.9131,
  "longitude": -102.3157,
  "tiltDegrees": 3.5
}
```

**201** con `{ "data": { ... } }` (sin `evidences` ni `history`), el encabezado `Location` y un folio `SIG-AAAA-ID` con
el ID rellenado a al menos cinco dígitos. Guarda el registro y el evento `creacion` en la
misma transacción. Devuelve **422** si la categoría no existe o está inactiva.

### 7.3 `GET /inspections/:id` — dueño u operador

**200**

```json
{
  "data": {
    "id": 12,
    "folio": "SIG-2026-00012",
    "title": "Señal de evacuación obstruida",
    "description": "...",
    "status": "en_proceso",
    "priority": "alta",
    "category": { "id": 1, "name": "Evacuación" },
    "createdBy": { "id": 3, "name": "Usuario Demo" },
    "assignedTo": { "id": 1, "name": "Operador Demo 1" },
    "building": "Edificio 14",
    "area": "Pasillo norte",
    "reference": "Frente al aula 204",
    "latitude": 21.9131,
    "longitude": -102.3157,
    "tiltDegrees": 3.5,
    "reviewResult": null,
    "finalCondition": null,
    "assignedAt": "2026-11-18T19:00:00.000Z",
    "startedAt": "2026-11-18T19:10:00.000Z",
    "finishedAt": null,
    "cancelledAt": null,
    "createdAt": "2026-11-18T18:30:00.000Z",
    "updatedAt": "2026-11-18T19:10:00.000Z",
    "evidences": [
      {
        "id": 5,
        "type": "foto",
        "filePath": "/uploads/3f2b9c1e-7a4d-4c2b-9b8e-1d5f6a7c8e90.jpg",
        "originalName": "senal.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 245000,
        "description": "Vista frontal",
        "uploadedBy": { "id": 3, "name": "Usuario Demo" },
        "createdAt": "2026-11-18T18:35:00.000Z"
      }
    ],
    "history": [
      {
        "id": 30,
        "action": "creacion",
        "previousStatus": null,
        "newStatus": "pendiente",
        "comment": "Inspección registrada",
        "changedBy": { "id": 3, "name": "Usuario Demo" },
        "createdAt": "2026-11-18T18:30:00.000Z"
      }
    ]
  }
}
```

**403** si un usuario intenta ver una ajena · **404** si no existe.

### 7.4 `PATCH /inspections/:id` — dueño (pendiente) u operador

Campos editables: `title`, `description`, `categoryId`, `priority`, `building`, `area`,
`reference`, `latitude`, `longitude`, `tiltDegrees`.

```json
{ "title": "Señal obstruida por mueble", "priority": "media" }
```

**200** con la inspección actualizada en `data` (mismos campos que el detalle, pero sin
`evidences` ni `history`; para verlos, usa `GET /inspections/:id`). Un usuario general solo puede editar sus
inspecciones pendientes. Operadores pueden editar cualquier inspección en curso. Devuelve
**403** si no hay permiso y **422** si un operador intenta editar una inspección finalizada
o cancelada. Registra historial `actualizacion`.

### 7.5 `PATCH /inspections/:id/status` — operador / dueño (cancelar)

Body según transición:

**Asignar**

```json
{ "status": "asignada", "assignedTo": 1, "comment": "Se asigna al turno matutino" }
```

**Iniciar**

```json
{ "status": "en_proceso", "comment": "Se inicia revisión en sitio" }
```

**Finalizar** (regla de negocio)

```json
{
  "status": "finalizada",
  "reviewResult": "Se retiró el obstáculo y se verificó la visibilidad de la señal.",
  "finalCondition": "buena",
  "comment": "Atención concluida"
}
```

**Cancelar**

```json
{ "status": "cancelada", "comment": "Reporte duplicado" }
```

**Transiciones válidas**

| Desde | Hacia | Quién |
| --- | --- | --- |
| `pendiente` | `asignada` | operador |
| `asignada` | `en_proceso` | operador |
| `en_proceso` | `finalizada` | operador |
| `pendiente` | `cancelada` | dueño u operador |
| `asignada` | `cancelada` | operador |
| `en_proceso` | `cancelada` | operador |

**Regla:** para `finalizada`, `reviewResult` debe tener al menos 10 caracteres y
`finalCondition` debe ser `buena`, `regular`, `mala` o `reemplazada`. Si falta algo → **422**.

**200** con la inspección actualizada en `data` (mismos campos que el detalle, pero sin
`evidences` ni `history`; para verlos, usa `GET /inspections/:id`). **403** rol no permitido. **422** transición
inválida o regla incumplida. Al asignar, el destino debe ser un operador activo. Cada cambio
se guarda junto con su historial en una transacción. La cancelación conserva la inspección y
sus datos.

### 7.6 `POST /inspections/:id/evidences` — dueño u operador

`multipart/form-data`:

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `file` | archivo | sí | Imagen JPG/PNG/WebP/HEIC o PDF, ≤ 8 MB |
| `description` | texto | no | Nota breve |

**201**

```json
{
  "data": {
    "id": 6,
    "type": "foto",
    "filePath": "/uploads/8c1d2e3f-4a5b-4c6d-8e7f-90a1b2c3d4e5.jpg",
    "originalName": "senal.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 210000,
    "description": "Después de la atención",
    "uploadedBy": { "id": 1, "name": "Operador Demo 1" },
    "createdAt": "2026-11-18T19:30:00.000Z"
  }
}
```

El servidor reconoce el formato por el contenido del archivo. Registra la subida en el historial.
**413** archivo demasiado grande · **415** tipo no permitido · **422** inspección cancelada
o archivo ausente.

### 7.7 `DELETE /inspections/:id/evidences/:evidenceId` — autor u operador

Elimina la fila, registra el evento en el historial e intenta borrar el archivo en disco.
**204**. **403** si no es autor ni operador. Una vez confirmado el borrado en MySQL, el
archivo ya no se puede descargar.

### 7.8 `GET /inspections/:id/history` — dueño u operador

```json
{
  "data": [
    {
      "id": 30,
      "action": "cambio_estado",
      "previousStatus": "asignada",
      "newStatus": "en_proceso",
      "comment": "Se inicia revisión en sitio",
      "changedBy": { "id": 1, "name": "Operador Demo 1" },
      "createdAt": "2026-11-18T19:10:00.000Z"
    }
  ]
}
```

### 7.9 `GET /inspections/stats/summary` — autenticado

Conteos para el dashboard. El usuario ve solo sus datos y el operador ve todo.
`last7Days` cuenta las creadas en los siete días anteriores. `pendingAssignedToMe` cuenta
las inspecciones del operador autenticado con estado `asignada` o `en_proceso`.

```json
{
  "data": {
    "total": 18,
    "byStatus": {
      "pendiente": 5,
      "asignada": 4,
      "en_proceso": 3,
      "finalizada": 5,
      "cancelada": 1
    },
    "byPriority": { "baja": 6, "media": 8, "alta": 4 },
    "last7Days": 7,
    "pendingAssignedToMe": 2
  }
}
```

> **Orden de rutas:** `stats/summary` debe declararse antes de `/:id` en Express.

---

## 8. Descarga de evidencias

`GET /uploads/<archivo>` exige `Authorization: Bearer <jwt>`. El dueño de la inspección o un
operador puede descargar el archivo. Responde **403** si la inspección es ajena y **404** si
la evidencia o su archivo no existe. Los PDF se envían como descarga y los ejemplos del seed
no traen archivos en disco.

---

## 9. Ejemplos con `curl`

```bash
BASE=http://localhost:3000/api

# Login
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"operador1@example.com","password":"SigseDemo2026!"}' | jq -r .token)

# Listar inspecciones
curl -s "$BASE/inspections?status=pendiente&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# Crear inspección
curl -s -X POST "$BASE/inspections" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Señal dañada","description":"La lámpara no enciende","categoryId":1,"priority":"alta","latitude":21.9131,"longitude":-102.3157}' | jq

# Subir evidencia (la inspección 3 del seed está en_proceso)
curl -s -X POST "$BASE/inspections/3/evidences" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@senal.jpg" -F "description=Vista frontal" | jq

# Finalizar (regla de negocio)
curl -s -X PATCH "$BASE/inspections/3/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"finalizada","reviewResult":"Se reemplazó la señal y se verificó","finalCondition":"reemplazada"}' | jq
```

---

## 10. Cambios de contrato

Cualquier cambio (campo, código, ruta) debe:

1. Actualizar este documento.
2. Avisar en el Issue/PR.
3. Ajustar modelos Flutter y pruebas.
4. Registrarse en `docs/PLAN_TRABAJO.md` si es estructural.
