/// Claves de `shared_preferences`. Las cachés de datos llevan el id del usuario
/// para que otra cuenta en el mismo equipo no vea información ajena.
abstract final class StorageKeys {
  static const token = 'auth_token';
  static const user = 'auth_user';
  static const themeMode = 'theme_mode';

  /// Las categorías son las mismas para todos los usuarios.
  static const categoriesCache = 'categories_cache';

  static String inspectionsCache(int userId) => 'inspections_cache_$userId';
  static String lastSync(int userId) => 'last_sync_$userId';
}
