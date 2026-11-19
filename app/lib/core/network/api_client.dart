import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({http.Client? client, String? baseUrl, Duration? timeout})
    : _client = client ?? http.Client(),
      baseUrl = _normalizeBaseUrl(baseUrl ?? AppConfig.apiBaseUrl),
      timeout = timeout ?? AppConfig.requestTimeout;

  final http.Client _client;
  final String baseUrl;
  final Duration timeout;
  String? _token;

  String? get token => _token;

  void setToken(String? token) {
    final value = token?.trim();
    _token = value == null || value.isEmpty ? null : value;
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) {
    return _sendJson('GET', path, query: query);
  }

  Future<Map<String, dynamic>> post(String path, {Object? body}) {
    return _sendJson('POST', path, body: body);
  }

  Future<Map<String, dynamic>> patch(String path, {Object? body}) {
    return _sendJson('PATCH', path, body: body);
  }

  Future<Map<String, dynamic>> delete(String path) {
    return _sendJson('DELETE', path);
  }

  Future<Map<String, dynamic>> uploadFile(
    String path, {
    required List<int> bytes,
    required String filename,
    String field = 'file',
    Map<String, String>? fields,
  }) async {
    final request = http.MultipartRequest('POST', _uri(path))
      ..headers.addAll(_headers(includeContentType: false))
      ..fields.addAll(fields ?? const {})
      ..files.add(
        http.MultipartFile.fromBytes(field, bytes, filename: filename),
      );

    try {
      final streamed = await _client.send(request).timeout(timeout);
      final response = await http.Response.fromStream(streamed);
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException.timeout();
    } on http.ClientException catch (error) {
      throw ApiException.network(error.message);
    }
  }

  Future<Map<String, dynamic>> _sendJson(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
  }) async {
    final uri = _uri(path, query);
    final headers = _headers();
    late http.Response response;

    try {
      response = switch (method) {
        'GET' => await _client.get(uri, headers: headers).timeout(timeout),
        'POST' =>
          await _client
              .post(uri, headers: headers, body: _encodeBody(body))
              .timeout(timeout),
        'PATCH' =>
          await _client
              .patch(uri, headers: headers, body: _encodeBody(body))
              .timeout(timeout),
        'DELETE' =>
          await _client.delete(uri, headers: headers).timeout(timeout),
        _ => throw ArgumentError.value(method, 'method', 'Método no soportado'),
      };
    } on TimeoutException {
      throw ApiException.timeout();
    } on http.ClientException catch (error) {
      throw ApiException.network(error.message);
    }

    return _handleResponse(response);
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final rawBody = utf8.decode(response.bodyBytes);
    Object? decoded;

    if (rawBody.trim().isNotEmpty) {
      try {
        decoded = jsonDecode(rawBody);
      } on FormatException {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          throw ApiException.invalidResponse();
        }
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded == null) {
        return <String, dynamic>{};
      }
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
      return <String, dynamic>{'data': decoded};
    }

    throw ApiException.fromResponse(response.statusCode, decoded);
  }

  Map<String, String> _headers({bool includeContentType = true}) {
    return <String, String>{
      'Accept': 'application/json',
      if (includeContentType) 'Content-Type': 'application/json; charset=utf-8',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }

  String? _encodeBody(Object? body) {
    if (body == null) {
      return null;
    }
    return jsonEncode(body);
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$baseUrl$normalizedPath');
    if (query == null || query.isEmpty) {
      return uri;
    }
    return uri.replace(
      queryParameters: <String, String>{...uri.queryParameters, ...query},
    );
  }

  static String _normalizeBaseUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return AppConfig.apiBaseUrl;
    }
    return trimmed.endsWith('/')
        ? trimmed.substring(0, trimmed.length - 1)
        : trimmed;
  }

  void close() {
    _client.close();
  }
}
