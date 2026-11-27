import '../../../core/models/user.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

/// Respuesta de `/auth/login` y `/auth/register`.
class AuthSession {
  const AuthSession({required this.token, required this.user});

  final String token;
  final User user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final token = json['token'];
    final user = json['user'];
    if (token is! String || token.isEmpty || user is! Map) {
      throw ApiException.invalidResponse();
    }
    return AuthSession(
      token: token,
      user: User.fromJson(Map<String, dynamic>.from(user)),
    );
  }
}

class AuthRepository {
  AuthRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final json = await _apiClient.post(
      '/auth/login',
      body: <String, dynamic>{'email': email, 'password': password},
    );
    return AuthSession.fromJson(json);
  }

  /// El backend siempre crea el rol `usuario`, así que no se envía rol.
  Future<AuthSession> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final json = await _apiClient.post(
      '/auth/register',
      body: <String, dynamic>{
        'name': name,
        'email': email,
        'password': password,
      },
    );
    return AuthSession.fromJson(json);
  }
}
