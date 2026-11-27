/// Conteos de `GET /inspections/stats/summary`. El backend ya filtra: el
/// usuario general recibe los suyos y el operador los de todos.
class InspectionStats {
  const InspectionStats({
    required this.total,
    required this.byStatus,
    required this.byPriority,
    required this.last7Days,
    required this.pendingAssignedToMe,
  });

  final int total;
  final Map<String, int> byStatus;
  final Map<String, int> byPriority;
  final int last7Days;

  /// Inspecciones `asignada` o `en_proceso` del operador autenticado.
  final int pendingAssignedToMe;

  factory InspectionStats.fromJson(Map<String, dynamic> json) {
    return InspectionStats(
      total: _toInt(json['total']),
      byStatus: _toCounts(json['byStatus']),
      byPriority: _toCounts(json['byPriority']),
      last7Days: _toInt(json['last7Days']),
      pendingAssignedToMe: _toInt(json['pendingAssignedToMe']),
    );
  }

  static int _toInt(Object? value) => (value as num?)?.toInt() ?? 0;

  static Map<String, int> _toCounts(Object? value) {
    if (value is! Map) {
      return const {};
    }
    return value.map((key, count) => MapEntry(key.toString(), _toInt(count)));
  }
}
