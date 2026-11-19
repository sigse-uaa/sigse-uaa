# Plan de trabajo — SIGSE

> Sistema n.º 9: **Inspección de señalización**. Documento vivo. Última actualización:
> **2026-11-18**. Cualquier cambio de alcance, fecha o responsable debe reflejarse aquí.

---

## 1. Lectura del problema

El PDF exige un **sistema distribuido real**, no una maqueta: Flutter en Android, web y
escritorio; backend propio; MySQL central; dos roles; siete pantallas; cinco entidades;
cuatro estados; historial; regla de negocio; cámara, geolocalización, acelerómetro, gestos,
animaciones; persistencia local; comunicación entre dos dispositivos; GitHub con Issues,
Projects, ramas y PRs; despliegue y defensa individual.

**SIGSE** resuelve la inspección de señalización universitaria:

1. Cualquier usuario detecta una señal (evacuación, ruta, extintor, prohibición, informativa),
   toma una foto, registra ubicación y observaciones.
2. El operador revisa, asigna, inicia atención y finalmente cierra el caso.
3. Para cerrar, **obligatoriamente** registra `review_result` y `final_condition`.
4. Todo cambio queda en el historial y es visible desde otros dispositivos.

### 1.1 Contrato técnico obligatorio → cómo se cumple

| Requisito del PDF | Implementación en SIGSE |
| --- | --- |
| Dos roles | `usuario` y `operador`; permisos en middleware del backend |
| ≥ 7 pantallas | Login, registro, inicio, listado, detalle, formulario, panel operador, perfil (8) |
| ≥ 5 entidades | `users`, `categories`, `inspections`, `evidences`, `inspection_history` |
| Crear / consultar / modificar / cancelar | CRUD de inspecciones + cancelación validada |
| 4 estados | `pendiente`, `asignada`, `en_proceso`, `finalizada` (+ `cancelada`) |
| Historial | `inspection_history` con actor, fecha, estados y comentario |
| Regla de negocio | Finalizar exige `review_result` + `final_condition` (backend + CHECK SQL) |
| Fotografía | `image_picker` (cámara y galería) + subida multipart |
| Geolocalización | `geolocator` + visualización con `flutter_map`/OSM |
| Acelerómetro | Medición de inclinación de la señal (`tilt_degrees`) y brújula/nivel |
| Gestos y animaciones | Swipe, long-press, pull-to-refresh, Hero, AnimatedSwitcher |
| Persistencia local | Sesión, preferencias y caché JSON de inspecciones con `shared_preferences` |
| API REST propia | Express + JWT, documentada en `docs/API.md` |
| MySQL central | Esquema relacional con FKs, índices y CHECK |
| Dos dispositivos | Prueba 9.1 con web + Android y datos reales |
| Multiplataforma | Builds Android, web y Linux/escritorio |
| GitHub | Issues, Projects, ramas, PRs, revisiones y CI |

### 1.2 Fuera de alcance (MVP)

- Notificaciones push y WebSockets (el PDF no los exige).
- Edición colaborativa en tiempo real.
- Firma digital, reportes PDF automáticos o analítica avanzada.
- Recuperación de contraseña por correo (se puede simular con cambio autenticado).
- App publicada en Google Play (basta APK).

---

## 2. Decisiones técnicas

| Tema | Decisión | Razón |
| --- | --- | --- |
| Backend | Node.js 22 + Express (CommonJS) | Curva corta, ecosistema, despliegue simple |
| DB | MySQL 8 | Relacional, disponible, buen soporte de CHECK y FKs |
| Auth | JWT (8 h) + bcryptjs | Sin estado, roles verificados en servidor |
| Validación | Zod | Mensajes claros y esquemas reutilizables |
| Estado Flutter | Provider + ChangeNotifier | Oficial, suficiente, defendible |
| HTTP | `http` + wrapper propio | Control de errores y multipart sin magia |
| Mapas | `flutter_map` + OSM | Sin tarjeta ni API key |
| Offline | `shared_preferences` con JSON | Funciona en Android, web y escritorio |
| Uploads | Multer a disco + `/uploads` | Simple para demo; ver riesgos de despliegue |
| Git | `main` protegida + ramas cortas + PR | Exigencia explícita del PDF |

