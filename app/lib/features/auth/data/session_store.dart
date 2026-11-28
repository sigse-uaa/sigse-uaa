import '../../../core/models/user.dart';
import '../../../core/storage/local_storage.dart';
import '../../../core/storage/storage_keys.dart';

/// Guarda la sesión (token y usuario) para que sobreviva al reinicio de la app.
class SessionStore {
  SessionStore(this._storage);

  final LocalStorage _storage;

  Future<void> save(String token, User user) async {
    await _storage.writeString(StorageKeys.token, token);
    await _storage.writeJson(StorageKeys.user, user.toJson());
  }

  String? readToken() {
    final token = _storage.readString(StorageKeys.token)?.trim();
    return token == null || token.isEmpty ? null : token;
  }

  /// Devuelve `null` si no hay usuario guardado o el JSON no es válido.
  User? readUser() {
    final json = _storage.readMap(StorageKeys.user);
    if (json == null) {
      return null;
    }
    final user = User.fromJson(json);
    return user.id > 0 ? user : null;
  }

  /// Borra la sesión y la caché del usuario. No usa `LocalStorage.clear()`
  /// porque también borraría el tema y las categorías, que no son del usuario.
  Future<void> clear({int? userId}) async {
    await _storage.remove(StorageKeys.token);
    await _storage.remove(StorageKeys.user);
    if (userId != null) {
      await _storage.remove(StorageKeys.inspectionsCache(userId));
      await _storage.remove(StorageKeys.lastSync(userId));
    }
  }
}
