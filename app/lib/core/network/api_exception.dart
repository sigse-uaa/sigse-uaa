class ApiException implements Exception {
  const ApiException({
    required this.message,
    this.statusCode,
    this.code,
    this.details,
  });

  final String message;
  final int? statusCode;
  final String? code;
  final Object? details;

  bool get isUnauthorized => statusCode == 401;

  bool get isForbidden => statusCode == 403;

  bool get isNotFound => statusCode == 404;

  bool get isValidationError => statusCode == 422;

  factory ApiException.fromResponse(int statusCode, Object? body) {
    var message = _fallbackMessage(statusCode);
    String? code;
    Object? details;

    if (body is Map) {
      final map = Map<String, dynamic>.from(body);
      final nestedError = map['error'];

      if (nestedError is Map) {
        final errorMap = Map<String, dynamic>.from(nestedError);
        final nestedMessage = errorMap['message'];
        if (nestedMessage is String && nestedMessage.trim().isNotEmpty) {
          message = nestedMessage;
        }
        if (errorMap['code'] is String) {
          code = errorMap['code'] as String;
        }
        details = errorMap['details'] ?? errorMap;
      } else {
        final rawMessage = map['message'] ?? nestedError;
        if (rawMessage is String && rawMessage.trim().isNotEmpty) {
          message = rawMessage;
        }
        if (map['code'] is String) {
          code = map['code'] as String;
        }
        details = map['details'] ?? body;
      }
    } else if (body is String && body.trim().isNotEmpty) {
      message = body;
      details = body;
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
      code: code,
      details: details,
    );
  }

  factory ApiException.network([String? message]) {
    return ApiException(
      message: message ?? 'No se pudo conectar con el servidor.',
      code: 'network_error',
    );
  }

  factory ApiException.timeout() {
    return const ApiException(
      message: 'El servidor tardó demasiado en responder.',
      code: 'timeout',
    );
  }

  factory ApiException.invalidResponse() {
    return const ApiException(
      message: 'El servidor devolvió una respuesta inválida.',
      code: 'invalid_response',
    );
  }

  static String _fallbackMessage(int statusCode) {
    return switch (statusCode) {
      400 => 'La solicitud no es válida.',
      401 => 'Tu sesión expiró o las credenciales son incorrectas.',
      403 => 'No tienes permiso para realizar esta acción.',
      404 => 'El recurso solicitado no existe.',
      409 => 'Ya existe un registro con esos datos.',
      422 => 'Revisa los datos enviados.',
      >= 500 => 'Ocurrió un error en el servidor.',
      _ => 'Ocurrió un error inesperado.',
    };
  }

  @override
  String toString() {
    final status = statusCode == null ? '' : ' [$statusCode]';
    final errorCode = code == null ? '' : ' ($code)';
    return 'ApiException$status$errorCode: $message';
  }
}