Si alguna decisión cambia, se documenta en `docs/ARQUITECTURA.md` y en este plan.

---

## 3. Calendario realista (hoy: miércoles 18 de noviembre de 2026)

El PDF sugiere cuatro bloques del 4 al 29 de noviembre. Como el equipo arranca el 18, se
comprime el plan manteniendo todos los entregables. **La fecha oficial de defensa debe
confirmarse con el docente**; este calendario asume cierre el domingo 29 y defensa la semana
del 30 de noviembre.

| Sprint | Fechas | Objetivo | Demo / hito |
| --- | --- | --- | --- |
| **S0 · Base** | Mié 18 – Jue 19 | Repo, protecciones, tablero, DB local, esqueletos, login UI | Repo en GitHub + `/api/health` + app abre |
| **S1 · Núcleo** | Vie 20 – Lun 23 | Auth real, categorías, inspecciones, listado/detalle, formulario básico | Login, crear desde web y ver desde Android |
| **S2 · Operación y móvil** | Mar 24 – Vie 27 | Estados, panel operador, cámara/galería, geo/mapa, acelerómetro, offline, responsive | Flujo completo + recursos móviles |
| **S3 · Cierre** | Sáb 28 – Dom 29 | Pruebas 9.1–9.5, correcciones, despliegue, APK, reporte, presentación | Sistema desplegado + ensayo de defensa |
| **Defensa** | Lun 30 – Vie 4 dic | Demostración y preguntas individuales | Todos participan |

**Regla de congelamiento:** domingo 29 a las 23:59 no se integran funcionalidades nuevas; solo
correcciones críticas documentadas.

### 3.1 Ritmo de trabajo

- **Check-in asíncrono diario (21:00):** qué hice, qué sigue, bloqueos (mensaje corto).
- **Sync corto (21:15, 15 min):** solo bloqueos e integración.
- **Integración diaria:** al menos un PR integrado por día a partir del 20.
- **Regla del bloqueo:** si algo está trabado > 2 horas, se pide ayuda; no se esconde.
- **Pair review:** quien revise un módulo debe poder ejecutarlo y explicarlo.

---

## 4. División equitativa del trabajo

El proyecto se valoró en **102 puntos relativos** (~120–140 horas totales): los 100 originales
más 2 del esqueleto del backend (A0), que no tenía responsable. Cada integrante tiene
**33–35 puntos**. La división es por *work packages* verticales, no por “cajones” aislados:
todos tocan Flutter, API, pruebas y documentación.

| Integrante | Puntos | % | Rol |
| --- | ---: | ---: | --- |
| Edson Leonardo Sánchez Montalvo | 35 | 34 % | Líder técnico, core Flutter, auth (API y UI), integración y despliegue |
| Diana Ruth Gutiérrez Márquez | 33 | 32 % | Datos, usuarios/roles/categorías, consulta, perfil y caché |
| Alonso Herrera Benavides | 34 | 33 % | Esqueleto del backend, núcleo de inspecciones, recursos móviles y panel operador |

> **Ajuste del reparto (18 nov):** se asignó el esqueleto del backend a Alonso (A0) y el
> registro/login con JWT pasó de Diana a Edson (E6) para quitar el cuello de botella en D1→D2.
> A cambio, el perfil y las preferencias de Flutter pasaron de Edson a Diana (D6) y la prueba
> de comunicación 9.1 de Alonso a Diana (D5).

### 4.1 Edson — 35 puntos

