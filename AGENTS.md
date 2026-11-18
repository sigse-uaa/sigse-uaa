# AGENTS.md — Contexto operativo de SIGSE

> **Memoria de trabajo del proyecto.** Cualquier asistente de IA (opencode, Claude, Copilot,
> etc.) debe leerlo completo antes de tocar el repositorio y **actualizarlo al terminar cada
> sesión**. Es la fuente de verdad sobre decisiones, estado, comandos y pendientes.

- Última actualización: **2026-11-18**
- Actualizado por: Edson Leonardo Sánchez Montalvo (con asistencia de IA)
- Fase actual: **Fase 0 — base documental y planeación** (sin código de implementación)
- Rama de trabajo: `main` (protegida) → usar ramas cortas para cambios

---

## 1. Resumen del proyecto

**SIGSE** es un sistema multiplataforma para inspeccionar señalización, rutas de circulación y
elementos de seguridad en espacios universitarios. Es el sistema n.º 9 del proyecto final de
*Programación de Dispositivos Móviles* (UAA, ago–dic 2026).

- **Usuario general:** registra inspecciones con foto, ubicación y observaciones; consulta sus
  registros, su estado y su historial. Puede cancelar las propias mientras estén pendientes.
- **Operador:** ve todas las inspecciones, asigna responsables, cambia estados y finaliza.
- **Regla de negocio obligatoria:** al pasar a `finalizada` deben existir `review_result`
  (resultado de la revisión) y `final_condition` (condición final de la señalización). Se
  valida en el backend; un `CHECK` de MySQL refuerza la integridad.
- **Flujo de estados:** `pendiente → asignada → en_proceso → finalizada`; `cancelada` es una
  salida permitida desde los tres primeros estados. Transiciones validadas en el backend y
  registradas en `inspection_history`.

## 2. Equipo y propiedad del trabajo

| Persona | Rol principal | Módulos de propiedad |
| --- | --- | --- |
| **Edson Leonardo Sánchez Montalvo** | Líder técnico / integración | repo, GitHub, CI, core Flutter, auth UI, perfil, builds y despliegue, reporte |
| **Diana Ruth Gutiérrez Márquez** | Datos y backend de identidad | modelo de datos, seed, auth/usuarios/roles/categorías, listado/detalle Flutter, caché local |
| **Alonso Herrera Benavides** | Núcleo operativo y recursos móviles | inspecciones/evidencias/historial/estados en backend, formulario, panel operador, cámara/geo/sensor |

**Regla de equidad:** las tareas se reparten ~33 % por persona. Todos revisan PRs de otros y
todos deben poder explicar cualquier componente en la defensa. El detalle y estimaciones está
en `docs/PLAN_TRABAJO.md`.

## 3. Stack y decisiones vigentes (ADR resumido)

| Decisión | Elección | Motivo |
| --- | --- | --- |
| Cliente | Flutter + Dart, Material 3 | Requisito de la materia; Android, web y escritorio con un código |
| Estado | Provider + ChangeNotifier | Simple, oficial, fácil de defender |
| Backend | Node.js 22 + Express (CommonJS) | Rápido, equipo lo conoce, despliegue sencillo |
| DB | MySQL 8 | Requisito relacional; disponible local/Docker |
| Auth | JWT + bcryptjs | Estándar, sin estado, roles verificados en backend |
| Validación | Zod | Esquemas declarativos y mensajes claros |
| Archivos | Multer a `backend/uploads` | Simple para la demo; requiere volumen persistente |
| Mapas | `flutter_map` + OpenStreetMap | Sin API keys ni tarjeta |
| Cache local | `shared_preferences` (JSON) | Multiplataforma real, suficiente para offline de lectura |
| Git | trunk-based con `main` protegida y PRs | Cumple requisitos de GitHub del PDF |
| Repositorio | `sigse-uaa` dentro de una organización de GitHub | Requisito 8.1 |

Cualquier cambio a estas decisiones debe registrarse en la sección 9 (bitácora) y, si es
estructural, en `docs/ARQUITECTURA.md`.

## 4. Mapa actual del repositorio

