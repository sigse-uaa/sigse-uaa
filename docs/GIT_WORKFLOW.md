# Guía de Git, GitHub y Pull Requests — SIGSE

> **Regla de oro:** `main` está protegida. **Nadie hace push directo a `main`.** Todo cambio
> entra por rama + Pull Request + revisión + CI en verde.

**CI (integración continua):** es una verificación automática que se ejecuta en GitHub cada
vez que se sube una rama o se abre una solicitud de cambios. Corre tareas como
`flutter analyze`, `flutter test` y `npm test`; si algo falla, la solicitud no se integra.
No es un servidor adicional ni algo que haya que pagar: usa GitHub Actions, incluido en GitHub.
El workflow `.github/workflows/ci.yml` ejecuta las verificaciones de Flutter y las pruebas del backend
en jobs separados.

Esta guía aplica a los tres integrantes y también al docente cuando revise el historial.

---

## 1. Configuración inicial (una sola vez por computadora)

```bash
git config --global user.name "Nombre Apellido"
git config --global user.email "correo@ejemplo.com"
git config --global init.defaultBranch main
git config --global pull.ff only
```

Verificar:

```bash
git config --global --list
```

Clonar el repositorio (cuando ya exista el remoto):

```bash
git clone git@github.com:ORG/sigse-uaa.git
cd sigse-uaa
```

Se recomienda **SSH** o el **GitHub CLI**. Si no hay llaves SSH:

```bash
ssh-keygen -t ed25519 -C "correo@ejemplo.com"
cat ~/.ssh/id_ed25519.pub   # pegar en GitHub → Settings → SSH and GPG keys
ssh -T git@github.com
```

---

## 2. Modelo de ramas

Usamos **trunk-based development** con ramas cortas (viven 1–3 días máximo).

| Rama | Uso | ¿Protegida? |
| --- | --- | --- |
| `main` | Código estable, siempre demostrable | Sí |
| `feature/<tema>` | Nueva funcionalidad | No |
| `fix/<tema>` | Corrección de bug | No |
| `docs/<tema>` | Documentación | No |
| `test/<tema>` | Pruebas | No |
| `chore/<tema>` | Configuración, CI, dependencias | No |

Ejemplos válidos:

```text
feature/login
feature/panel-operador
feature/offline-cache
fix/validacion-fecha
fix/conexion-api
docs/api-inspecciones
test/estados-inspeccion
chore/ci-flutter
```

Reglas:

- Una rama = **un Issue** = **un objetivo**.
- Nombres en minúsculas, sin acentos ni espacios; guiones para separar.
- No reutilizar ramas ya integradas.
- Borrar la rama remota al integrar el PR.

---

## 3. Flujo diario paso a paso

### 3.1 Antes de empezar

```bash
git switch main
git pull --ff-only          # traer lo último
git switch -c feature/mi-tarea
```

### 3.2 Mientras trabajas

```bash
git status                  # qué cambió
git diff                    # revisar antes de agregar
git add -p                  # agregar por bloques (recomendado)
git commit -m "feat(inspections): agregar filtro por estado"
```

- Commits **pequeños y atómicos**: un commit = una idea que compila.
- No mezclar en un commit: refactor + feature + formato + docs.
- Si tocaste varios archivos por la misma razón, un solo commit está bien.
- Nunca subir `.env`, `node_modules`, `build/`, `uploads/` ni llaves.

### 3.3 Subir la rama

```bash
git push -u origin feature/mi-tarea
```

### 3.4 Abrir el Pull Request

1. GitHub mostrará el botón **Compare & pull request**.
2. Título claro y en el formato del proyecto.
3. Descripción con la plantilla: qué, por qué, cómo probar, capturas.
4. Enlazar el Issue: `Closes #12` (se cierra solo al integrar).
5. Asignar **Reviewer** a otro integrante (nunca a ti mismo).
6. Asignar **Assignee** a ti.
7. Verificar que CI esté corriendo.

### 3.5 Revisión y merge

- El revisor comenta, aprueba o solicita cambios.
- El autor responde y sube correcciones **en la misma rama** (se actualiza el PR).
- Con **1 aprobación** y CI verde, el autor integra con **Squash and merge**.
- La rama remota se borra sola al integrar. Para borrar la local:

```bash
git switch main
git pull --ff-only
git branch -D feature/mi-tarea
```

Se usa `-D` (mayúscula) porque con *squash* el commit de `main` es nuevo y Git no reconoce la
rama como integrada: `-d` se negaría a borrarla. Como `-D` borra sin preguntar, antes haz dos
comprobaciones:

1. En GitHub, el PR de esa rama dice **Merged** (no *Closed*).
2. El último commit del PR es el mismo que el de tu rama local:
   `git log -1 --format=%h feature/mi-tarea` debe coincidir con el último commit que muestra
   la pestaña **Commits** del PR. Si tu rama tiene commits más nuevos, no se subieron y se
   perderían.

### 3.6 Mantener la rama al día

Si `main` avanzó mientras trabajabas:

```bash
git fetch origin
git rebase origin/main
# resolver conflictos si hay
git push --force-with-lease
```

