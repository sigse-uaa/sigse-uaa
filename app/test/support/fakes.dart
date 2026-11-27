import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sigse/core/models/user.dart';
import 'package:sigse/core/network/api_client.dart';
import 'package:sigse/core/storage/local_storage.dart';
import 'package:sigse/core/storage/storage_keys.dart';

/// Datos y dobles de prueba compartidos. Solo se usan en `test/`.
const demoUser = User(
  id: 3,
  name: 'Usuario Demo',
  email: 'usuario@example.com',
  role: 'usuario',
);

const demoOperator = User(
  id: 1,
  name: 'Operador Demo 1',
  email: 'operador1@example.com',
  role: 'operador',
);

http.Response jsonResponse(Object body, [int statusCode = 200]) {
  return http.Response(
    jsonEncode(body),
    statusCode,
    headers: const {'content-type': 'application/json; charset=utf-8'},
  );
}

http.Response errorResponse(
  int statusCode,
  String code,
  String message, {
  List<Map<String, String>> details = const [],
}) {
  return jsonResponse({
    'error': {'code': code, 'message': message, 'details': details},
  }, statusCode);
}

ApiClient fakeApi(MockClientHandler handler) {
  return ApiClient(client: MockClient(handler), baseUrl: 'http://test/api');
}

/// Valores de `shared_preferences` con una sesión ya guardada.
Map<String, Object> savedSession({User user = demoUser, String token = 'jwt'}) {
  return {
    StorageKeys.token: token,
    StorageKeys.user: jsonEncode(user.toJson()),
  };
}

Future<LocalStorage> fakeStorage([Map<String, Object> values = const {}]) {
  SharedPreferences.setMockInitialValues(values);
  return LocalStorage.create();
}

Map<String, dynamic> statsBody({int total = 0, int pendingAssignedToMe = 0}) {
  return {
    'data': {
      'total': total,
      'byStatus': {
        'pendiente': total,
        'asignada': 0,
        'en_proceso': 0,
        'finalizada': 0,
        'cancelada': 0,
      },
      'byPriority': {'baja': 0, 'media': total, 'alta': 0},
      'last7Days': total,
      'pendingAssignedToMe': pendingAssignedToMe,
    },
  };
}