```text
.
├── README.md                 presentación y estado
├── AGENTS.md                 este archivo
├── CONTRIBUTING.md           reglas para contribuir
├── .editorconfig
├── .gitignore
├── .github/
│   ├── ISSUE_TEMPLATE/       bug, feature, task y configuración
│   └── pull_request_template.md
├── docs/
│   ├── PLAN_TRABAJO.md       alcance, calendario, reparto 34/33/33 y backlog
│   ├── GIT_WORKFLOW.md       ramas, commits, PRs, revisiones y protecciones
│   ├── ARQUITECTURA.md       componentes, capas, offline, móvil y despliegue
│   ├── MODELO_DATOS.md       ER, diccionario, estados y permisos
│   ├── API.md                contrato REST completo
│   ├── PRUEBAS.md            pruebas 9.1–9.5 y matriz de estados
│   ├── REPORTE_TECNICO.md    estructura del reporte y guion de defensa
│   └── requisitos/           PDF original y requisitos convertidos a Markdown
├── Programacion_Movil_Proyecto_Final.pdf   fuente original
└── proyecto9.md              resumen del sistema elegido
```

**Aún no existen** `app/`, `backend/`, `database/` ni `docker-compose.yml`. Se crearán en los
sprints 0–1 por los responsables del plan y entrarán por PR. La estructura prevista está en
`README.md` y `docs/ARQUITECTURA.md`.

## 5. Comandos de referencia (cuando exista código)

> En la base actual no hay proyectos que ejecutar. Estos comandos se activan cuando los
> responsables integren `app/`, `backend/` y `database/`.

```bash
# Base de datos (Sprint 0–1, Diana)
docker compose up -d db

# Backend (Sprint 1, Diana/Alonso)
cd backend
cp .env.example .env
npm install
npm run dev
npm test

# App (Sprint 1, Edson/Diana/Alonso)
cd app
flutter pub get
flutter analyze
flutter test
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api

# Git (nunca push a main)
git switch main && git pull --ff-only
git switch -c feature/mi-tarea
git add -p && git commit -m "feat(scope): descripción"
git push -u origin feature/mi-tarea
```

## 6. Contrato de API (planificado)

Base: `/api` · Auth: `Authorization: Bearer <jwt>`

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | público | Estado del servicio |
| GET | `/health/db` | público | Estado de MySQL |
| POST | `/auth/register` | público | Registro (siempre rol `usuario`) |
| POST | `/auth/login` | público | Login, devuelve JWT + usuario |
| GET | `/auth/me` | autenticado | Perfil actual |
| GET | `/users` | operador | Lista de usuarios (para asignar) |
| GET | `/users/me` | autenticado | Perfil |
| PATCH | `/users/me` | autenticado | Nombre / contraseña |
| POST | `/users` | operador | Crear operador |
| GET | `/categories` | autenticado | Categorías activas |
| POST | `/categories` | operador | Crear categoría |
| PATCH | `/categories/:id` | operador | Editar / desactivar |
| GET | `/inspections` | autenticado | Lista filtrada y paginada |
| POST | `/inspections` | autenticado | Crear inspección |
| GET | `/inspections/:id` | dueño u operador | Detalle + evidencias + historial |
| PATCH | `/inspections/:id` | dueño (pendiente) u operador | Editar datos |
| PATCH | `/inspections/:id/status` | operador / dueño (cancelar) | Transición validada |
| POST | `/inspections/:id/evidences` | dueño u operador | Subir evidencia (multipart `file`) |
| GET | `/inspections/:id/history` | dueño u operador | Historial |
| GET | `/inspections/stats/summary` | autenticado | Conteos para dashboard |

Detalle, payloads y códigos: `docs/API.md`.

## 7. Modelo de datos (planificado)

`users` · `categories` · `inspections` · `evidences` · `inspection_history`

- `inspections` guarda ubicación (`latitude`, `longitude`, `building`, `area`, `reference`),
  prioridad, `review_result`, `final_condition`, inclinación medida (`tilt_degrees`) y fechas
  de cada hito.