| ID | Tarea | Pts | Depende de | Criterio de aceptación |
| --- | --- | ---: | --- | --- |
| E1 | Repo, organización, protecciones, labels, Projects, plantillas, CI | 6 | — | `main` protegida, CI verde, Issues/PR templates y tablero de 4 columnas |
| E2 | Core Flutter: tema, navegación responsiva, `ApiClient`, storage, modelos base, widgets | 9 | E1 | App compila; `flutter analyze` limpio; patrón documentado |
| E3 | Auth UI (login/registro) y sesión persistente (`SessionStore`) | 6 | E2, E6 | Login real contra API; sesión sobrevive reinicio; logout limpio |
| E4 | Integración E2E, builds Android/web/Linux, deploy API/DB/web, APK | 7 | E3, D3, A3 | URL web pública, APK instalable, API accesible desde otro dispositivo |
| E5 | Coordinación, reporte técnico, presentación y ensayo de defensa | 4 | todas | Reporte completo y demo ensayada sin errores críticos |
| E6 | Backend de autenticación: `/auth/register`, `/auth/login`, JWT, bcryptjs y middleware de roles + tests | 3 | A0, D1 | Registro (siempre rol `usuario`) y login devuelven JWT; el middleware responde 401/403; probado con curl/supertest |

**Extra transversal:** mantiene `README.md` y CI; revisa PRs de Diana y Alonso.

### 4.2 Diana — 33 puntos (D1 8 + D2 6 + D3 8 + D4 6 + D5 3 + D6 2)

| ID | Tarea | Pts | Depende de | Criterio de aceptación |
| --- | --- | ---: | --- | --- |
| D1 | Modelo de datos: `schema.sql`, `seed.sql`, ER, índices, integridad | 8 | E1 | Base carga limpia; FKs/CHECK funcionan; seed reproducible |
| D2 | Backend de usuarios, roles y categorías (`/auth/me`, `/users`, `/categories`) + validaciones con Zod + tests | 6 | D1, A0, E6 | `/auth/me`, usuarios, roles y categorías probados con curl/supertest |
| D3 | Listado Flutter con búsqueda, filtros, paginación y caché local/offline | 8 | E2, E6 | Lista datos reales; filtros; sin red muestra caché y aviso |
| D4 | Detalle Flutter: datos, evidencias, historial y mapa | 6 | D3, A1 | Detalle completo, permisos correctos, historial visible |
| D5 | Documentación de API/BD, pruebas de validaciones y prueba de comunicación 9.1 | 3 | D2 | `docs/API.md` actualizado; matriz de pruebas firmada; evidencia de la prueba 9.1 |
| D6 | Perfil y preferencias en Flutter (editar nombre/contraseña, tema) | 2 | E3, D2 | Perfil editable contra `/users/me`; preferencia de tema persiste |

**Extra transversal:** revisa PRs de Edson y Alonso; apoya seed y consultas SQL.

### 4.3 Alonso — 34 puntos

| ID | Tarea | Pts | Depende de | Criterio de aceptación |
| --- | --- | ---: | --- | --- |
| A0 | Esqueleto del backend: Express, `/api/health` y `/api/health/db`, conexión a MySQL, manejo de errores, `.env.example` y `Dockerfile` | 2 | E1 | `npm run dev` responde `/api/health`; `.env.example` documentado; prueba de humo en verde |
| A1 | Backend inspecciones, evidencias, historial, máquina de estados y regla | 11 | D1, A0, E6 | CRUD, transiciones válidas, finalización bloqueada sin resultado/condición, uploads |
| A2 | Formulario Flutter crear/editar + validaciones | 6 | E2, A1 | Crea y edita; errores de validación claros; permisos respetados |
| A3 | Recursos móviles: cámara/galería, geolocalización/mapa, permisos, acelerómetro, gestos y animaciones | 8 | A2 | Evidencia fotográfica, coordenadas, inclinación registrada y demo en Android |
| A4 | Panel operador: asignar, iniciar, finalizar, cancelar | 6 | A1, D3 | Flujo completo desde UI; regla de negocio visible y aplicada |
| A5 | Pruebas de recursos móviles y apoyo en despliegue | 1 | A3, A4 | Evidencia de la prueba 9.4; bugs críticos cerrados |

**Extra transversal:** revisa PRs de Edson y Diana; mantiene el mapa y permisos Android.

### 4.4 Responsabilidades compartidas (no opcionales)

- **Todos:** crear/atender Issues, abrir PRs, revisar al menos un PR ajeno por semana, probar en
  al menos dos plataformas, participar en la defensa.
