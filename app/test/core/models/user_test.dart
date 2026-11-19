import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/core/models/user.dart';

void main() {
  test('convierte el JSON del backend en User', () {
    final user = User.fromJson(<String, dynamic>{
      'id': 2,
      'name': 'Usuario Demo',
      'email': 'usuario@uaa.mx',
      'role': 'operador',
    });

    expect(user.id, 2);
    expect(user.name, 'Usuario Demo');
    expect(user.email, 'usuario@uaa.mx');
    expect(user.role, 'operador');
    expect(user.isOperator, isTrue);
  });

  test('usa valores seguros si faltan campos', () {
    final user = User.fromJson(<String, dynamic>{});

    expect(user.id, 0);
    expect(user.name, isEmpty);
    expect(user.email, isEmpty);
    expect(user.role, 'usuario');
    expect(user.isOperator, isFalse);
  });
}