- `evidences` referencia archivos en `/uploads` y se borra en cascada con la inspección.
- `inspection_history` es la auditoría: acción, estado anterior/nuevo, usuario y comentario.
- `CHECK` de finalización: `status <> 'finalizada' OR (review_result IS NOT NULL AND
  final_condition IS NOT NULL)`.
- ER y diccionario completo: `docs/MODELO_DATOS.md`.

## 8. Estado actual y pendientes

### Hecho (2026-11-18)

- [x] Análisis del PDF y conversión a Markdown (`docs/requisitos/`).
- [x] Reparto equitativo 34/33/33 con tareas, dependencias y criterios de aceptación.
- [x] Plan de sprints, backlog, DoD y riesgos (`docs/PLAN_TRABAJO.md`).
- [x] Guía de Git/PRs y protecciones (`docs/GIT_WORKFLOW.md`).
- [x] Arquitectura, modelo de datos, contrato de API y plan de pruebas.
- [x] Reporte técnico y guion de defensa.
- [x] README, CONTRIBUTING, `.gitignore`, `.editorconfig`.
- [x] Plantillas de Issues y Pull Request.
- [x] Limpieza de implementaciones para dejar solo la base acordada.

### Siguiente (prioridad)

1. Crear organización y repositorio remoto `sigse-uaa`; agregar al docente como Admin.
2. Hacer el primer commit/push de esta base.
3. Configurar branch protection, labels, milestones y tablero Projects (4 columnas).
4. Abrir Issues del Sprint 0 y asignarlos según el reparto.
5. Iniciar implementación: schema/seed (Diana), core Flutter (Edson), backend de inspecciones (Alonso).
6. Mantener el avance en PRs pequeños; actualizar este archivo al cerrar cada sesión.

## 9. Bitácora de sesiones (append-only)

> Agregar una entrada al final de cada sesión. Indicar fecha, persona, qué se hizo, decisiones,
> comandos ejecutados y qué queda pendiente. No borrar entradas anteriores.

### 2026-11-18 — Sesión 1 (Edson + IA)

- Se analizó el PDF completo y se seleccionó el sistema n.º 9.
- Se fijaron stack (Node/Express/MySQL, Provider) y nombre (SIGSE / `sigse-uaa`).
- Se creó la documentación base y el reparto de trabajo.

### 2026-11-18 — Sesión 2 (Edson + IA)

- Se detectó que la IA excedió el alcance solicitado: además de la base, había generado un
  backend funcional y una app Flutter completa.
- Decisión del usuario: **dejar solo la base documental y el reparto** para subir a GitHub.
- Se retiraron del repositorio `app/`, `backend/`, `database/`, `docker-compose.yml` y el
  workflow de CI. Se conservó un respaldo local en `/tmp/sigse-implementation-backup` por si
  se necesita consultar, pero **no forma parte del repositorio**.
- Se reescribieron `README.md` y `AGENTS.md` para reflejar el estado real: sin código de
  implementación.
- **Pendiente inmediato:** crear el repositorio remoto, configurar protecciones/Projects y
  comenzar el Sprint 0 con los Issues asignados.

## 10. Convenciones para asistentes de IA

1. Leer este archivo y `docs/PLAN_TRABAJO.md` antes de proponer cambios.
2. **No implementar módulos completos sin pedido explícito.** La base es documental; el código
   se desarrolla por tarea/Issue y con el responsable indicado.
3. Respetar la propiedad de módulos, pero no bloquear correcciones pequeñas: señalar al dueño.
4. No inventar endpoints, tablas ni estados: actualizar primero `docs/API.md` /
   `docs/MODELO_DATOS.md` y luego el código.
5. No agregar dependencias sin justificar y verificar que `flutter pub get` / `npm install`
   funcionen.
6. No incluir secretos, credenciales ni datos personales reales.
7. No usar datos simulados como sustituto del backend en la entrega final.
8. Ejecutar `flutter analyze`, `flutter test` y `npm test` antes de dar una tarea por terminada.
9. Al cerrar la sesión, agregar entrada en la sección 9 y actualizar la sección 8.
10. Mantener el estilo: español para documentación/UI, inglés para código y nombres técnicos.
11. Commits únicamente cuando el usuario lo pida explícitamente.