- **Todos:** conocer la arquitectura completa; nadie puede decir “eso lo hizo otro”.
- **Todos:** documentar decisiones y evidencias en el PR/Issue correspondiente.
- **Rotación de revisión:** Edson ↔ Diana ↔ Alonso; evitar que el dueño apruebe su propio PR.

### 4.5 Uso de IA y autonomía

- El reparto es por **personas**, no por herramientas. Cada integrante puede usar el agente o
  asistente que prefiera; el plan no depende de que todos tengan el mismo.
- Las instrucciones personales de asistentes (`AGENTS.md` u otras) **no se versionan** en el
  repositorio; son configuración local de cada quien.
- La IA puede apoyar a escribir, revisar o explicar código, pero **nadie integra código que no
  pueda defender**. En la defensa el profesor puede pedir cambios y preguntas individuales.
- Si un agente genera una solución, el responsable del módulo debe revisarla, probarla y
  adaptarla al contrato del proyecto.

---

## 5. Backlog por sprint (Issues sugeridos)

### Sprint 0 — Base
- `chore(repo): crear organización, repositorio y protecciones`
- `chore(github): configurar Projects, labels y milestones`
- `feat(db): schema inicial y seed`
- `feat(backend): esqueleto Express con /health y manejo de errores`
- `chore(ci): pipeline Flutter + backend`
- `feat(flutter): tema, navegación y pantallas placeholder`
- `docs: plan, arquitectura y contrato de API`

### Sprint 1 — Núcleo
- `feat(auth): registro, login y JWT`
- `feat(users): roles y perfil`
- `feat(categories): CRUD de categorías`
- `feat(inspections): listado, detalle y creación`
- `feat(flutter): login y sesión persistente`
- `feat(flutter): listado y detalle conectados`
- `feat(flutter): formulario básico`

### Sprint 2 — Operación y móvil
- `feat(inspections): máquina de estados e historial`
- `feat(inspections): regla de finalización`
- `feat(evidences): subida y visualización`
- `feat(flutter): panel operador`
- `feat(mobile): cámara, galería y permisos`
- `feat(mobile): geolocalización y mapa`
- `feat(mobile): acelerómetro e inclinación`
- `feat(flutter): caché offline y manejo de errores`
- `style(flutter): responsive, gestos y animaciones`

### Sprint 3 — Cierre
- `test: pruebas 9.1–9.5`
- `fix: correcciones de integración`
- `chore(deploy): API, MySQL y web`
- `build: APK y escritorio`
- `docs: reporte técnico y presentación`

---

## 6. Dependencias y ruta crítica

```text
E1 → A0 ─┬→ E6 → A1 → A2 → A3 → A4
E1 → D1 ─┘     └→ D2
E1 → E2 → E3 (también necesita E6) → D3 → D4
E2 → A2
E3 + D2 → D6
D3 + A3 + A4 → E4 → E5
```

- A0 y D1 se pueden hacer **en paralelo** (Alonso y Diana); E6 y D2 esperan a ambas.
- Si D1 o A0 se retrasan, bloquean E6, D2, A1 y todas las pantallas con datos.
- Si A1 se retrasa, el panel operador y la regla de negocio no pueden probarse.
- E2 debe cerrarse temprano: es la base de todas las pantallas.

### 6.1 Cómo reducir dependencias

No se puede eliminar toda dependencia en un sistema cliente-servidor, pero sí reducirla:

1. **Contrato primero:** congelar `docs/API.md` y `docs/MODELO_DATOS.md` antes de programar.
   Los cambios de contrato se avisan en el PR y se actualiza el documento.
2. **Trabajo con mocks:** las pantallas pueden avanzar con repositorios falsos mientras el
   backend termina. La entrega final siempre usa el backend real.
3. **Capas compartidas con dueño único:** `app/lib/core/` lo mantiene Edson; los cambios de
   otros entran por PR. Así se evitan conflictos en el cliente HTTP, modelos y tema.
4. **Vertical slices:** cada quien puede cerrar una funcionalidad completa (UI + llamada HTTP +
   prueba) sin esperar a que termine el módulo de otro, siempre que respete el contrato.
