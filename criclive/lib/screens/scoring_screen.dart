import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scoring_provider.dart';
import '../utils/constants.dart';
import '../utils/enums.dart';
import '../widgets/score_display.dart';
import '../widgets/scoring_controls.dart';
import 'match_summary_screen.dart';

/// The main scoring screen with mandatory split-screen layout:
/// TOP HALF → Live score & match state (read-only)
/// BOTTOM HALF → Input controls (dynamic & minimal)
class ScoringScreen extends StatefulWidget {
  final String matchId;

  const ScoringScreen({super.key, required this.matchId});

  @override
  State<ScoringScreen> createState() => _ScoringScreenState();
}

class _ScoringScreenState extends State<ScoringScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ScoringProvider>().loadMatch(widget.matchId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ScoringProvider>(
      builder: (context, scoring, _) {
        final match = scoring.match;

        if (match == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Check if match is completed
        if (match.status == MatchStatus.completed) {
          return MatchSummaryScreen(matchId: match.id);
        }

        // Check if we need a new bowler
        final needsBowler =
            scoring.bowlerId == null && scoring.currentInnings != null;

        // Check if first innings is completed and 2nd hasn't started
        final needsSecondInnings = match.innings1 != null &&
            match.innings1!.status == InningsStatus.completed &&
            match.innings2 == null;

        return Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                // TOP HALF: Score display
                Expanded(
                  flex: 5,
                  child: const ScoreDisplay(),
                ),

                // BOTTOM HALF: Controls
                Expanded(
                  flex: 5,
                  child: needsSecondInnings
                      ? _SecondInningsSetup(scoring: scoring)
                      : needsBowler
                          ? _BowlerSelection(scoring: scoring)
                          : SingleChildScrollView(
                              child: const ScoringControls(),
                            ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Widget for selecting a new bowler at the start of an over.
class _BowlerSelection extends StatelessWidget {
  final ScoringProvider scoring;

  const _BowlerSelection({required this.scoring});

  @override
  Widget build(BuildContext context) {
    final match = scoring.match;
    if (match == null) return const SizedBox.shrink();

    final bowlingTeam = match.bowlingTeam;

    return Container(
      color: AppColors.inputBackground,
      padding: const EdgeInsets.all(AppSizes.padding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select bowler for this over:',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: bowlingTeam.players.length,
              itemBuilder: (context, index) {
                final player = bowlingTeam.players[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(
                      player.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    trailing: const Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    onTap: () => scoring.setBowler(player.id),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Setup widget for starting the second innings.
class _SecondInningsSetup extends StatefulWidget {
  final ScoringProvider scoring;

  const _SecondInningsSetup({required this.scoring});

  @override
  State<_SecondInningsSetup> createState() => _SecondInningsSetupState();
}

class _SecondInningsSetupState extends State<_SecondInningsSetup> {
  String? _striker;
  String? _nonStriker;
  String? _bowler;

  @override
  Widget build(BuildContext context) {
    final match = widget.scoring.match!;
    final battingTeam = match.innings1!.bowlingTeamId == match.team1.id
        ? match.team1
        : match.team2;
    final bowlingTeam = match.innings1!.battingTeamId == match.team1.id
        ? match.team1
        : match.team2;
    final target = match.innings1!.totalRuns + 1;

    return Container(
      color: AppColors.inputBackground,
      padding: const EdgeInsets.all(AppSizes.padding),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Text(
                    'First Innings Complete!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Target: $target runs',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '${battingTeam.name} batting - Select openers:',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),
            const Text('Striker:'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: battingTeam.players.map((p) {
                return ChoiceChip(
                  label: Text(p.name),
                  selected: _striker == p.id,
                  onSelected: _nonStriker == p.id
                      ? null
                      : (_) => setState(() => _striker = p.id),
                );
              }).toList(),
            ),
            const SizedBox(height: 8),
            const Text('Non-Striker:'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: battingTeam.players.map((p) {
                return ChoiceChip(
                  label: Text(p.name),
                  selected: _nonStriker == p.id,
                  onSelected: _striker == p.id
                      ? null
                      : (_) => setState(() => _nonStriker = p.id),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Text(
              '${bowlingTeam.name} bowling - Select bowler:',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: bowlingTeam.players.map((p) {
                return ChoiceChip(
                  label: Text(p.name),
                  selected: _bowler == p.id,
                  onSelected: (_) => setState(() => _bowler = p.id),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            if (_striker != null && _nonStriker != null && _bowler != null)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    widget.scoring.startSecondInnings(
                      openingStriker: _striker!,
                      openingNonStriker: _nonStriker!,
                      openingBowler: _bowler!,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Start 2nd Innings',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
