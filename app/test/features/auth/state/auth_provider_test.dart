import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:sigse/core/models/user.dart';
import 'package:sigse/core/network/api_client.dart';
import 'package:sigse/core/network/api_exception.dart';
import 'package:sigse/core/storage/local_storage.dart';
import 'package:sigse/core/storage/storage_keys.dart';
import 'package:sigse/features/auth/data/auth_repository.dart';
import 'package:sigse/features/auth/data/session_store.dart';
import 'package:sigse/features/auth/state/auth_provider.dart';

import '../../../support/fakes.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late LocalStorage storage;
  late ApiClient api;
  late AuthProvider auth;
  late http.Request? lastRequest;

  /// Arma el provider con un backend falso que responde con [handler].
  Future<void> setUpAuth(
    MockClientHandler handler, {
    Map<String, Object> saved = const {},
  }) async {
    lastRequest = null;
    storage = await fakeStorage(saved);
    api = fakeApi((request) {
      lastRequest = request;
      return handler(request);
    });
    auth = AuthProvider(
      repository: AuthRepository(api),
      sessionStore: SessionStore(storage),
      apiClient: api,
    );
  }

  Future<http.Response> loginOk(http.Request _) async =>
      jsonResponse({'token': 'jwt-nuevo', 'user': demoUser.toJson()});

  group('restoreSession', () {
    test('sin sesión guardada queda sin autenticar', () async {
      await setUpAuth(loginOk);

      expect(auth.isRestoring, isTrue);
      await auth.restoreSession();

      expect(auth.isRestoring, isFalse);
      expect(auth.status, AuthStatus.unauthenticated);
      expect(api.token, isNull);
    });

    test('con sesión guardada entra sin pedir login', () async {
      await setUpAuth(loginOk, saved: savedSession(token: 'jwt-guardado'));

      await auth.restoreSession();

      expect(auth.status, AuthStatus.authenticated);
      expect(auth.user!.email, demoUser.email);
      expect(api.token, 'jwt-guardado');
    });

    test('con solo el token guardado lo descarta', () async {
      await setUpAuth(loginOk, saved: {StorageKeys.token: 'huerfano'});

      await auth.restoreSession();

      expect(auth.status, AuthStatus.unauthenticated);
      expect(storage.readString(StorageKeys.token), isNull);
    });
  });

  group('login', () {
    test('correcto: guarda la sesión y pone el token en ApiClient', () async {
      await setUpAuth(loginOk);
      await auth.restoreSession();

      final ok = await auth.login('usuario@example.com', 'SigseDemo2026!');

      expect(ok, isTrue);
      expect(auth.status, AuthStatus.authenticated);
      expect(api.token, 'jwt-nuevo');
      expect(storage.readString(StorageKeys.token), 'jwt-nuevo');
      expect(lastRequest!.url.path, '/api/auth/login');
      expect(jsonDecode(lastRequest!.body), {
        'email': 'usuario@example.com',
        'password': 'SigseDemo2026!',
      });
    });

    test('401 INVALID_CREDENTIALS muestra el error sin guardar nada', () async {
      await setUpAuth(
        (_) async => errorResponse(
          401,
          'INVALID_CREDENTIALS',
          'Correo o contraseña incorrectos.',
        ),
      );
      await auth.restoreSession();

      final ok = await auth.login('usuario@example.com', 'mala');

      expect(ok, isFalse);
      expect(auth.status, AuthStatus.error);
      expect(auth.errorMessage, 'Correo o contraseña incorrectos.');
      expect(storage.readString(StorageKeys.token), isNull);
    });

    test('403 USER_INACTIVE da un mensaje distinto', () async {
      await setUpAuth(
        (_) async =>
            errorResponse(403, 'USER_INACTIVE', 'Tu cuenta está desactivada.'),
      );
      await auth.restoreSession();

      await auth.login('baja@example.com', 'Secreta123');

      expect(auth.errorMessage, 'Tu cuenta está desactivada.');
    });

    test('clearError regresa a sin autenticar', () async {
      await setUpAuth(
        (_) async => errorResponse(401, 'INVALID_CREDENTIALS', 'Incorrecto.'),
      );
      await auth.restoreSession();
      await auth.login('a@b.co', 'x');

      auth.clearError();

      expect(auth.status, AuthStatus.unauthenticated);
      expect(auth.errorMessage, isNull);
    });
  });

  group('register', () {
    test('409 EMAIL_TAKEN se muestra en el campo de correo', () async {
      await setUpAuth(
        (_) async => errorResponse(
          409,
          'EMAIL_TAKEN',
          'Ya existe una cuenta con ese correo.',
        ),
      );
      await auth.restoreSession();

      await auth.register('Ana López', 'usuario@example.com', 'Secreta123');

      expect(auth.fieldErrors, {
        'email': 'Ya existe una cuenta con ese correo.',
      });
    });

    test('422 reparte los details por campo', () async {
      await setUpAuth(
        (_) async => errorResponse(
          422,
          'VALIDATION_ERROR',
          'Revisa los datos enviados.',
          details: [
            {
              'path': 'name',
              'message': 'El nombre debe tener al menos 3 caracteres',
            },
            {
              'path': 'password',
              'message': 'La contraseña debe incluir al menos un número',
            },
          ],
        ),
      );
      await auth.restoreSession();

      await auth.register('An', 'ana@uaa.mx', 'sinnumero');

      expect(auth.fieldErrors, {
        'name': 'El nombre debe tener al menos 3 caracteres',
        'password': 'La contraseña debe incluir al menos un número',
      });
    });

    test('con varios errores del mismo campo muestra el primero', () async {
      await setUpAuth(
        (_) async => errorResponse(
          422,
          'VALIDATION_ERROR',
          'Revisa los datos enviados.',
          details: [
            {
              'path': 'password',
              'message': 'La contraseña debe tener al menos 8 caracteres',
            },
            {
              'path': 'password',
              'message': 'La contraseña debe incluir al menos un número',
            },
          ],
        ),
      );
      await auth.restoreSession();

      await auth.register('Ana López', 'ana@uaa.mx', 'abc');

      expect(auth.fieldErrors, {
        'password': 'La contraseña debe tener al menos 8 caracteres',
      });
    });
  });

  group('cierre de sesión', () {
    test('logout borra token, usuario y caché del usuario', () async {
      await setUpAuth(
        loginOk,
        saved: {
          ...savedSession(),
          StorageKeys.inspectionsCache(demoUser.id): '[]',
          StorageKeys.lastSync(demoUser.id): '2026-11-27',
          StorageKeys.themeMode: 'dark',
        },
      );
      await auth.restoreSession();

      await auth.logout();

      expect(auth.status, AuthStatus.unauthenticated);
      expect(auth.user, isNull);
      expect(api.token, isNull);
      expect(storage.readString(StorageKeys.token), isNull);
      expect(storage.readString(StorageKeys.user), isNull);
      expect(
        storage.readString(StorageKeys.inspectionsCache(demoUser.id)),
        isNull,
      );
      expect(storage.readString(StorageKeys.lastSync(demoUser.id)), isNull);
      expect(storage.readString(StorageKeys.themeMode), 'dark');
    });

    test('un 401 de otra pantalla cierra la sesión con mensaje', () async {
      await setUpAuth(loginOk, saved: savedSession());
      await auth.restoreSession();

      final closed = await auth.handleApiError(
        const ApiException(
          message: 'Tu sesión expiró o no es válida.',
          statusCode: 401,
          code: 'INVALID_TOKEN',
        ),
        sessionId: auth.sessionId,
      );

      expect(closed, isTrue);
      expect(auth.isAuthenticated, isFalse);
      expect(auth.errorMessage, AuthProvider.sessionExpiredMessage);
      expect(storage.readString(StorageKeys.token), isNull);
    });

    test('403 USER_INACTIVE con sesión abierta también la cierra', () async {
      await setUpAuth(loginOk, saved: savedSession());
      await auth.restoreSession();

      final closed = await auth.handleApiError(
        const ApiException(
          message: 'Tu cuenta está desactivada.',
          statusCode: 403,
          code: 'USER_INACTIVE',
        ),
        sessionId: auth.sessionId,
      );

      expect(closed, isTrue);
      expect(auth.errorMessage, 'Tu cuenta está desactivada.');
    });

    test('otros errores no cierran la sesión', () async {
      await setUpAuth(loginOk, saved: savedSession());
      await auth.restoreSession();

      final closed = await auth.handleApiError(
        const ApiException(
          message: 'Sin permiso',
          statusCode: 403,
          code: 'FORBIDDEN',
        ),
        sessionId: auth.sessionId,
      );

      expect(closed, isFalse);
      expect(auth.isAuthenticated, isTrue);
    });

    test('un 401 de una sesión anterior no cierra la actual', () async {
      await setUpAuth(loginOk, saved: savedSession());
      await auth.restoreSession();
      final oldSession = auth.sessionId;

      await auth.logout();
      await auth.login('usuario@example.com', 'SigseDemo2026!');
      final closed = await auth.handleApiError(
        const ApiException(
          message: 'Tu sesión expiró o no es válida.',
          statusCode: 401,
          code: 'INVALID_TOKEN',
        ),
        sessionId: oldSession,
      );

      expect(closed, isFalse);
      expect(auth.isAuthenticated, isTrue);
      expect(storage.readString(StorageKeys.token), 'jwt-nuevo');
    });

    test(
      'dos 401 seguidos de la misma sesión la cierran una sola vez',
      () async {
        await setUpAuth(loginOk, saved: savedSession());
        await auth.restoreSession();
        final session = auth.sessionId;
        const expired = ApiException(
          message: 'Tu sesión expiró o no es válida.',
          statusCode: 401,
          code: 'INVALID_TOKEN',
        );

        final results = await Future.wait([
          auth.handleApiError(expired, sessionId: session),
          auth.handleApiError(expired, sessionId: session),
        ]);

        expect(results, [isTrue, isFalse]);
        expect(auth.isAuthenticated, isFalse);
      },
    );

    test('USER_INACTIVE solo cierra la sesión si viene con 403', () async {
      await setUpAuth(loginOk, saved: savedSession());
      await auth.restoreSession();

      final closed = await auth.handleApiError(
        const ApiException(
          message: 'Respuesta inesperada',
          statusCode: 500,
          code: 'USER_INACTIVE',
        ),
        sessionId: auth.sessionId,
      );

      expect(closed, isFalse);
      expect(auth.isAuthenticated, isTrue);
    });
  });

  test('updateUser actualiza la sesión guardada', () async {
    await setUpAuth(loginOk, saved: savedSession());
    await auth.restoreSession();
    const renamed = User(
      id: 3,
      name: 'Nombre Nuevo',
      email: 'usuario@example.com',
      role: 'usuario',
    );

    await auth.updateUser(renamed);

    expect(auth.user!.name, 'Nombre Nuevo');
    expect(SessionStore(storage).readUser()!.name, 'Nombre Nuevo');
  });
}
