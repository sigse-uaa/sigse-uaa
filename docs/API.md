# Contrato de API REST — SIGSE

- **Base URL local:** `http://localhost:3000/api`
- **Formato:** JSON UTF-8 (`application/json`) salvo subida de evidencias
  (`multipart/form-data`).
- **Autenticación:** `Authorization: Bearer <jwt>` en todas las rutas marcadas.
- **Fechas:** ISO 8601 en UTC (`2026-11-18T18:30:00.000Z`).
- **Evidencias:** `file_path` es relativo (`/uploads/archivo.jpg`); el cliente lo resuelve
  contra el origen del backend (`http://localhost:3000`).

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
| `400` | JSON malformado o parámetros inválidos |
| `401` | Token ausente, inválido o expirado |
| `403` | Sin permiso para la operación |
| `404` | Recurso inexistente |
| `409` | Conflicto (correo duplicado, categoría duplicada) |
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
{ "email": "usuario@uaa.mx", "password": "Usuario123!" }
```

**200**

```json
{
  "token": "eyJ...",
  "user": { "id": 2, "name": "Usuario Demo", "email": "usuario@uaa.mx", "role": "usuario" }
}
```

**401** credenciales inválidas · **403** usuario inactivo.

### `GET /auth/me` — autenticado

**200**

```json
{ "user": { "id": 2, "name": "Usuario Demo", "email": "usuario@uaa.mx", "role": "usuario", "isActive": true } }
```

---

## 5. Usuarios

### `GET /users` — operador

Lista usuarios activos. Filtros: `?role=operador`, `?q=texto`.

```json
{
  "data": [
    { "id": 1, "name": "Operador Demo", "email": "operador@uaa.mx", "role": "operador", "isActive": true }
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
{ "name": "Nuevo Operador", "email": "operador2@uaa.mx", "password": "Operador123!" }
```

**201** con el usuario creado.

---

## 6. Categorías

### `GET /categories` — autenticado

Devuelve categorías activas. `?includeInactive=true` solo para operador.

```json
{
  "data": [
    { "id": 1, "name": "Evacuación", "description": "Rutas y salidas de emergencia", "color": "#D32F2F", "icon": "exit_to_app", "isActive": true }
  ]
}
```

### `POST /categories` — operador

```json
{ "name": "Informativa", "description": "Señales informativas", "color": "#1976D2", "icon": "info" }
```

**201** · **409** si el nombre existe.

### `PATCH /categories/:id` — operador

```json
{ "name": "Informativa y direccional", "isActive": false }
```

**200** con la categoría actualizada.

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
| `from` / `to` | ISO date | — | Rango de creación |
| `page` | int | 1 | Página |
| `limit` | int | 20 | Máx. 50 |
| `sort` | enum | `created_at` | `created_at`, `updated_at`, `priority` |
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
      "createdBy": { "id": 2, "name": "Usuario Demo" },
      "assignedTo": null,
      "building": "Edificio 14",
      "area": "Pasillo norte",
      "latitude": 21.8847,
      "longitude": -102.3157,
      "createdAt": "2026-11-18T18:30:00.000Z",
      "updatedAt": "2026-11-18T18:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 7.2 `POST /inspections` — autenticado

El creador queda como `created_by`; estado inicial `pendiente`.

```json
{
  "title": "Señal de evacuación obstruida",
  "description": "La señal del pasillo está tapada por un mueble.",
  "categoryId": 1,
  "priority": "alta",
  "building": "Edificio 14",
  "area": "Pasillo norte",
  "reference": "Frente al aula 204",
  "latitude": 21.8847,
  "longitude": -102.3157,
  "tiltDegrees": 3.5
}
```

**201** con la inspección creada (incluye `folio`). Registra historial `creacion`.

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
    "createdBy": { "id": 2, "name": "Usuario Demo" },
    "assignedTo": { "id": 1, "name": "Operador Demo" },
    "building": "Edificio 14",
    "area": "Pasillo norte",
    "reference": "Frente al aula 204",
    "latitude": 21.8847,
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
        "filePath": "/uploads/1731950000000-abc.jpg",
        "originalName": "senal.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 245000,
        "description": "Vista frontal",
        "uploadedBy": { "id": 2, "name": "Usuario Demo" },
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
        "changedBy": { "id": 2, "name": "Usuario Demo" },
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

**200** con la inspección actualizada. **403** si ya no está permitido editar. **422** si el
estado no lo permite. Registra historial `actualizacion`.

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

**200** con la inspección actualizada. **403** rol no permitido. **422** transición inválida o
regla incumplida. Registra historial.

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
    "filePath": "/uploads/1731951111111-def.jpg",
    "originalName": "senal.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 210000,
    "description": "Después de la atención",
    "createdAt": "2026-11-18T19:30:00.000Z"
  }
}
```

**413** archivo demasiado grande · **415** tipo no permitido · **422** inspección cancelada.

### 7.7 `DELETE /inspections/:id/evidences/:evidenceId` — autor u operador

Elimina la fila y el archivo físico. **204**. **403** si no es autor ni operador.

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
      "changedBy": { "id": 1, "name": "Operador Demo" },
      "createdAt": "2026-11-18T19:10:00.000Z"
    }
  ]
}
```

### 7.9 `GET /inspections/stats/summary` — autenticado

Conteos para el dashboard. El usuario ve solo sus datos; el operador ve todo.

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

## 8. Archivos estáticos

`GET /uploads/<archivo>` sirve las evidencias. En producción se debe restringir el acceso si
los datos son sensibles; para la demo académica es aceptable con nombres aleatorios.

---

## 9. Ejemplos con `curl`

```bash
BASE=http://localhost:3000/api

# Login
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"operador@uaa.mx","password":"Operador123!"}' | jq -r .token)

# Listar inspecciones
curl -s "$BASE/inspections?status=pendiente&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# Crear inspección
curl -s -X POST "$BASE/inspections" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Señal dañada","description":"La lámpara no enciende","categoryId":1,"priority":"alta","latitude":21.8847,"longitude":-102.3157}' | jq

# Subir evidencia
curl -s -X POST "$BASE/inspections/12/evidences" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@senal.jpg" -F "description=Vista frontal" | jq

# Finalizar (regla de negocio)
curl -s -X PATCH "$BASE/inspections/12/status" \
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
