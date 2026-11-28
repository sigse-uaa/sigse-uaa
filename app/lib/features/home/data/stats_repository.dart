import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import 'inspection_stats.dart';

class StatsRepository {
  StatsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<InspectionStats> fetchSummary() async {
    final json = await _apiClient.get('/inspections/stats/summary');
    final data = json['data'];
    if (data is! Map) {
      throw ApiException.invalidResponse();
    }
    return InspectionStats.fromJson(Map<String, dynamic>.from(data));
  }
}
