import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/features/auth/presentation/auth_validators.dart';

void main() {
  test('nombre entre 3 y 120 caracteres', () {
    expect(AuthValidators.name('  An '), isNotNull);
    expect(AuthValidators.name('Ana'), isNull);
    expect(AuthValidators.name('a' * 121), isNotNull);
  });

  test('correo con formato válido', () {
    expect(AuthValidators.email(''), isNotNull);
    expect(AuthValidators.email('ana@'), isNotNull);
    expect(AuthValidators.email(' ana@uaa.mx '), isNull);
  });

  // Mismos resultados que el backend (Zod 4) con estos correos.
  test('el correo se valida igual que en el backend', () {
    const accepted = [
      'usuario@example.com',
      'a+b@ex.co',
      "a'b@ex.com",
      'a_b@sub.ex.mx',
      'a@1ex.com',
      'a@ex-.com',
      '  A@EX.COM ',
    ];
    const rejected = [
      'a@b.c',
      'a..b@example.com',
      '.a@ex.com',
      'a.@ex.com',
      'a@-ex.com',
      'ñ@ex.com',
      'a@ex.com.',
      'a@ex..com',
      'a@b@c.com',
      'a@ex.c0m',
    ];
    for (final email in accepted) {
      expect(AuthValidators.email(email), isNull, reason: email);
    }
    for (final email in rejected) {
      expect(AuthValidators.email(email), 'Correo inválido', reason: email);
    }
  });

  test('contraseña nueva: mínimo 8, una letra y un número', () {
    expect(AuthValidators.newPassword('Ab1'), isNotNull);
    expect(AuthValidators.newPassword('12345678'), isNotNull);
    expect(AuthValidators.newPassword('abcdefgh'), isNotNull);
    expect(AuthValidators.newPassword('Secreta123'), isNull);
  });

  test('el límite de la contraseña cuenta bytes, no caracteres', () {
    // 36 letras "ñ" son 36 caracteres pero 72 bytes; una más ya no cabe.
    expect(AuthValidators.loginPassword('ñ' * 36), isNull);
    expect(AuthValidators.loginPassword('ñ' * 37), isNotNull);
    expect(AuthValidators.newPassword('${'ñ' * 36}a1'), isNotNull);
  });
}
