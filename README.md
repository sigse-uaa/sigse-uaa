# SIGSE · Sistema de Inspección y Gestión de Señalización

Sistema multiplataforma para registrar, dar seguimiento y cerrar inspecciones de señalización,
rutas de circulación y elementos de seguridad en espacios universitarios.

Proyecto final de **Programación de Dispositivos Móviles** — Ingeniería en Sistemas
Computacionales, Centro de Ciencias Básicas, Universidad Autónoma de Aguascalientes.

> **Estado actual: core Flutter, API de salud y base de datos local.** El repositorio contiene los
> requisitos, la arquitectura propuesta, el contrato de API, el plan de pruebas, el reparto de
> trabajo, las plantillas de GitHub, CI de Flutter y del backend, y una app Flutter con
> infraestructura compartida (`ApiClient`, almacenamiento local, rutas y modelo `User`).
> La base de datos de desarrollo se inicializa con MySQL 8.4, el esquema y el seed de prueba.
> La API Express incluye las rutas de salud. Las funciones de negocio se implementan en los sprints siguientes.

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
├── backend/                  # API Node.js + Express y pruebas de salud
├── database/                 # schema.sql, seed.sql y notas (Sprint 0–1)
├── docs/                     # requisitos, plan, arquitectura, API, pruebas, reporte
├── .github/                  # plantillas de Issues/PR y CI de Flutter y Node.js
└── docker-compose.yml        # MySQL local reproducible (Sprint 0–1)
```

El repositorio incluye `app/` con la infraestructura compartida, una pantalla inicial y pruebas.
También incluye `database/` y `docker-compose.yml` para levantar MySQL en desarrollo.

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

### 4.3 Levantar MySQL para desarrollo

Abre una terminal en la raíz del repositorio, donde están `docker-compose.yml` y `.env.example`.
En Windows, abre Docker Desktop y espera a que arranque. Comprueba que Compose esté disponible
con `docker compose version`.

**1. Prepara las variables locales.** Si todavía no tienes un archivo `.env`, crea una copia del
ejemplo:

```powershell
Copy-Item .env.example .env
```

En Bash, el equivalente es `cp .env.example .env`. Si ya tienes un `.env`, ábrelo y comprueba que
incluya las siguientes variables. Git ignora el archivo local.

| Variable | Para qué se usa |
| --- | --- |
| `SQL_DB` | Nombre de la base de datos. Usa `sigse` para seguir los ejemplos. |
| `SQL_PORT` | Dirección y puerto publicados en tu equipo. Usa `127.0.0.1:3306` para limitar el acceso a tu equipo. |
| `SQL_USER` | Usuario de MySQL con el que se conecta el backend. |
| `SQL_PASSWORD` | Contraseña del usuario de MySQL. |
| `SQL_PASSWORD_ROOT` | Contraseña de la cuenta administradora de MySQL. |
| `PORT` | Puerto HTTP de la API Express (por defecto `3000`). |

**2. Inicia el servicio.**

```bash
docker compose config --quiet
docker compose up -d db
docker compose logs -f db
```

En el primer arranque con un volumen vacío, MySQL crea la base indicada en `SQL_DB` y ejecuta
`database/schema.sql` antes de `database/seed.sql`. Compose monta ambos archivos en
`/docker-entrypoint-initdb.d` con los prefijos `01` y `02`, respectivamente. La inicialización
puede tardar unos segundos. Espera a que los logs indiquen que terminó y que MySQL está listo
para conexiones. Pulsa **Ctrl+C** para dejar de ver los logs. El servicio sigue en ejecución.

**3. Comprueba que cargaron las tablas y los datos.** Sustituye `TU_USUARIO_SQL` por el valor
de `SQL_USER`. Cuando MySQL pida la contraseña, escribe la configurada en `SQL_PASSWORD`.

```bash
docker compose exec db mysql -u TU_USUARIO_SQL -p sigse
```

Dentro de MySQL, ejecuta:

```sql
SHOW TABLES;
SELECT id, name FROM categories ORDER BY id;
SELECT role, COUNT(*) AS total FROM users GROUP BY role;
```

Deben aparecer cinco tablas, cinco categorías, dos operadores y un usuario general. Escribe
`exit` para volver a la terminal. Las cuentas para entrar a SIGSE están en
[Cuentas de prueba de SIGSE](#cuentas-de-prueba-de-sigse).

**4. Reinicia la base solo cuando quieras descartar sus datos.** Para detener el servicio y
conservar lo guardado, usa `docker compose stop db`. Si cambiaste el esquema o el seed y
quieres volver a cargarlos desde cero, ejecuta desde la raíz del repo:

```bash
docker compose down -v && docker compose up -d db
```

En Windows PowerShell 5.1, usa:

```powershell
docker compose down -v
if ($LASTEXITCODE -eq 0) { docker compose up -d db }
```

**`down -v` borra los volúmenes del proyecto y con ellos los datos locales de MySQL.**
Al arrancar otra vez, MySQL crea un volumen vacío y vuelve a cargar ambos SQL.

Si el arranque falla, revisa `docker compose logs --tail=100 db`. Si Docker indica que el
puerto 3306 está ocupado o que el nombre del contenedor ya existe, ejecuta `docker ps -a`
para identificar el otro contenedor antes de intervenir.

### 4.4 Ejecutar la API Express

Con Node.js 22 (22.9 o posterior), prepara el `.env` de la raíz y levanta MySQL como se indica
en la sección anterior. Luego, desde la raíz del repositorio, ejecuta:

```bash
cd backend
npm ci
npm run dev
```

Abre `http://localhost:3000/api/health` para comprobar Express. Después abre
`http://localhost:3000/api/health/db` para comprobar MySQL. La segunda ruta ejecuta
`SELECT 1` y devuelve `503` si MySQL no responde.

