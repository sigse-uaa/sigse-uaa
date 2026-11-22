# Plan de pruebas — SIGSE

> Basado en la sección 9 del PDF. Cada prueba debe dejar **evidencia** (captura, video corto o
> log) y registrarse en la tabla correspondiente. Responsable global: todo el equipo; cada
> prueba tiene un dueño de ejecución y otro de verificación.

---

## 1. Preparación

### 1.1 Entornos

| Entorno | Uso |
| --- | --- |
| Local | Desarrollo diario (MySQL Docker + API local + Flutter) |
| Desplegado | Pruebas 9.1–9.3 con web + Android |
| Dispositivo físico | Cámara, GPS, acelerómetro, permisos |

### 1.2 Datos

- Reiniciar base con `docker compose down -v && docker compose up -d db`.
- Usuarios demo: operador y usuario (ver `README.md`).
- Crear al menos 3 inspecciones en estados distintos para probar filtros.
- No usar datos personales reales.

### 1.3 Herramientas

- `curl` / Postman / Bruno para API.
- Chrome DevTools para red y offline.
- `adb logcat` para Android.
- Capturas con nombre `prueba-9.X-paso-N-fecha.png`.

---

## 2. Pruebas obligatorias del PDF

### 9.1 Comunicación entre dispositivos

| Paso | Acción | Resultado esperado | Evidencia |
| --- | --- | --- | --- |
| 1 | Iniciar sesión en dispositivo A (web) | Entra al dashboard | Captura |
| 2 | Iniciar sesión en dispositivo B (Android) con otro usuario | Entra al dashboard | Captura |
| 3 | Crear inspección en A con foto y ubicación | Se guarda con folio y estado `pendiente` | Captura + JSON |
| 4 | Consultar desde B (operador) | La inspección aparece con datos reales | Captura |
| 5 | Modificar estado desde B (`asignada` o `en_proceso`) | Cambia el estado y se registra historial | Captura |
| 6 | Recargar en A | A ve el estado actualizado | Captura |
| 7 | Finalizar desde B con resultado y condición | A ve `finalizada` e historial | Video |

**Dueño:** Alonso · **Verifica:** Diana · **Fecha:** ____ · **Estado:** ⬜

### 9.2 Persistencia

| Paso | Acción | Resultado esperado |
| --- | --- | --- |
| 1 | Registrar inspección | `201` y fila en MySQL |
| 2 | Reiniciar API (`Ctrl+C` + `npm run dev`) | Servicio vuelve a levantar |
| 3 | Reiniciar MySQL (`docker compose restart db`) | Contenedor saludable |
| 4 | Consultar la inspección | Sigue existiendo con los mismos datos |
| 5 | Verificar evidencia | Archivo sigue en `/uploads` |

**Dueño:** Diana · **Verifica:** Edson · **Fecha:** ____ · **Estado:** ⬜

### 9.3 Conexión / offline

| Paso | Acción | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la app con red y cargar el listado | Datos desde API y caché actualizada |
| 2 | Activar modo avión / DevTools Offline | La app **no se cierra** |
| 3 | Navegar al listado | Muestra caché con aviso “Sin conexión” |
| 4 | Intentar crear/editar | Mensaje claro; no se pierde el formulario |
| 5 | Restaurar conexión y refrescar | Datos actualizados, aviso desaparece |

**Dueño:** Edson · **Verifica:** Alonso · **Fecha:** ____ · **Estado:** ⬜

### 9.4 Recursos móviles

| Recurso | Acción | Resultado esperado | Plataforma |
| --- | --- | --- | --- |
| Cámara | Tomar foto en el formulario | Miniatura y subida correcta | Android |
| Galería | Elegir imagen existente | Se adjunta y sube | Android/Web |
| Geolocalización | Obtener ubicación | Lat/lng y precisión visibles | Android/Web |
| Permisos | Denegar cámara/ubicación | Mensaje explicativo y opción de reintentar | Android |
| Mapa | Ver ubicación en detalle | Marcador en OSM | Android/Web |
| Acelerómetro | Medir inclinación de la señal | Ángulo mostrado y guardado (`tilt_degrees`) | Android |
| Gestos | Pull-to-refresh, swipe, long-press | Acciones funcionan sin errores | Android |
| Animaciones | Abrir detalle / cambiar estado | Transiciones fluidas | Todas |

**Dueño:** Alonso · **Verifica:** Edson · **Fecha:** ____ · **Estado:** ⬜

### 9.5 Validaciones y reglas

