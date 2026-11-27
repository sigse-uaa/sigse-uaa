import 'dart:convert';

/// Las mismas reglas y mensajes que `backend/src/validators/auth.validators.js`,
/// para avisar sin esperar a la red. El backend sigue siendo quien decide.
abstract final class AuthValidators {
  static const maxPasswordBytes = 72;

  static final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static String? name(String? value) {
    final name = value?.trim() ?? '';
    if (name.isEmpty) {
      return 'El nombre es obligatorio';
    }
    if (name.length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (name.length > 120) {
      return 'El nombre no puede pasar de 120 caracteres';
    }
    return null;
  }

  static String? email(String? value) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) {
      return 'El correo es obligatorio';
    }
    if (email.length > 150) {
      return 'El correo no puede pasar de 150 caracteres';
    }
    if (!_emailPattern.hasMatch(email)) {
      return 'Correo inválido';
    }
    return null;
  }

  /// Login: solo obligatoria y dentro del límite de bcrypt.
  static String? loginPassword(String? value) {
    final password = value ?? '';
    if (password.isEmpty) {
      return 'La contraseña es obligatoria';
    }
    return _tooLong(password);
  }

  /// Registro: las reglas completas de una contraseña nueva.
  static String? newPassword(String? value) {
    final password = value ?? '';
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    final tooLong = _tooLong(password);
    if (tooLong != null) {
      return tooLong;
    }
    if (!RegExp('[A-Za-z]').hasMatch(password)) {
      return 'La contraseña debe incluir al menos una letra';
    }
    if (!RegExp(r'\d').hasMatch(password)) {
      return 'La contraseña debe incluir al menos un número';
    }
    return null;
  }

  // bcrypt usa solo los primeros 72 BYTES: un acento ocupa 2 y un emoji 4.
  static String? _tooLong(String password) {
    if (utf8.encode(password).length <= maxPasswordBytes) {
      return null;
    }
    return 'La contraseña no puede pasar de $maxPasswordBytes bytes '
        '(acentos y emojis ocupan más de uno)';
  }
}