> `--force-with-lease` solo en **tu rama**, nunca en `main`.

---

## 4. Conventional Commits

Formato:

```text
<tipo>(<alcance>): <descripción en imperativo, minúsculas>

[opcional: por qué y qué cambia]

[opcional: Closes #12]
```

Tipos permitidos:

| Tipo | Cuándo usarlo | Ejemplo |
| --- | --- | --- |
| `feat` | Nueva funcionalidad visible | `feat(auth): agregar login con JWT` |
| `fix` | Corrección de error | `fix(api): validar longitud de folio` |
| `docs` | Solo documentación | `docs(api): documentar /inspections` |
| `test` | Pruebas | `test(status): cubrir transición inválida` |
| `refactor` | Cambio interno sin alterar comportamiento | `refactor(ui): extraer StatusBadge` |
| `style` | Formato/estética sin lógica | `style(app): aplicar dart format` |
| `chore` | Configuración/mantenimiento | `chore(ci): agregar job de backend` |
| `build` | Builds/dependencias | `build(android): configurar permisos` |
| `ci` | Cambios al pipeline | `ci: cachear Flutter` |
| `perf` | Mejora de rendimiento | `perf(list): paginar consultas` |

Alcances sugeridos: `api`, `db`, `auth`, `inspections`, `ui`, `mobile`, `offline`, `docs`,
`ci`, `app`, `backend`.

Buenos ejemplos:

```text
feat(inspections): permitir cancelar inspección propia
fix(status): impedir finalizar sin condición final
docs(plan): agregar reparto de tareas por integrante
test(auth): agregar casos de contraseña débil
chore(repo): configurar plantillas de Issues
```

Malos ejemplos (no usar):

```text
cambios
arreglos
update
asdf
“subo todo”
```

Reglas del mensaje:

- Imperativo: “agregar”, no “agregué” ni “agregando”.
- Máximo ~72 caracteres en la primera línea.
- Sin punto final en el título.
- El cuerpo explica **por qué**, no repite el diff.
- Referenciar el Issue cuando aplique.

---

## 5. Pull Requests

### 5.1 Plantilla obligatoria

El repositorio incluye `.github/PULL_REQUEST_TEMPLATE.md`. Todo PR debe responder:

- **Qué** cambia y **por qué**.
- **Issue** relacionado (`Closes #N`).
- **Cómo se probó** (comandos, dispositivos, capturas).
- **Riesgos / pendientes**.
- Checklist de calidad.

### 5.2 Reglas

- PR pequeño: idealmente **< 400 líneas** modificadas; si es más, dividir.
- No aprobar el PR propio.
- No integrar con CI rojo.
- No integrar con comentarios sin resolver.
- Un PR debe dejar `main` **funcional**.
- Se integra con **Squash and merge** (un commit limpio por PR).
- No usar “Merge commit” ni “Rebase and merge” para mantener historial simple.
- El título del squash debe seguir Conventional Commits.

### 5.3 Checklist de revisión (para el revisor)

- [ ] El código hace lo que dice el Issue.
- [ ] No hay secretos ni credenciales.
- [ ] Los permisos se validan en el backend (no solo en la UI).
- [ ] Se respetan las transiciones de estado y la regla de negocio.
- [ ] Manejo de errores y estados de carga/empty.
- [ ] Validaciones de formularios.
- [ ] `flutter analyze` / `npm test` en verde.
- [ ] Documentación/API actualizada si aplica.
- [ ] Nombres claros, sin código muerto ni `print`/`console.log` de depuración.
- [ ] Probado en al menos una plataforma; se indica cuál.

### 5.4 Revisión respetuosa

- Comenta el código, no a la persona.
- Distingue **bloqueante** (`[blocking]`) de **sugerencia** (`[nit]`).
- Si no entiendes algo, pregunta; la defensa es grupal.
- El autor responde cada comentario y marca “Resolved”.

---

## 6. Issues

Todo trabajo relevante nace de un Issue. Incluye:

- Título descriptivo (`feat: ...`, `fix: ...`, `docs: ...`).
- Contexto y objetivo.
- Criterios de aceptación verificables.
- Responsable (Assignee).
- Etiquetas de tipo y de área (ver §6.1) y prioridad en el campo **Priority** del tablero.
- Milestone/sprint cuando aplique.
- Enlace a rama/PR.

Plantillas disponibles en `.github/ISSUE_TEMPLATE/`.

### 6.1 Labels del repositorio

| Grupo | Labels |
| --- | --- |
| Tipo | `bug`, `enhancement`, `task`, `documentation` |
| Área | `area:*` (por ejemplo `area:backend`, `area:mobile`) |

La prioridad no es una etiqueta: se usa el campo **Priority** del tablero de Projects, y el
tipo de Issue (**Task**, **Bug**, **Feature**) se elige al crearlo.

### 6.2 GitHub Projects

Tablero **SIGSE** con exactamente cuatro columnas:

1. **Pendiente**
2. **En proceso**
3. **En revisión**
4. **Terminado**

