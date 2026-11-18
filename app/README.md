# SIGSE — app Flutter

Esqueleto mínimo de la aplicación. Solo incluye:

- `lib/main.dart`: punto de entrada.
- `lib/app.dart`: `MaterialApp` y tema.
- `lib/core/theme/`: tema Material 3.
- `lib/features/home/`: pantalla inicial de ejemplo.
- `test/`: prueba de humo.

Plataformas generadas: Android, web y Linux. iOS no se genera porque el proyecto no lo
requiere y su compilación necesita macOS + Xcode.

```bash
flutter pub get
flutter analyze
flutter test
flutter run -d chrome
flutter run -d linux
```
