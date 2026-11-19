abstract final class AppRoutes {
  static const home = '/';
  static const login = '/login';
  static const register = '/register';
  static const inspections = '/inspections';
  static const inspectionForm = '/inspections/form';
  static const operatorPanel = '/operator';
  static const profile = '/profile';

  static String inspectionDetail(int id) => '/inspections/$id';
}