| Caso | Entrada | Resultado esperado |
| --- | --- | --- |
| Formulario vacío | Sin título/descripción | Errores en UI; no envía |
| Correo inválido | `abc` | Error de validación |
| Contraseña débil | `123` | Error; mínimo 8 con letra y número |
| Rol indebido | Usuario intenta `PATCH /status` | `403` |
| Ver ajeno | Usuario intenta `GET /inspections/:id` de otro | `403` |
| Transición inválida | `pendiente → finalizada` | `422` |
| Regla de negocio | Finalizar sin `review_result` | `422` + mensaje claro |
| Condición inválida | `finalCondition: "excelente"` | `422` |
| Archivo grande | Imagen > 8 MB | `413` |
| Tipo no permitido | `.exe` | `415` |
| Token expirado | JWT vencido | `401` + regreso a login |
| API caída | Detener backend | UI informa, no se cierra |

**Dueño:** Diana · **Verifica:** Alonso · **Fecha:** ____ · **Estado:** ⬜

---

## 3. Matriz de transiciones (API)

| # | Estado inicial | Acción | Rol | Esperado |
| --- | --- | --- | --- | --- |
| T1 | `pendiente` | asignar a operador | operador | `200` → `asignada` |
| T2 | `pendiente` | iniciar | operador | `422` |
| T3 | `pendiente` | finalizar | operador | `422` |
| T4 | `asignada` | iniciar | operador | `200` → `en_proceso` |
| T5 | `asignada` | finalizar | operador | `422` |
| T6 | `en_proceso` | finalizar sin resultado | operador | `422` |
| T7 | `en_proceso` | finalizar sin condición | operador | `422` |
| T8 | `en_proceso` | finalizar con ambos | operador | `200` → `finalizada` |
| T9 | `pendiente` | cancelar | dueño | `200` → `cancelada` |
| T10 | `asignada` | cancelar | dueño | `403` |
| T11 | `asignada` | cancelar | operador | `200` → `cancelada` |
| T12 | `finalizada` | cualquier cambio | operador | `422` |
| T13 | `cancelada` | cualquier cambio | operador | `422` |
| T14 | `pendiente` | asignar a usuario general | operador | `422` |

---

## 4. Pruebas automatizadas

### Backend

```bash
cd backend
npm test
```

Cobertura mínima esperada:

- `GET /api/health` → 200.
- Validadores de auth (correo, contraseña).
- Regla de finalización (servicio).
- Transiciones válidas/inválidas (servicio).
- Permisos por rol (middleware).
- A1: creación con folio e historial, permisos de listado y edición, transiciones concurrentes,
  finalización, subida/descarga/borrado y conteos. El CI levanta MySQL 8.4 para esta suite.
  En local, configúrala con `A1_TEST_MYSQL_PORT` y `A1_TEST_MYSQL_PASSWORD` apuntando a una
  instancia de pruebas en `127.0.0.1`. La suite crea un esquema temporal y carga el SQL del repo.

### Flutter

```bash
cd app
flutter test
```

Cobertura mínima esperada:

- Validadores de formularios.
- Serialización/deserialización de modelos.
- `ApiException` → mensaje amigable.
- Widget smoke test del login.

### Análisis estático

```bash
cd app && flutter analyze
cd backend && npm test
```

---

## 5. Pruebas manuales por pantalla

| Pantalla | Casos mínimos |
| --- | --- |
| Login | credenciales válidas, inválidas, campos vacíos, sin red |
| Registro | correo duplicado, contraseña débil, éxito |
| Inicio | carga de conteos, rol usuario vs operador, sin red |
| Listado | paginación, búsqueda, filtros, vacío, error, caché |
| Detalle | datos, mapa, evidencias, historial, permisos |
| Formulario | validaciones, cámara, galería, GPS, acelerómetro, edición |
| Panel operador | asignar, iniciar, finalizar (regla), cancelar |
| Perfil | cambiar nombre, tema, cerrar sesión, limpiar caché |

---

## 6. Pruebas multiplataforma

| Plataforma | Versión | Responsable | Estado |
| --- | --- | --- | --- |
| Android físico | ____ | Alonso | ⬜ |
| Android emulador | ____ | Diana | ⬜ |
| Web Chrome | ____ | Edson | ⬜ |
| Web Firefox/Edge | ____ | Edson | ⬜ |
| Linux escritorio | ____ | Edson | ⬜ |
| Windows escritorio | ____ | ____ | ⬜ |

---

## 7. Gestión de defectos

1. Detectar → crear Issue con plantilla de bug.
2. Etiquetar `type:bug` + `area:*` + prioridad.
3. Asignar a responsable del módulo.
4. Corregir en rama `fix/...` + PR.
5. Añadir prueba de regresión.
6. Verificar y cerrar.

**Plantilla mínima:** pasos para reproducir, resultado esperado, resultado actual, evidencia,
entorno (dispositivo/SO/versión), severidad.

---

## 8. Evidencia final

- Carpeta `docs/evidencias/` (capturas) o enlace a video.
- Matriz 9.1–9.5 completa con fechas y firmas.
- Resultados de `npm test` y `flutter test` (captura).
- Checklist de despliegue firmado.
- Enlace a Issues/PRs de bugs encontrados.
