import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/match_rules.dart';
import '../models/team.dart';
import '../providers/match_provider.dart';
import '../providers/tournament_provider.dart';
import '../services/rules_parser.dart';
import '../utils/constants.dart';
import '../utils/enums.dart';

/// Tournament management screen:
/// Create tournament, view standings, points table, NRR, top performers.
class TournamentScreen extends StatefulWidget {
  const TournamentScreen({super.key});

  @override
  State<TournamentScreen> createState() => _TournamentScreenState();
}

class _TournamentScreenState extends State<TournamentScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TournamentProvider>().loadTournaments();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tournaments'),
        backgroundColor: AppColors.accent,
      ),
      body: Consumer<TournamentProvider>(
        builder: (context, provider, _) {
          if (provider.tournaments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.emoji_events,
                      size: 64, color: AppColors.accent),
                  const SizedBox(height: 16),
                  const Text(
                    'No tournaments yet',
                    style: TextStyle(
                        fontSize: 18, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => _showCreateTournament(context),
                    icon: const Icon(Icons.add),
                    label: const Text('Create Tournament'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: AppColors.white,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.tournaments.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: ElevatedButton.icon(
                    onPressed: () => _showCreateTournament(context),
                    icon: const Icon(Icons.add),
                    label: const Text('New Tournament'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: AppColors.white,
                      minimumSize: const Size(double.infinity, 48),
                    ),
                  ),
                );
              }

              final tournament = provider.tournaments[index - 1];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: () => _showTournamentDetail(context, tournament.id),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.emoji_events,
                                color: AppColors.accent),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                tournament.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(tournament.status)
                                    .withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _statusLabel(tournament.status),
                                style: TextStyle(
                                  color: _statusColor(tournament.status),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${tournament.teams.length} teams | ${tournament.defaultRules.oversPerInnings} overs | ${tournament.matchIds.length} matches',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Color _statusColor(TournamentStatus status) {
    switch (status) {
      case TournamentStatus.upcoming:
        return AppColors.accent;
      case TournamentStatus.inProgress:
        return AppColors.primaryLight;
      case TournamentStatus.completed:
        return AppColors.textSecondary;
    }
  }

  String _statusLabel(TournamentStatus status) {
    switch (status) {
      case TournamentStatus.upcoming:
        return 'Upcoming';
      case TournamentStatus.inProgress:
        return 'In Progress';
      case TournamentStatus.completed:
        return 'Completed';
    }
  }

  void _showCreateTournament(BuildContext context) {
    final nameController = TextEditingController();
    final formatController = TextEditingController();
    final teamCountController = TextEditingController(text: '4');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Create Tournament',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameController,
              decoration: InputDecoration(
                labelText: 'Tournament Name',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: formatController,
              decoration: InputDecoration(
                labelText: 'Match Format (e.g. "8 overs, 6 players")',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: teamCountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Number of Teams',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final rules = formatController.text.trim().isEmpty
                      ? const MatchRules(oversPerInnings: 10)
                      : RulesParser.parse(formatController.text);

                  await context.read<TournamentProvider>().createTournament(
                        name: nameController.text.trim(),
                        defaultRules: rules,
                        teams: [],
                      );
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Create',
                    style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showTournamentDetail(BuildContext context, String tournamentId) {
    final provider = context.read<TournamentProvider>();
    provider.calculateStandings(tournamentId);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _TournamentDetailScreen(tournamentId: tournamentId),
      ),
    );
  }
}

class _TournamentDetailScreen extends StatelessWidget {
  final String tournamentId;

  const _TournamentDetailScreen({required this.tournamentId});

  @override
  Widget build(BuildContext context) {
    return Consumer<TournamentProvider>(
      builder: (context, provider, _) {
        final tournament =
            provider.tournaments.firstWhere((t) => t.id == tournamentId);
        final standings = provider.standings;

        return DefaultTabController(
          length: 2,
          child: Scaffold(
            appBar: AppBar(
              title: Text(tournament.name),
              backgroundColor: AppColors.accent,
              bottom: const TabBar(
                indicatorColor: AppColors.white,
                tabs: [
                  Tab(text: 'Points Table'),
                  Tab(text: 'Matches'),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                // Points table
                standings.isEmpty
                    ? const Center(child: Text('No matches played yet'))
                    : SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: _PointsTable(standings: standings),
                      ),
                // Matches list
                const Center(child: Text('Matches will appear here')),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PointsTable extends StatelessWidget {
  final List<dynamic> standings;

  const _PointsTable({required this.standings});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            color: AppColors.scoreBackground,
            child: const Row(
              children: [
                SizedBox(width: 24, child: Text('#', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 3, child: Text('Team', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(child: Text('P', textAlign: TextAlign.center, style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(child: Text('W', textAlign: TextAlign.center, style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(child: Text('L', textAlign: TextAlign.center, style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(child: Text('Pts', textAlign: TextAlign.center, style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 2, child: Text('NRR', textAlign: TextAlign.center, style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12))),
              ],
            ),
          ),
          ...standings.asMap().entries.map((entry) {
            final idx = entry.key + 1;
            final s = entry.value;
            return Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                    bottom: BorderSide(color: Colors.grey[200]!)),
                color: idx <= 2
                    ? AppColors.primaryLight.withOpacity(0.05)
                    : null,
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 24,
                    child: Text('$idx',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(s.team.name,
                        style: const TextStyle(
                            fontWeight: FontWeight.w500, fontSize: 13)),
                  ),
                  Expanded(
                      child: Text('${s.played}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13))),
                  Expanded(
                      child: Text('${s.won}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13))),
                  Expanded(
                      child: Text('${s.lost}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13))),
                  Expanded(
                    child: Text(
                      '${s.points}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      s.nrr >= 0
                          ? '+${s.nrr.toStringAsFixed(3)}'
                          : s.nrr.toStringAsFixed(3),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: s.nrr >= 0 ? AppColors.primaryLight : AppColors.wicket,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
