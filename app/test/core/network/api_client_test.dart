import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:sigse/core/network/api_client.dart';
import 'package:sigse/core/network/api_exception.dart';

void main() {
  test('envía token y decodifica una respuesta JSON', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return http.Response(
        jsonEncode(<String, dynamic>{'status': 'ok'}),
        200,
        headers: <String, String>{'content-type': 'application/json'},
      );
    });
    final api = ApiClient(client: client, baseUrl: 'https://example.com/api/')
      ..setToken('token-demo');

    final response = await api.get('/health');

    expect(response['status'], 'ok');
    expect(captured.url.toString(), 'https://example.com/api/health');
    expect(captured.headers['Authorization'], 'Bearer token-demo');
  });

  test('convierte errores planos del backend en ApiException', () async {
    final client = MockClient((_) async {
      return http.Response(
        jsonEncode(<String, dynamic>{
          'message': 'No autorizado',
          'code': 'unauthorized',
        }),
        401,
        headers: <String, String>{'content-type': 'application/json'},
      );
    });
    final api = ApiClient(client: client, baseUrl: 'https://example.com/api');

    await expectLater(
      api.get('/auth/me'),
      throwsA(
        isA<ApiException>()
            .having((error) => error.statusCode, 'statusCode', 401)
            .having((error) => error.message, 'message', 'No autorizado')
            .having((error) => error.code, 'code', 'unauthorized'),
      ),
    );
  });

  test('lee el formato de error anidado del contrato', () async {
    final client = MockClient((_) async {
      return http.Response(
        jsonEncode(<String, dynamic>{
          'error': <String, dynamic>{
            'message': 'Correo inválido',
            'code': 'VALIDATION_ERROR',
            'details': <Map<String, String>>[
              <String, String>{'path': 'email', 'message': 'Correo inválido'},
            ],
          },
        }),
        422,
        headers: <String, String>{'content-type': 'application/json'},
      );
    });
    final api = ApiClient(client: client, baseUrl: 'https://example.com/api');

    await expectLater(
      api.post('/auth/register', body: <String, String>{'email': 'x'}),
      throwsA(
        isA<ApiException>()
            .having((error) => error.statusCode, 'statusCode', 422)
            .having((error) => error.message, 'message', 'Correo inválido')
            .having((error) => error.code, 'code', 'VALIDATION_ERROR')
            .having((error) => error.details, 'details', isNotEmpty),
      ),
    );
  });

  test('envía archivos como multipart', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return http.Response(
        jsonEncode(<String, dynamic>{'id': 1}),
        201,
        headers: <String, String>{'content-type': 'application/json'},
      );
    });
    final api = ApiClient(client: client, baseUrl: 'https://example.com/api');

    final response = await api.uploadFile(
      '/inspections/1/evidences',
      bytes: <int>[1, 2, 3],
      filename: 'evidencia.jpg',
      fields: <String, String>{'description': 'Fachada'},
    );

    expect(response['id'], 1);
    expect(captured.method, 'POST');
    expect(captured.headers['Authorization'], isNull);
    expect(captured.body, contains('evidencia.jpg'));
    expect(captured.body, contains('Fachada'));
  });

  group('origin', () {
    test('quita /api y la barra final de la URL base', () {
      expect(
        ApiClient(baseUrl: 'http://localhost:3000/api').origin,
        'http://localhost:3000',
      );
      expect(
        ApiClient(baseUrl: 'https://sigse.example.com/api/').origin,
        'https://sigse.example.com',
      );
    });
  });

  group('downloadFile', () {
    const imageBytes = <int>[0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];

    ApiClient apiWith(
      MockClientHandler handler, {
      Duration timeout = const Duration(seconds: 5),
    }) {
      return ApiClient(
        client: MockClient(handler),
        baseUrl: 'https://example.com/api',
        timeout: timeout,
      );
    }

    http.Response apiError(int statusCode, String code, String message) {
      return http.Response(
        jsonEncode(<String, dynamic>{
          'error': <String, dynamic>{
            'code': code,
            'message': message,
            'details': <Object>[],
          },
        }),
        statusCode,
        headers: <String, String>{
          'content-type': 'application/json; charset=utf-8',
        },
      );
    }

    test('no sigue redirecciones: el token no sale del servidor', () async {
      late http.Request captured;
      var calls = 0;
      final api = apiWith((request) async {
        calls++;
        captured = request;
        return http.Response(
          '',
          302,
          headers: <String, String>{'location': 'https://otro.example.com/x'},
        );
      })..setToken('token-demo');

      await expectLater(
        api.downloadFile('/uploads/foto.jpg'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 302)),
      );
      expect(captured.followRedirects, isFalse);
      expect(calls, 1);
    });

    test(
      'descarga desde el origen con el token y devuelve los bytes',
      () async {
        late http.Request captured;
        final api = apiWith((request) async {
          captured = request;
          return http.Response.bytes(
            imageBytes,
            200,
            headers: <String, String>{'content-type': 'image/jpeg'},
          );
        })..setToken('token-demo');

        final bytes = await api.downloadFile('/uploads/3f2b9c1e.jpg');

        expect(bytes, imageBytes);
        expect(captured.method, 'GET');
        expect(
          captured.url.toString(),
          'https://example.com/uploads/3f2b9c1e.jpg',
        );
        expect(captured.headers['Authorization'], 'Bearer token-demo');
        expect(captured.headers['Accept'], '*/*');
        expect(captured.headers.containsKey('Content-Type'), isFalse);
      },
    );

    test('sin sesión no envía Authorization', () async {
      late http.Request captured;
      final api = apiWith((request) async {
        captured = request;
        return http.Response.bytes(imageBytes, 200);
      });

      await api.downloadFile('/uploads/a.jpg');

      expect(captured.headers.containsKey('Authorization'), isFalse);
    });

    test('arma la URL sin duplicar /api ni barras', () async {
      final urls = <String>[];
      final api = apiWith((request) async {
        urls.add(request.url.toString());
        return http.Response.bytes(imageBytes, 200);
      });

      await api.downloadFile('/uploads/demo/senal-salida.jpg');
      await api.downloadFile('uploads/a.jpg');
      await api.downloadFile('//uploads/b.jpg');
      await api.downloadFile('  /uploads/c.png  ');

      expect(urls, <String>[
        'https://example.com/uploads/demo/senal-salida.jpg',
        'https://example.com/uploads/a.jpg',
        'https://example.com/uploads/b.jpg',
        'https://example.com/uploads/c.png',
      ]);
    });

    test('una ruta que parece URL completa no sale del servidor', () async {
      late Uri captured;
      final api = apiWith((request) async {
        captured = request.url;
        return http.Response.bytes(imageBytes, 200);
      })..setToken('token-demo');

      await api.downloadFile('https://otro.example.com/robar.jpg');

      expect(captured.host, 'example.com');
    });

    test('una ruta vacía es un error de programación', () async {
      final api = apiWith((_) async => http.Response.bytes(imageBytes, 200));

      await expectLater(api.downloadFile('  '), throwsArgumentError);
    });

    for (final (status, code, message) in <(int, String, String)>[
      (401, 'INVALID_TOKEN', 'Tu sesión expiró o no es válida.'),
      (403, 'FORBIDDEN', 'No tienes permiso para esta acción.'),
      (404, 'EVIDENCE_NOT_FOUND', 'La evidencia no existe.'),
    ]) {
      test('$status $code llega como ApiException', () async {
        final api = apiWith((_) async => apiError(status, code, message));

        await expectLater(
          api.downloadFile('/uploads/a.jpg'),
          throwsA(
            isA<ApiException>()
                .having((error) => error.statusCode, 'statusCode', status)
                .having((error) => error.code, 'code', code)
                .having((error) => error.message, 'message', message),
          ),
        );
      });
    }

    test('un error sin JSON usa el mensaje genérico del código', () async {
      final api = apiWith(
        (_) async => http.Response('<html>Not Found</html>', 404),
      );

      await expectLater(
        api.downloadFile('/uploads/a.jpg'),
        throwsA(
          isA<ApiException>()
              .having((error) => error.statusCode, 'statusCode', 404)
              .having((error) => error.code, 'code', isNull)
              .having(
                (error) => error.message,
                'message',
                'El recurso solicitado no existe.',
              ),
        ),
      );
    });

    test('si el servidor tarda demasiado lanza TIMEOUT', () async {
      final api = apiWith((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 200));
        return http.Response.bytes(imageBytes, 200);
      }, timeout: const Duration(milliseconds: 20));

      await expectLater(
        api.downloadFile('/uploads/a.jpg'),
        throwsA(
          isA<ApiException>().having((error) => error.code, 'code', 'TIMEOUT'),
        ),
      );
    });

    test('sin conexión lanza NETWORK_ERROR', () async {
      final api = apiWith((_) async {
        throw http.ClientException('Connection refused');
      });

      await expectLater(
        api.downloadFile('/uploads/a.jpg'),
        throwsA(
          isA<ApiException>()
              .having((error) => error.code, 'code', 'NETWORK_ERROR')
              .having((error) => error.statusCode, 'statusCode', isNull),
        ),
      );
    });
  });
}
