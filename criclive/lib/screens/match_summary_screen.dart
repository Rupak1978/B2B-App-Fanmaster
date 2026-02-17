import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scoring_provider.dart';
import '../services/stats_calculator.dart';
import '../utils/constants.dart';
import '../widgets/batting_card.dart';
import '../widgets/bowling_card.dart';
import '../widgets/ball_timeline.dart';

/// Post-match summary and full scorecard.
class MatchSummaryScreen extends StatelessWidget {
  final String matchId;

  const MatchSummaryScreen({super.key, required this.matchId});

  @override
  Widget build(BuildContext context) {
    return Consumer<ScoringProvider>(
      builder: (context, scoring, _) {
        final match = scoring.match;
        if (match == null) {
          return const Scaffold(
            body: Center(child: Text('Match not found')),
          );
        }

        final playerNames = <String, String>{};
        for (final p in match.team1.players) {
          playerNames[p.id] = p.name;
        }
        for (final p in match.team2.players) {
          playerNames[p.id] = p.name;
        }

        return Scaffold(
          backgroundColor: AppColors.inputBackground,
          appBar: AppBar(
            title: const Text('Match Summary'),
            backgroundColor: AppColors.primary,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Result banner
                if (match.resultDescription != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      match.resultDescription!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                const SizedBox(height: 16),

                // First innings scorecard
                if (match.innings1 != null) ...[
                  _InningsHeader(
                    teamName: match.innings1!.battingTeamId == match.team1.id
                        ? match.team1.name
                        : match.team2.name,
                    runs: match.innings1!.totalRuns,
                    wickets: match.innings1!.wickets,
                    overs: match.innings1!.oversDisplay,
                  ),
                  BattingCard(
                    innings: match.innings1!,
                    playerNames: playerNames,
                  ),
                  const SizedBox(height: 8),
                  BowlingCard(
                    innings: match.innings1!,
                    playerNames: playerNames,
                  ),
                  const SizedBox(height: 8),
                  BallTimeline(innings: match.innings1!),
                  const SizedBox(height: 4),
                  _FallOfWicketsSection(
                    innings: match.innings1!,
                    playerNames: playerNames,
                  ),
                ],

                const SizedBox(height: 24),

                // Second innings scorecard
                if (match.innings2 != null) ...[
                  _InningsHeader(
                    teamName: match.innings2!.battingTeamId == match.team1.id
                        ? match.team1.name
                        : match.team2.name,
                    runs: match.innings2!.totalRuns,
                    wickets: match.innings2!.wickets,
                    overs: match.innings2!.oversDisplay,
                  ),
                  BattingCard(
                    innings: match.innings2!,
                    playerNames: playerNames,
                  ),
                  const SizedBox(height: 8),
                  BowlingCard(
                    innings: match.innings2!,
                    playerNames: playerNames,
                  ),
                  const SizedBox(height: 8),
                  BallTimeline(innings: match.innings2!),
                  const SizedBox(height: 4),
                  _FallOfWicketsSection(
                    innings: match.innings2!,
                    playerNames: playerNames,
                  ),
                ],

                const SizedBox(height: 24),

                // Share button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Share functionality
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Share link copied!')),
                      );
                    },
                    icon: const Icon(Icons.share),
                    label: const Text('Share Scorecard'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
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

class _InningsHeader extends StatelessWidget {
  final String teamName;
  final int runs;
  final int wickets;
  final String overs;

  const _InningsHeader({
    required this.teamName,
    required this.runs,
    required this.wickets,
    required this.overs,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.scoreBackground,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            teamName,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            '$runs/$wickets ($overs ov)',
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _FallOfWicketsSection extends StatelessWidget {
  final dynamic innings;
  final Map<String, String> playerNames;

  const _FallOfWicketsSection({
    required this.innings,
    required this.playerNames,
  });

  @override
  Widget build(BuildContext context) {
    final fow = StatsCalculator.calculateFallOfWickets(innings, playerNames);
    if (fow.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Fall of Wickets',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              children: fow.map((f) {
                return Text(
                  '${f.wicketNumber}-${f.runs} (${f.dismissedPlayerName}, ${f.oversDisplay})',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