La API reutiliza `SQL_DB`, `SQL_USER` y `SQL_PASSWORD` del `.env` y toma el número de puerto
de `SQL_PORT`. Para conexiones con otra configuración, `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER` y `DB_PASSWORD` tienen prioridad. Las pruebas de `npm test` en `backend/` simulan
las respuestas de MySQL y se ejecutan también en GitHub Actions.

Para iniciar sesión, la API firma tokens JWT con `JWT_SECRET` (mínimo 32 caracteres) y
`JWT_EXPIRES_IN` (por defecto `8h`). **Si falta `JWT_SECRET`, o si `JWT_EXPIRES_IN` no es
válido, el servidor no arranca.** Si ya tienes un `.env`, copia desde `.env.example` las líneas
`NODE_ENV=development`, `JWT_SECRET` y `JWT_EXPIRES_IN`. El secreto de ejemplo solo funciona con
`NODE_ENV=development` o `test`; en cualquier servidor genera uno propio.
Con el seed cargado puedes probar el login con las cuentas de la sección
[Cuentas de prueba de SIGSE](#cuentas-de-prueba-de-sigse):

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"operador1@example.com","password":"SigseDemo2026!"}'
```

Para construir y ejecutar la API en Docker, usa estos comandos desde la raíz con el servicio
`db` ya iniciado. `sigse-uaa_default` es la red que crea Compose cuando el proyecto se llama
`sigse-uaa`. Si usas otro nombre de proyecto, cambia el nombre de red.

```bash
docker build -t sigse-api ./backend
docker run --rm --network sigse-uaa_default --env-file .env -e DB_HOST=db -e DB_PORT=3306 -e PORT=3000 -p 127.0.0.1:3000:3000 -v sigse-api-uploads:/app/uploads sigse-api
```

### 4.5 Probar las inspecciones y sus evidencias

Inicia sesión con `POST /api/auth/login` y usa el token de la respuesta en el encabezado
`Authorization: Bearer <jwt>`. Las rutas de inspecciones permiten registrar, consultar,
editar, asignar, iniciar, finalizar y cancelar según el rol. El contrato incluye ejemplos de
peticiones y respuestas en [Inspecciones](docs/API.md#7-inspecciones).

Para subir una evidencia, envía `multipart/form-data` con un archivo en `file` (máximo 8 MB).
El archivo se guarda en `backend/uploads` por defecto y su descarga requiere el mismo token.
En Docker el comando anterior conserva los archivos con el volumen `sigse-api-uploads`.

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

- Mantener fuera de Git el `.env` local, los tokens, las contraseñas reales, las llaves privadas y los archivos de `uploads/`.
- Permisos y reglas de negocio se validan **en el backend**, no solo en la UI.
- Contraseñas con bcrypt; sesiones con JWT de expiración corta.
- Validar y sanitizar toda entrada con Zod; consultas parametrizadas con `mysql2`.
- CORS restringido por variable de entorno en producción.

### Cuentas de prueba de SIGSE

El seed de desarrollo crea estas cuentas para probar el inicio de sesión en SIGSE con el backend conectado a la base local.

| Rol | Correo |
| --- | --- |
| Operador | `operador1@example.com` |
| Operador | `operador2@example.com` |
| Usuario general | `usuario@example.com` |

La contraseña compartida de las tres cuentas es `SigseDemo2026!`. Estas credenciales ficticias son exclusivas de desarrollo y pruebas.

---

## 8. Créditos

Proyecto académico sin fines comerciales. Universidad Autónoma de Aguascalientes, 2026.
