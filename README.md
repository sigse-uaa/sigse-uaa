# SIGSE · Sistema de Inspección y Gestión de Señalización

Sistema multiplataforma para registrar, dar seguimiento y cerrar inspecciones de señalización,
rutas de circulación y elementos de seguridad en espacios universitarios.

Proyecto final de **Programación de Dispositivos Móviles** — Ingeniería en Sistemas
Computacionales, Centro de Ciencias Básicas, Universidad Autónoma de Aguascalientes.

> **Estado actual: base de planeación + core Flutter mínimo.** El repositorio contiene los
> requisitos, la arquitectura propuesta, el contrato de API, el plan de pruebas, el reparto de
> trabajo, las plantillas de GitHub, CI de Flutter y un proyecto que ya compila con
> infraestructura compartida (`ApiClient`, almacenamiento local, rutas y modelo `User`).
> **Todavía no incluye backend, base de datos ni funcionalidades de negocio**; eso comienza en
> el Sprint 1 y se reparte entre los tres integrantes.

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
| [`docs/PLAN_TRABAJO.md`](docs/PLAN_TRABAJO.md) | Alcance, calendario, reparto equitativo (~34 pts por persona), backlog por sprint, DoD y riesgos |
| [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) | Ramas, commits, PRs, revisiones, protecciones y Projects |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Componentes, capas, offline, recursos móviles y despliegue |
| [`docs/MODELO_DATOS.md`](docs/MODELO_DATOS.md) | ER, diccionario de datos, estados, permisos e índices |
| [`docs/API.md`](docs/API.md) | Contrato REST: endpoints, payloads, errores y ejemplos |
| [`docs/PRUEBAS.md`](docs/PRUEBAS.md) | Pruebas obligatorias 9.1–9.5 y matriz de estados |
| [`docs/REPORTE_TECNICO.md`](docs/REPORTE_TECNICO.md) | Estructura del reporte, guion de demo y preguntas de defensa |
| [`docs/requisitos/`](docs/requisitos/) | PDF original y requisitos convertidos a Markdown |
| [`CONTRIBUIR.md`](CONTRIBUIR.md) | Reglas mínimas para contribuir |

Fuentes originales: [`docs/requisitos/Programacion_Movil_Proyecto_Final.pdf`](docs/requisitos/Programacion_Movil_Proyecto_Final.pdf)
y [`docs/requisitos/sistema-09-inspeccion-senalizacion.md`](docs/requisitos/sistema-09-inspeccion-senalizacion.md).

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

Cualquier cambio a estas decisiones se registra en `docs/PLAN_TRABAJO.md` y, si es estructural,
en `docs/ARQUITECTURA.md`.

---

## 4. Estructura prevista del repositorio

```text
.
├── app/                      # Flutter ya creado (base mínima)
│   ├── lib/core/             # infraestructura compartida
│   │   ├── config/           # AppConfig (API_BASE_URL, timeout)
│   │   ├── models/           # User
│   │   ├── navigation/       # AppRoutes
│   │   ├── network/          # ApiClient y ApiException
│   │   ├── storage/          # LocalStorage (shared_preferences)
│   │   ├── theme/            # tema Material 3
│   │   └── widgets/          # EmptyState, ErrorView, LoadingView
│   ├── lib/features/         # módulos por funcionalidad y shell responsivo
│   ├── test/                 # pruebas de humo y del core
│   ├── android/              # plataforma Android
│   ├── web/                  # plataforma web
│   └── linux/                # plataforma Linux
├── backend/                  # API Node.js + Express (Sprint 1)
├── database/                 # schema.sql, seed.sql y notas (Sprint 0–1)
├── docs/                     # requisitos, plan, arquitectura, API, pruebas, reporte
├── .github/                  # plantillas de Issues/PR y CI de Flutter
└── docker-compose.yml        # MySQL local reproducible (Sprint 0–1)
```

La base actual contiene `app/` con infraestructura compartida, una pantalla inicial y pruebas;
aún no tiene lógica de negocio. **No** contiene `backend/`, `database/` ni `docker-compose.yml`;
se agregarán por los responsables indicados en el plan, mediante Issues y PRs.

Plataformas generadas: **Android, web y Linux**. iOS no está incluido porque el PDF no lo exige;
si se necesita, se puede agregar después con macOS + Xcode o un servicio de CI con macOS.

### 4.1 Ejecutar el esqueleto

```bash
cd app
flutter pub get
flutter analyze
flutter test
flutter run -d chrome
```

También se puede ejecutar con `flutter run -d linux` o en un dispositivo Android conectado.

La URL de la API se configura sin tocar el código:

```bash
# Web o escritorio
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api

# Emulador Android: localhost del host es 10.0.2.2
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:3000/api

# Dispositivo físico: usa la IP LAN de tu computadora
flutter run -d <device-id> --dart-define=API_BASE_URL=http://192.168.1.50:3000/api
```

En debug/profile Android se permite HTTP local; en release usa HTTPS.

### 4.2 Base compartida ya disponible

Edson mantiene `app/lib/core/`. Diana y Alonso pueden consumirla desde sus módulos:

- `ApiClient`: GET/POST/PATCH/DELETE, token Bearer, timeout, JSON y `multipart/form-data`.
- `ApiException`: mensajes amigables y lectura del formato de error del contrato.
- `LocalStorage`: lectura/escritura JSON con `shared_preferences`.
- `AppConfig`, `AppRoutes` y `User`: configuración, rutas y modelo base.
- `AppShell`: navegación responsiva con `NavigationBar` (< 720 px) o `NavigationRail`.
- `EmptyState`, `ErrorView` y `LoadingView`: estados reutilizables de UI.
- `provider` ya está en `pubspec.yaml` para los `ChangeNotifier` de cada módulo.

Ejemplo mínimo:

```dart
final api = ApiClient()..setToken(token);
final response = await api.get('/auth/me');
final user = User.fromJson(response['user'] as Map<String, dynamic>);
final storage = await LocalStorage.create();
await storage.writeJson(StorageKeys.user, user.toJson());
```

Diana puede avanzar con **D1/D2** sin esperar esta base; para **D3** ya tiene el cliente HTTP,
el almacenamiento local y el modelo `User`. Los cambios en `core/` entran por PR.

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

1. Leer `docs/PLAN_TRABAJO.md` y `docs/GIT_WORKFLOW.md`.
2. Crear la organización y el repositorio remoto `sigse-uaa`.
3. Configurar protección de `main`, labels, milestones y el tablero de Projects.
4. Abrir los Issues del Sprint 0 (ver backlog del plan) y asignarlos.
5. Continuar con `E3` (auth UI), `D1` (schema/seed) y `A1` (inspecciones) según la ruta
   crítica. La base `E2` y el CI de Flutter ya están creados en local.

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