Cada Issue se agrega al proyecto y se mueve conforme avanza. Un Issue solo pasa a
**Terminado** cuando el PR está integrado y verificado.

---

## 7. Configuración de la organización y del repositorio

### 7.1 Crear organización y repositorio

1. GitHub → **New organization** (plan gratuito).
2. Nombre sugerido: `sigse-uaa` como organización, repositorio `sigse-uaa` (o `SIGSE`).
3. Visibilidad **Public**: en el plan gratuito de organización, la protección de ramas en
   repositorios privados no está garantizada.
4. **No** inicializar con README si ya existe el local (para evitar historiales separados).
5. Agregar al docente como **Admin**: Settings → Collaborators and teams → Add people → rol
   **Admin** (o invitarlo a la organización con rol Owner/Admin).
6. Agregar a los tres integrantes con permiso **Write**.

### 7.2 Proteger `main`

`main` se protege con un **Ruleset** (Settings → Rules → Rulesets → New branch ruleset),
que es el mecanismo actual de GitHub y reemplaza a las "branch protection rules" clásicas:

- Target: la rama por defecto (`main`).
- [x] Restrict deletions
- [x] Require a pull request before merging, con **1** aprobación
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require conversation resolution before merging
- [x] Require status checks to pass: `Flutter analyze y tests` y `Pruebas del backend`
- [x] Block force pushes

### 7.3 Configuración general

- Settings → General → **Squash merging** activado; merge commit y rebase desactivados.
- Automatically delete head branches: activado.
- Secrets: solo en Settings → Secrets and variables → Actions, nunca en el código.

---

## 8. Subir el repositorio local por primera vez

Si el repositorio remoto **ya existe vacío**:

```bash
git remote add origin git@github.com:ORG/sigse-uaa.git
git branch -M main
git push -u origin main
```

Si el remoto se creó con README/licencia:

```bash
git remote add origin git@github.com:ORG/sigse-uaa.git
git fetch origin
git rebase origin/main --allow-unrelated-histories
git push -u origin main
```

Verificar:

```bash
git remote -v
git log --oneline --graph --decorate -10
```

---

## 9. Conflictos

```bash
git fetch origin
git rebase origin/main
# Git marca los archivos en conflicto
git status
# editar y resolver
git add <archivo>
git rebase --continue
# si te equivocas:
git rebase --abort
```

Reglas:

- No resolver “a ciegas” aceptando todo un lado.
- Probar después de resolver (`flutter analyze`, `npm test`).
- Si el conflicto es grande, pedir ayuda al dueño del otro cambio.
- Nunca hacer force push a `main`.

---

## 10. Buenas prácticas y prohibiciones

### Sí

- Commits frecuentes y significativos.
- Pull antes de empezar y antes de subir.
- PRs con descripción y evidencia.
- Revisar el trabajo de otros con respeto y detalle.
- Mantener `main` siempre ejecutable.
- Etiquetar releases al cerrar hitos (`v0.1.0`, `v0.2.0`, `v1.0.0`).

### No

- ❌ `git push origin main`
- ❌ `git push --force` a `main`
- ❌ Commitear `.env`, contraseñas, tokens, llaves o `uploads/`
- ❌ Aprobar el PR propio
- ❌ Integrar con CI rojo o conflictos
- ❌ Subir `node_modules/`, `build/`, `.dart_tool/`
- ❌ Hacer un PR gigante con todo el sprint
- ❌ Cambiar el stack o el esquema sin actualizar docs y avisar al equipo
- ❌ Copiar código de otro equipo o de IA sin entenderlo y verificarlo

---

## 11. Evidencia para la evaluación individual

El profesor revisará contribuciones. Se recomienda:

- Cada integrante: **≥ 1 Issue propio por sprint** y **≥ 1 PR revisado** por sprint.
- PRs con capturas o video corto de la funcionalidad.
- Comentarios técnicos en revisiones (no solo “ok”).
- Issues de bugs reales encontrados y corregidos.
- Commits con autoría correcta (no compartir cuenta).
- En el reporte, mapear cada sección con el Issue/PR que la sustenta.

> La calificación es individual: la calidad y comprensión de las aportaciones importan más que
> la cantidad de commits.

---

## 12. Referencias rápidas

```bash
# Estado y sincronización
git status
git fetch --all --prune
git switch main && git pull --ff-only

# Rama y commits
git switch -c feature/mi-tarea
git add -p
git commit -m "feat(scope): descripción"
git push -u origin feature/mi-tarea

# Actualizar con main
git fetch origin && git rebase origin/main

# Limpiar ramas ya integradas (con squash, `--merged` no las detecta)
git fetch --prune            # quita las referencias a ramas remotas borradas
git branch -vv               # [desaparecido] = la rama remota ya no existe, NO que se integró
# Antes de borrar: el PR dice Merged y `git log -1 --format=%h <rama>` coincide con su
# último commit (ver §3.5). Solo entonces:
git branch -D <rama>
```

Convenciones: [Conventional Commits](https://www.conventionalcommits.org/) ·
[GitHub Flow](https://docs.github.com/get-started/using-github/github-flow).
