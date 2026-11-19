# SIGSE — app Flutter

Base mínima de la aplicación. Incluye:

- `lib/main.dart`: punto de entrada.
- `lib/app.dart`: `MaterialApp` y tema.
- `lib/core/config/`: `AppConfig` (`API_BASE_URL`, timeout).
- `lib/core/network/`: `ApiClient` y `ApiException`.
- `lib/core/storage/`: `LocalStorage` con `shared_preferences`.
- `lib/core/models/`: modelo `User`.
- `lib/core/navigation/`: constantes de rutas.
- `lib/core/theme/`: tema Material 3.
- `lib/core/widgets/`: `EmptyState`, `ErrorView` y `LoadingView`.
- `lib/features/home/`: pantalla inicial de ejemplo.
- `lib/features/shell/`: navegación responsiva (`NavigationBar` / `NavigationRail`).
- `test/`: pruebas de humo, red, almacenamiento, modelo y shell.

Plataformas generadas: Android, web y Linux. iOS no se genera porque el proyecto no lo
requiere y su compilación necesita macOS + Xcode.

```bash
flutter pub get
flutter analyze
flutter test
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api
flutter run -d linux
```

Emulador Android: usa `http://10.0.2.2:3000/api` como `API_BASE_URL`. En dispositivo físico usa
la IP LAN de la computadora. El CI de Flutter está en `.github/workflows/ci.yml` y ejecuta
`flutter analyze` + `flutter test`.
