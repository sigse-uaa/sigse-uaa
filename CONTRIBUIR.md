# Cómo contribuir a SIGSE

Este repositorio es académico y de trabajo en equipo. La rama `main` está protegida: **no se
permite subir cambios directamente**. Todo cambio entra por una solicitud de cambios
(*Pull Request*, PR).

## Reglas mínimas

1. Toma o crea una incidencia (*Issue*) y asígnatela antes de empezar.
2. Crea una rama desde `main` actualizada. Usa los prefijos técnicos del proyecto:
   `feature/…`, `fix/…`, `docs/…`, `test/…` o `chore/…`.
3. Haz commits pequeños y atómicos con el formato de **commits convencionales**
   (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
4. Abre una solicitud de cambios (PR) enlazando la incidencia (`Closes #N`).
5. Pide revisión a otro integrante; **no** apruebes tu propia solicitud.
6. Espera la integración continua (CI) en verde y al menos una aprobación.
7. La solicitud se fusiona con **squash** y se elimina la rama.

La guía completa —nombres de ramas, tipos de commit, plantillas, revisión, conflictos y
configuración de GitHub— está en **[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)**.

## Antes de pedir revisión

- [ ] `flutter analyze` sin errores (si tocaste `app/`).
- [ ] `flutter test` / `npm test` en verde (si aplica).
- [ ] Sin secretos, credenciales ni archivos generados.
- [ ] Documentación actualizada si cambió el contrato de la API o el modelo de datos.
- [ ] Capturas o evidencia de la funcionalidad en la solicitud.
- [ ] `docs/PLAN_TRABAJO.md` actualizado si cambió una decisión o el estado del proyecto.

## Uso de IA

Permitido como apoyo, pero cada integrante debe entender, verificar y poder explicar el código
que integra. No se aceptan contribuciones que no pueda defender en la evaluación individual.
