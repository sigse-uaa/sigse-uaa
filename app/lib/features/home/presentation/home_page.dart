import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../auth/state/auth_provider.dart';
import '../data/inspection_stats.dart';
import '../data/stats_repository.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  static const _statusLabels = <String, String>{
    'pendiente': 'Pendiente',
    'asignada': 'Asignada',
    'en_proceso': 'En proceso',
    'finalizada': 'Finalizada',
    'cancelada': 'Cancelada',
  };

  static const _priorityLabels = <String, String>{
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta',
  };

  late Future<InspectionStats> _stats;

  @override
  void initState() {
    super.initState();
    _stats = _load();
  }

  Future<InspectionStats> _load() async {
    // Se leen antes del await: después el widget podría ya no existir.
    final repository = context.read<StatsRepository>();
    final auth = context.read<AuthProvider>();
    try {
      return await repository.fetchSummary();
    } on ApiException catch (error) {
      // Un 401 cierra la sesión y la app regresa sola al login.
      await auth.handleApiError(error);
      rethrow;
    }
  }

  Future<void> _reload() {
    final next = _load();
    setState(() => _stats = next);
    return next.then((_) {}, onError: (_) {});
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return FutureBuilder<InspectionStats>(
      future: _stats,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const LoadingView(message: 'Cargando resumen…');
        }
        if (snapshot.hasError) {
          final error = snapshot.error;
          return ErrorView(
            message: error is ApiException
                ? error.message
                : 'Ocurrió un error inesperado.',
            onRetry: _reload,
          );
        }

        final stats = snapshot.data!;
        final isOperator = user?.isOperator ?? false;

        return RefreshIndicator(
          onRefresh: _reload,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 720),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _Header(name: user?.name ?? '', isOperator: isOperator),
                      const SizedBox(height: 16),
                      if (stats.total == 0)
                        EmptyState(
                          icon: Icons.inbox_outlined,
                          title: 'Aún no hay inspecciones',
                          message: isOperator
                              ? 'Cuando se registren inspecciones verás aquí el resumen.'
                              : 'Cuando registres una inspección verás aquí su resumen.',
                        )
                      else ...[
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            _StatCard(
                              icon: Icons.fact_check_outlined,
                              label: 'Total',
                              value: stats.total,
                            ),
                            _StatCard(
                              icon: Icons.calendar_today_outlined,
                              label: 'Últimos 7 días',
                              value: stats.last7Days,
                            ),
                            if (isOperator)
                              _StatCard(
                                icon: Icons.assignment_ind_outlined,
                                label: 'Asignadas a mí',
                                value: stats.pendingAssignedToMe,
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _CountsCard(
                          title: 'Por estado',
                          labels: _statusLabels,
                          counts: stats.byStatus,
                        ),
                        const SizedBox(height: 12),
                        _CountsCard(
                          title: 'Por prioridad',
                          labels: _priorityLabels,
                          counts: stats.byPriority,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.name, required this.isOperator});

  final String name;
  final bool isOperator;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Hola, $name', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          isOperator
              ? 'Resumen de todas las inspecciones'
              : 'Resumen de tus inspecciones',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: theme.colorScheme.primary),
              const SizedBox(height: 8),
              Text('$value', style: theme.textTheme.headlineMedium),
              Text(label, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
      ),
    );
  }
}

class _CountsCard extends StatelessWidget {
  const _CountsCard({
    required this.title,
    required this.labels,
    required this.counts,
  });

  final String title;
  final Map<String, String> labels;
  final Map<String, int> counts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text(title, style: theme.textTheme.titleMedium),
            ),
            for (final entry in labels.entries)
              ListTile(
                dense: true,
                title: Text(entry.value),
                trailing: Text(
                  '${counts[entry.key] ?? 0}',
                  style: theme.textTheme.titleMedium,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
