abstract final class AppConfig {
  static const appName = 'SIGSE';

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );

  static const requestTimeout = Duration(seconds: 20);
}