5. **Integración diaria:** no dejar todo para el final. Un PR pequeño por día a partir del 20.
6. **Datos de prueba compartidos:** Diana mantiene un seed reproducible para que todos prueben
   con los mismos usuarios y categorías.

**Plan de contingencia:** si el tiempo se reduce, se congela el alcance en este orden:
1. Login + crear inspección + listado + detalle (MVP demostrable).
2. Transiciones y regla de negocio.
3. Cámara + geolocalización.
4. Acelerómetro, gestos y animaciones.
5. Despliegue y reporte (nunca se sacrifican).

---

## 7. Definición de “terminado” (DoD)

Una tarea solo se cierra si:

- [ ] Cumple los criterios de aceptación del Issue.
- [ ] Está integrada a `main` por PR con al menos una aprobación.
- [ ] CI en verde (`flutter analyze`, `flutter test`, `npm test`).
- [ ] Se probó en al menos una plataforma real (Android/web/escritorio).
- [ ] No contiene secretos ni datos personales reales.
- [ ] Documentación/API actualizada si cambió el contrato.
- [ ] El PR incluye evidencia (captura, video corto o pasos de prueba).
- [ ] Otro integrante puede ejecutarlo y explicarlo.

## 8. Riesgos y mitigación

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| Tiempo insuficiente por otras materias | Alta | Alto | MVP priorizado, sprints cortos, congelamiento el 29 |
| Choques de merge | Media | Medio | PRs pequeños, pull diario, propiedad de archivos |
| Plugins móviles fallan en escritorio/web | Media | Medio | Alternativas por plataforma y mensajes claros; el PDF lo permite |
| MySQL/hosting gratuito inestable | Media | Alto | Demo local + túnel (ngrok/Cloudflare) como respaldo; DB en Railway/Aiven |
| Uploads se pierden al reiniciar el servidor | Alta | Medio | Volumen persistente o almacenamiento externo; documentarlo |
| Un integrante concentra trabajo | Media | Alto | Issues por persona, revisión cruzada, check-in diario |
| Dependencia excesiva de IA | Media | Alto | Cada quien explica su código; pair programming; defensa simulada |
| No hay dispositivo Android físico | Media | Medio | Emulador + un dispositivo del equipo; APK firmado para instalar |
| Profesor sin acceso Admin | Baja | Alto | Verificar el día 19 y mantenerlo hasta terminar |

## 9. Entregables y checklist final

- [ ] Repositorio en organización con historial verificable y profesor Admin.
- [ ] Issues cerrados, Projects con 4 columnas y PRs revisados.
- [ ] API desplegada y accesible desde otra red/dispositivo.
- [ ] MySQL central con datos persistentes.
- [ ] APK Android instalable en dispositivo físico.
- [ ] Versión web publicada.
- [ ] Versión de escritorio ejecutable (Linux/Windows).
- [ ] Pruebas 9.1–9.5 con evidencia (capturas/video y matriz llenada).
- [ ] Reporte técnico con las 22 secciones del PDF.
- [ ] Presentación y guion de demostración.
- [ ] Ensayo de defensa con preguntas cruzadas entre los tres.

## 10. Mapeo con la evaluación (30 %)

| Criterio del PDF | Pts | Dónde se evidencia |
| --- | ---: | --- |
| Flutter, UI, navegación, estado | 20 | E2, E3, D3, D4, A2, A4 |
| Backend, API, auth, validaciones, DB | 25 | D1, D2, A0, A1, E6, E4 |
| Comunicación, offline, errores | 15 | D3, A1, A3, E4, pruebas 9.1–9.3 |
| Recursos móviles, gestos, animaciones, responsive | 15 | A3, E2, A4 |
| GitHub, Issues, Projects, PRs, colaboración | 15 | E1 + actividad diaria de los tres |
| Reporte, presentación y defensa | 10 | E5 + participación individual |

**Nota:** la calificación es individual. El historial de Issues/PRs y la capacidad de explicar
el código son evidencia directa. No basta con “aparecer” en un commit.
