import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/navigation/app_routes.dart';
import 'core/network/api_client.dart';
import 'core/storage/local_storage.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/loading_view.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/data/session_store.dart';
import 'features/auth/presentation/login_page.dart';
import 'features/auth/presentation/register_page.dart';
import 'features/auth/state/auth_provider.dart';
import 'features/home/data/stats_repository.dart';
import 'features/shell/presentation/app_shell.dart';

class SigseApp extends StatefulWidget {
  const SigseApp({super.key, required this.storage, required this.apiClient});

  final LocalStorage storage;
  final ApiClient apiClient;

  @override
  State<SigseApp> createState() => _SigseAppState();
}

class _SigseAppState extends State<SigseApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  late final AuthProvider _auth;
  bool? _wasAuthenticated;

  @override
  void initState() {
    super.initState();
    _auth = AuthProvider(
      repository: AuthRepository(widget.apiClient),
      sessionStore: SessionStore(widget.storage),
      apiClient: widget.apiClient,
    )..addListener(_onAuthChanged);
    _auth.restoreSession();
  }

  /// Al entrar o salir de la sesión se cierran las pantallas apiladas encima
  /// (registro, detalle, etc.): así nada protegido queda visible sin sesión.
  void _onAuthChanged() {
    final isAuthenticated = _auth.isAuthenticated;
    if (_wasAuthenticated != null && _wasAuthenticated != isAuthenticated) {
      _navigatorKey.currentState?.popUntil((route) => route.isFirst);
    }
    _wasAuthenticated = isAuthenticated;
  }

  @override
  void dispose() {
    _auth
      ..removeListener(_onAuthChanged)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: widget.apiClient),
        ChangeNotifierProvider<AuthProvider>.value(value: _auth),
        Provider<StatsRepository>(
          create: (_) => StatsRepository(widget.apiClient),
        ),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'SIGSE',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const _AuthGate(),
        routes: {AppRoutes.register: (_) => const RegisterPage()},
      ),
    );
  }
}

/// Rutas protegidas: sin sesión solo existen el login y el registro.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isAuthenticated) {
      return const AppShell();
    }
    if (auth.isRestoring) {
      return const Scaffold(body: LoadingView());
    }
    return const LoginPage();
  }
}
