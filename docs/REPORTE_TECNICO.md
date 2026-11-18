# Reporte técnico y defensa — SIGSE

> Este documento es el **guion** del reporte (22 secciones del PDF) y de la presentación.
> No sustituye al reporte final; sirve para repartir la redacción y no olvidar nada.

---

## 1. Estructura del reporte (22 secciones)

| # | Sección | Contenido clave | Responsable | Fuente |
| ---: | --- | --- | --- | --- |
| 1 | Portada | Datos UAA, materia, integrantes, docente, fecha | Edson | — |
| 2 | Introducción | Contexto de señalización universitaria y objetivo | Edson | PDF |
| 3 | Planteamiento del problema | Señales sin revisión, riesgos, proceso manual | Diana | PDF + observación |
| 4 | Objetivo general | Sistema multiplataforma de inspección | Edson | PDF |
| 5 | Objetivos específicos | 5–7 objetivos medibles | Edson | Plan |
| 6 | Justificación | Valor para la UAA, seguridad y trazabilidad | Diana | — |
| 7 | Requisitos funcionales y no funcionales | Tabla RF/RNF con prioridad | Diana | `docs/PLAN_TRABAJO.md` |
| 8 | Arquitectura del sistema | Cliente-servidor, capas, decisiones | Edson | `docs/ARQUITECTURA.md` |
| 9 | Diagrama de componentes | Mermaid/figura con app, API, DB, uploads | Edson | `docs/ARQUITECTURA.md` |
| 10 | Modelo entidad-relación | ER, diccionario, integridad | Diana | `docs/MODELO_DATOS.md` |
| 11 | API REST | Endpoints, auth, errores, ejemplos | Diana | `docs/API.md` |
| 12 | Diseño de interfaces | Pantallas, flujos, responsive, Material 3 | Edson + Alonso | capturas |
| 13 | Manejo de estado | Provider, ciclo de vida, estados UI | Edson | código |
| 14 | Recursos móviles | Cámara, galería, GPS, acelerómetro, permisos | Alonso | código + pruebas |
| 15 | Persistencia local | shared_preferences, caché, offline | Diana | código |
| 16 | Comunicación entre dispositivos | Flujo HTTP, prueba 9.1, evidencia | Alonso | `docs/PRUEBAS.md` |
| 17 | Organización del trabajo en GitHub | Issues, Projects, ramas, PRs, CI | Edson | GitHub |
| 18 | Pruebas realizadas | 9.1–9.5, matriz, resultados | Todos | `docs/PRUEBAS.md` |
| 19 | Resultados obtenidos | Capturas, métricas, estado final | Todos | demo |
| 20 | Problemas y soluciones | Bugs, decisiones, deuda técnica | Todos | Issues |
| 21 | Conclusiones | Aprendizajes y trabajo futuro | Todos | — |
| 22 | Bibliografía | Flutter, Express, MySQL, OWASP, etc. | Edson | — |

### Reglas de redacción

- Explicar **decisiones técnicas**, no solo capturas.
- No incluir el código completo; referenciar archivos de GitHub.
- Figuras numeradas y con pie (`Figura 1. ...`), tablas igual.
- Citas en formato APA 7.
- Tono formal, español, sin primera persona del singular.
- Revisión cruzada: nadie edita solo su sección sin que otro la lea.

---

## 2. Presentación (10–15 min)

| Diapositiva | Contenido | Quién |
| --- | --- | --- |
| 1 | Portada y equipo | Edson |
| 2 | Problema y objetivo | Diana |
| 3 | Arquitectura y stack | Edson |
| 4 | Modelo de datos y API | Diana |
| 5 | Flujo de una inspección (estados + regla) | Alonso |
| 6 | Demo: login y creación con foto/GPS | Alonso |
| 7 | Demo: operador asigna, atiende y finaliza | Alonso |
| 8 | Demo: segundo dispositivo ve el cambio | Diana |
| 9 | Offline, responsive y multiplataforma | Edson |
| 10 | GitHub: Issues, PRs, CI y reparto | Edson |
| 11 | Pruebas y resultados | Diana |
| 12 | Conclusiones y trabajo futuro | Edson |

