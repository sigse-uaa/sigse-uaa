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
}
