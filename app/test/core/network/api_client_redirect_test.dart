// Con un servidor HTTP real: comprueba que la descarga no sigue redirecciones
// (ni al mismo servidor), así el token nunca viaja a otra dirección.
@TestOn('vm')
library;

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/core/network/api_client.dart';
import 'package:sigse/core/network/api_exception.dart';

void main() {
  test('downloadFile no sigue una redirección real', () async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    addTearDown(() => server.close(force: true));
    final requested = <String>[];
    server.listen((request) {
      requested.add(request.uri.path);
      if (request.uri.path == '/uploads/foto.jpg') {
        request.response
          ..statusCode = HttpStatus.found
          ..headers.set('location', '/otro-lugar');
      }
      request.response.close();
    });
    final api = ApiClient(baseUrl: 'http://127.0.0.1:${server.port}/api')
      ..setToken('token-demo');

    await expectLater(
      api.downloadFile('/uploads/foto.jpg'),
      throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 302)),
    );
    expect(requested, ['/uploads/foto.jpg']);
  });
}
