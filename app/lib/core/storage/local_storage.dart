import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  LocalStorage(this._preferences);

  final SharedPreferences _preferences;

  static Future<LocalStorage> create() async {
    return LocalStorage(await SharedPreferences.getInstance());
  }

  String? readString(String key) {
    return _preferences.getString(key);
  }

  Future<void> writeString(String key, String value) {
    return _preferences.setString(key, value);
  }

  Object? readJson(String key) {
    final raw = _preferences.getString(key);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      return jsonDecode(raw);
    } on FormatException {
      return null;
    }
  }

  Map<String, dynamic>? readMap(String key) {
    final value = readJson(key);
    return value is Map ? Map<String, dynamic>.from(value) : null;
  }

  Future<void> writeJson(String key, Object value) {
    return _preferences.setString(key, jsonEncode(value));
  }

  Future<void> remove(String key) {
    return _preferences.remove(key);
  }

  Future<void> clear() {
    return _preferences.clear();
  }
}
