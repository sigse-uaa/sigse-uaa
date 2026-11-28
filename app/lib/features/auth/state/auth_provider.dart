import 'package:flutter/foundation.dart';

import '../../../core/models/user.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../data/auth_repository.dart';
import '../data/session_store.dart';

enum AuthStatus { loading, authenticated, unauthenticated, error }

/// Dueño de la sesión: login, registro, restauración, cierre y expiración.
class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required this._repository,
    required this._sessionStore,
    required this._apiClient,
  });

  static const sessionExpiredMessage =
      'Tu sesión expiró. Inicia sesión de nuevo.';

  final AuthRepository _repository;
  final SessionStore _sessionStore;
  final ApiClient _apiClient;

  AuthStatus _status = AuthStatus.loading;
  bool _restoring = true;
  User? _user;
  ApiException? _error;
  int _sessionId = 0;

  AuthStatus get status => _status;
  User? get user => _user;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;

  /// `true` solo mientras se lee la sesión guardada al abrir la app.
  bool get isRestoring => _restoring;

  String? get errorMessage => _error?.message;

  /// Cambia al iniciar y al cerrar cada sesión. Quien hace una petición lo lee
  /// **antes** del `await` y lo pasa a [handleApiError]: así un error que llega
  /// tarde, de una sesión anterior, no cierra la sesión actual.
  int get sessionId => _sessionId;

  /// Errores por campo para mostrarlos junto a cada `TextFormField`.
  Map<String, String> get fieldErrors {
    final error = _error;
    if (error == null) {
      return const {};
    }
    if (error.code == 'EMAIL_TAKEN') {
      return {'email': error.message};
    }
    final details = error.details;
    if (details is! List) {
      return const {};
    }
    // Zod puede mandar varios errores del mismo campo; se muestra el primero,
    // que es el mismo que daría la validación de la app.
    final errors = <String, String>{};
    for (final item in details.whereType<Map>()) {
      final path = item['path'];
      final message = item['message'];
      if (path is String && message is String) {
        errors.putIfAbsent(path, () => message);
      }
    }
    return errors;
  }

  Future<void> restoreSession() async {
    final token = _sessionStore.readToken();
    final user = _sessionStore.readUser();

    if (token != null && user != null) {
      _apiClient.setToken(token);
      _user = user;
      _status = AuthStatus.authenticated;
    } else {
      // Si solo quedó una de las dos piezas, la sesión no sirve.
      await _sessionStore.clear();
      _status = AuthStatus.unauthenticated;
    }
    _restoring = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) {
    return _authenticate(
      () => _repository.login(email: email, password: password),
    );
  }

  Future<bool> register(String name, String email, String password) {
    return _authenticate(
      () => _repository.register(name: name, email: email, password: password),
    );
  }

  Future<void> logout() => _endSession();

  /// Lo usa D6 al editar el perfil: la sesión guardada debe quedar al día.
  Future<void> updateUser(User user) async {
    final token = _apiClient.token;
    if (!isAuthenticated || token == null) {
      return;
    }
    _user = user;
    await _sessionStore.save(token, user);
    notifyListeners();
  }

  /// Las demás pantallas le pasan aquí sus errores de la API, junto con el
  /// [sessionId] que leyeron antes de hacer la petición. Si el token ya no
  /// sirve (`401`) o la cuenta fue desactivada (`403 USER_INACTIVE`), cierra la
  /// sesión y la app regresa al login. Devuelve `true` si cerró la sesión.
  Future<bool> handleApiError(
    ApiException error, {
    required int sessionId,
  }) async {
    final sessionLost =
        error.isUnauthorized ||
        (error.isForbidden && error.code == 'USER_INACTIVE');
    // Una respuesta de otra sesión (ya cerrada) no dice nada de la actual.
    if (!sessionLost || !isAuthenticated || sessionId != _sessionId) {
      return false;
    }
    await _endSession(
      reason: ApiException(
        message: error.isUnauthorized ? sessionExpiredMessage : error.message,
        statusCode: error.statusCode,
        code: error.code,
      ),
    );
    return true;
  }

  void clearError() {
    if (_error == null) {
      return;
    }
    _error = null;
    if (_status == AuthStatus.error) {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> _authenticate(Future<AuthSession> Function() request) async {
    _status = AuthStatus.loading;
    _error = null;
    notifyListeners();

    try {
      final session = await request();
      await _sessionStore.save(session.token, session.user);
      _apiClient.setToken(session.token);
      _sessionId++;
      _user = session.user;
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (error) {
      // Aquí un 401 es INVALID_CREDENTIALS, no una sesión vencida.
      _error = error;
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  Future<void> _endSession({ApiException? reason}) async {
    // Antes de cualquier await: otro error de esta misma sesión que llegue
    // mientras tanto ya no la vuelve a cerrar.
    _sessionId++;
    // Primero se borra lo guardado: si la app se cierra a la mitad, no debe
    // quedar una sesión que se restaure sola al volver a abrirla.
    await _sessionStore.clear(userId: _user?.id);
    _apiClient.setToken(null);
    _user = null;
    _error = reason;
    _status = reason == null ? AuthStatus.unauthenticated : AuthStatus.error;
    notifyListeners();
  }
}