**Consejo:** la demo debe ser un guion ensayado, con datos preparados y un plan B (video o
build local) si falla la red.

---

## 3. Guion de demostración (basado en el PDF, sección 15)

1. Mostrar `/api/health` y `/api/health/db` en el navegador.
2. Mostrar MySQL con las tablas y algunos registros.
3. Abrir la app Android e iniciar sesión como usuario.
4. Crear una inspección: título, categoría, foto, ubicación y observaciones.
5. Mostrar la inclinación medida con el acelerómetro.
6. Abrir la app web (u otro dispositivo) e iniciar como operador.
7. Ver la inspección recién creada (comunicación entre dispositivos).
8. Asignarla al operador e iniciarla.
9. Intentar finalizar sin resultado/condición → mostrar el error de la regla.
10. Completar resultado y condición → finalizar correctamente.
11. Volver al primer dispositivo y refrescar: estado e historial actualizados.
12. Activar modo offline: mostrar caché y mensaje de error controlado.
13. Mostrar versión web y escritorio.
14. Mostrar GitHub: Issues, Project, ramas, PRs revisados, CI y contribuciones.
15. Responder preguntas.

---

## 4. Preparación de la defensa individual

El profesor puede preguntar a cualquiera sobre cualquier componente. Preparar respuestas para:

### Flutter

- ¿Dónde se inicializa el estado global y por qué Provider?
- ¿Cómo se maneja el ciclo de vida de un `ChangeNotifier`?
- ¿Cómo se evita un `setState` después de `dispose`?
- ¿Cómo se construye una petición autenticada?
- ¿Dónde se validan los formularios?
- ¿Cómo se logra el diseño responsivo?
- ¿Cómo funciona la caché offline y cuándo se invalida?

### Backend

- ¿Dónde se verifica el rol y la propiedad de un recurso?
- ¿Cómo se evita una escalada de privilegios en el registro?
- ¿Cómo se garantiza que no se finalice sin resultado/condición?
- ¿Qué pasa si dos operadores cambian el estado a la vez?
- ¿Cómo se previene SQL injection?
- ¿Cómo se manejan errores y qué se filtra al cliente?
- ¿Dónde se guardan las evidencias y qué riesgo tiene?

### Base de datos

- ¿Por qué esas entidades y relaciones?
- ¿Qué hace el `CHECK` de finalización?
- ¿Qué índices existen y para qué consultas?
- ¿Qué pasa al borrar una inspección con evidencias?
- ¿Cómo se audita un cambio de estado?

### GitHub y proceso

- ¿Por qué no se hace push a `main`?
- ¿Cómo se relacionan Issue, rama, commits y PR?
- ¿Qué revisa un revisor?
- ¿Cómo se resolvió un conflicto?
- ¿Qué evidencia hay de la contribución de cada quien?

### Recursos móviles

- ¿Cómo se solicitan permisos de cámara/GPS?
- ¿Qué pasa si el usuario niega el permiso?
- ¿Cómo se usa el acelerómetro y para qué?
- ¿Qué alternativas hay en web/escritorio?

**Regla:** si no sabes algo, dilo y explica cómo lo investigarías. No inventes.

---

## 5. Evidencias que deben existir al final

- [ ] Capturas de las 8 pantallas.
- [ ] Video corto de la prueba 9.1 (dos dispositivos).
- [ ] Capturas de cámara, GPS, acelerómetro y offline.
- [ ] Resultados de tests (`npm test`, `flutter test`, CI).
- [ ] Issues/PRs con revisión.
- [ ] Tablero Projects con columnas y tarjetas.
- [ ] URL web, APK y build de escritorio.
- [ ] Reporte PDF y presentación.

---

## 6. Reparto de redacción (equitativo)

| Persona | Secciones | Peso |
| --- | --- | --- |
| Edson | 1, 2, 4, 5, 8, 9, 12, 13, 17, 22 | ~34 % |
| Diana | 3, 6, 7, 10, 11, 15, 18 (apoyo), 19 (apoyo) | ~33 % |
| Alonso | 12 (apoyo), 14, 16, 18, 19, 20 | ~33 % |
| Todos | 21 conclusiones y revisión final | — |

La portada y la bibliografía las consolida Edson; la revisión final es cruzada.
