# SIGSE · Sistema de Inspección y Gestión de Señalización

Sistema multiplataforma para registrar, dar seguimiento y cerrar inspecciones de señalización,
rutas de circulación y elementos de seguridad en espacios universitarios.

Proyecto final de **Programación de Dispositivos Móviles** — Ingeniería en Sistemas
Computacionales, Centro de Ciencias Básicas, Universidad Autónoma de Aguascalientes.

> **Estado actual: base de planeación.** Este repositorio contiene por ahora los requisitos,
> la arquitectura propuesta, el contrato de API, el plan de pruebas, el reparto de trabajo y
> las plantillas de GitHub. **Todavía no incluye código de backend ni de Flutter**; la
> implementación comienza en el Sprint 1 y se reparte entre los tres integrantes.

| Campo | Valor |
| --- | --- |
| Sistema elegido | N.º 9 — Inspección de señalización |
| Docente | Ing. Irving Cardona Camacho |
| Periodo | Agosto–Diciembre 2026 |
| Equipo | Edson Leonardo Sánchez Montalvo · Diana Ruth Gutiérrez Márquez · Alonso Herrera Benavides |

> **Regla de negocio principal:** una inspección **no puede finalizarse** si no se registran
> el **resultado de la revisión** y la **condición final de la señalización**.

---

## 1. Documentación

| Documento | Contenido |
| --- | --- |
| [`docs/PLAN_TRABAJO.md`](docs/PLAN_TRABAJO.md) | Alcance, calendario, reparto 34/33/33, backlog por sprint, DoD y riesgos |
| [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) | Ramas, commits, PRs, revisiones, protecciones y Projects |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Componentes, capas, offline, recursos móviles y despliegue |
| [`docs/MODELO_DATOS.md`](docs/MODELO_DATOS.md) | ER, diccionario de datos, estados, permisos e índices |
| [`docs/API.md`](docs/API.md) | Contrato REST: endpoints, payloads, errores y ejemplos |
| [`docs/PRUEBAS.md`](docs/PRUEBAS.md) | Pruebas obligatorias 9.1–9.5 y matriz de estados |
| [`docs/REPORTE_TECNICO.md`](docs/REPORTE_TECNICO.md) | Estructura del reporte, guion de demo y preguntas de defensa |
| [`docs/requisitos/`](docs/requisitos/) | PDF original y requisitos convertidos a Markdown |
| [`AGENTS.md`](AGENTS.md) | Contexto operativo, decisiones y bitácora del proyecto |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Reglas mínimas para contribuir |

Fuentes originales: [`Programacion_Movil_Proyecto_Final.pdf`](Programacion_Movil_Proyecto_Final.pdf)
y [`proyecto9.md`](proyecto9.md).

---

## 2. Reparto equitativo

| Integrante | Puntos | Rol principal | Módulos |
| --- | ---: | --- | --- |
| **Edson Leonardo Sánchez Montalvo** | 34 | Líder técnico / integración | repo, GitHub, CI, core Flutter, auth UI, perfil, builds, despliegue, reporte |
| **Diana Ruth Gutiérrez Márquez** | 33 | Datos y backend de identidad | modelo de datos, seed, auth/usuarios/roles/categorías, listado/detalle Flutter, caché |
| **Alonso Herrera Benavides** | 33 | Núcleo operativo y recursos móviles | inspecciones/evidencias/historial/estados, formulario, panel operador, cámara/geo/sensor |

El detalle de tareas, dependencias y criterios de aceptación está en
[`docs/PLAN_TRABAJO.md`](docs/PLAN_TRABAJO.md#4-división-equitativa-del-trabajo).

---

## 3. Stack previsto

| Componente | Tecnología |
| --- | --- |
| Cliente | Flutter + Dart, Material 3, Provider + ChangeNotifier |
| Backend | Node.js 22 + Express (CommonJS), JWT, bcryptjs, Zod, Multer |
| Base de datos | MySQL 8 (InnoDB, UTF-8, FKs y CHECK) |
| Persistencia local | `shared_preferences` (sesión, preferencias y caché JSON) |
| Mapas | `flutter_map` + OpenStreetMap (sin API key) |
| Recursos móviles | `image_picker`, `geolocator`, `sensors_plus`, `connectivity_plus` |

Cualquier cambio a estas decisiones se registra en `AGENTS.md` y, si es estructural, en
`docs/ARQUITECTURA.md`.

---

## 4. Estructura prevista del repositorio

```text
.
├── app/                      # Flutter (se crea en el Sprint 1)
│   ├── lib/core/             # configuración, red, storage, tema, widgets
│   ├── lib/features/         # auth, home, inspections, admin, profile, shell
│   └── test/
├── backend/                  # API Node.js + Express (Sprint 1)
│   ├── src/{config,controllers,services,middleware,routes,validators,utils}
│   ├── test/
│   └── uploads/
├── database/                 # schema.sql, seed.sql y notas (Sprint 0–1)
├── docs/                     # requisitos, plan, arquitectura, API, pruebas, reporte
├── .github/                  # plantillas de Issues y PR
├── docker-compose.yml        # MySQL local reproducible (Sprint 0–1)
└── AGENTS.md
```

La base actual **no** contiene `app/`, `backend/`, `database/` ni `docker-compose.yml`; se
agregarán por los responsables indicados en el plan, mediante Issues y PRs.

---

## 5. Flujo de trabajo

- `main` estará **protegida**: nadie hace push directo.
- Cada tarea vive en un **Issue** y en el tablero de **GitHub Projects** (4 columnas).
- Se trabaja en ramas `feature/...`, `fix/...`, `docs/...` o `test/...`.
- Todo entra por **Pull Request** con al menos **una revisión** de otro integrante y CI en verde.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/) y referencia al Issue.
- El docente debe tener rol **Admin** en el repositorio.

Comandos y configuración paso a paso: [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).

---

## 6. Primeros pasos del equipo

1. Leer `AGENTS.md`, `docs/PLAN_TRABAJO.md` y `docs/GIT_WORKFLOW.md`.
2. Crear la organización y el repositorio remoto `sigse-uaa`.
3. Configurar protección de `main`, labels, milestones y el tablero de Projects.
4. Abrir los Issues del Sprint 0 (ver backlog del plan) y asignarlos.
5. Comenzar por `E1`, `D1` y el esqueleto de `A1` según la ruta crítica.

---

## 7. Seguridad y buenas prácticas

- **No** subir `.env`, tokens, contraseñas, llaves privadas ni archivos de `uploads/`.
- Permisos y reglas de negocio se validan **en el backend**, no solo en la UI.
- Contraseñas con bcrypt; sesiones con JWT de expiración corta.
- Validar y sanitizar toda entrada con Zod; consultas parametrizadas con `mysql2`.
- CORS restringido por variable de entorno en producción.

---

## 8. Créditos

Proyecto académico sin fines comerciales. Universidad Autónoma de Aguascalientes, 2026.
