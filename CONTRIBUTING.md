# Contribuir a SIGSE

Este repositorio es académico y de trabajo en equipo. La rama `main` está protegida: **no se
permite push directo**. Todo cambio entra por Pull Request.

## Reglas mínimas

1. Toma (o crea) un Issue y asígnatelo antes de empezar.
2. Crea una rama desde `main` actualizada: `feature/…`, `fix/…`, `docs/…` o `test/…`.
3. Haz commits pequeños y atómicos con Conventional Commits.
4. Abre un Pull Request enlazando el Issue (`Closes #N`).
5. Solicita revisión a otro integrante; **no** apruebes tu propio PR.
6. Espera CI en verde y al menos una aprobación.
7. Se integra con **Squash and merge** y se elimina la rama.

La guía completa —nombres de ramas, tipos de commit, plantillas, revisión, conflictos y
configuración de GitHub— está en **[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)**.

## Antes de pedir revisión

- [ ] `flutter analyze` sin errores (si tocaste `app/`).
- [ ] `flutter test` / `npm test` en verde (si aplica).
- [ ] Sin secretos, credenciales ni archivos generados.
- [ ] Documentación actualizada si cambió el contrato de API o el modelo de datos.
- [ ] Capturas o evidencia de la funcionalidad en el PR.
- [ ] `docs/PLAN_TRABAJO.md` actualizado si cambió una decisión o el estado del proyecto.

## Uso de IA

Permitido como apoyo, pero cada integrante debe entender, verificar y poder explicar el código
que integra. No se aceptan contribuciones que no pueda defender en la evaluación individual.
