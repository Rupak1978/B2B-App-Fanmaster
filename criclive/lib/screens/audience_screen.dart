import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scoring_provider.dart';
import '../services/stats_calculator.dart';
import '../utils/constants.dart';
import '../utils/enums.dart';
import '../widgets/batting_card.dart';
import '../widgets/bowling_card.dart';
import '../widgets/ball_timeline.dart';

/// Read-only audience view for live match viewing.
/// Shows: Live scoreboard, ball-by-ball timeline, batting & bowling cards,
/// partnerships, fall of wickets, and match summary.
class AudienceScreen extends StatelessWidget {
  final String matchId;

  const AudienceScreen({super.key, required this.matchId});

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

        final playerNames = <String, String>{};
        for (final p in match.team1.players) {
          playerNames[p.id] = p.name;
        }
        for (final p in match.team2.players) {
          playerNames[p.id] = p.name;
        }

        return DefaultTabController(
          length: 4,
          child: Scaffold(
            backgroundColor: AppColors.inputBackground,
            appBar: AppBar(
              title: Text(
                '${match.team1.name} vs ${match.team2.name}',
                style: const TextStyle(fontSize: 16),
              ),
              backgroundColor: AppColors.scoreBackground,
              bottom: const TabBar(
                indicatorColor: AppColors.primaryLight,
                labelColor: AppColors.white,
                unselectedLabelColor: Colors.grey,
                tabs: [
                  Tab(text: 'Live'),
                  Tab(text: 'Scorecard'),
                  Tab(text: 'Overs'),
                  Tab(text: 'Info'),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                _LiveTab(match: match, playerNames: playerNames),
                _ScorecardTab(match: match, playerNames: playerNames),
                _OversTab(match: match),
                _InfoTab(match: match, playerNames: playerNames),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Live tab: current score, batsmen, bowler, this over.
class _LiveTab extends StatelessWidget {
  final dynamic match;
  final Map<String, String> playerNames;

  const _LiveTab({required this.match, required this.playerNames});

  @override
  Widget build(BuildContext context) {
    final innings = match.currentInnings ?? match.innings2 ?? match.innings1;
    if (innings == null) {
      return const Center(child: Text('Match has not started'));
    }

    final battingTeamName = innings.battingTeamId == match.team1.id
        ? match.team1.name
        : match.team2.name;
    final battingStats =
        StatsCalculator.calculateBattingStats(innings, playerNames);
    final bowlingStats =
        StatsCalculator.calculateBowlingStats(innings, playerNames);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Live score header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.scoreBackground,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                if (match.status == MatchStatus.inProgress)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'LIVE',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  battingTeamName,
                  style: TextStyle(
                    color: AppColors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
                Text(
                  '${innings.totalRuns}/${innings.wickets}',
                  style: const TextStyle(
                    color: AppColors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  '(${innings.oversDisplay} overs)',
                  style: TextStyle(
                    color: AppColors.white.withOpacity(0.6),
                    fontSize: 16,
                  ),
                ),
                if (innings.target != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Need ${innings.runsNeeded} runs in ${innings.ballsRemaining} balls',
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'RRR: ${innings.requiredRunRate.toStringAsFixed(2)}',
                    style: TextStyle(
                      color: AppColors.white.withOpacity(0.5),
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  'CRR: ${innings.currentRunRate.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: AppColors.white.withOpacity(0.5),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // This over
          BallTimeline(innings: innings),

          // First innings summary if we're in 2nd innings
          if (match.innings1 != null && innings == match.innings2)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        match.innings1.battingTeamId == match.team1.id
                            ? match.team1.name
                            : match.team2.name,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Text(
                        '${match.innings1.totalRuns}/${match.innings1.wickets} (${match.innings1.oversDisplay})',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          if (match.resultDescription != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Text(
                match.resultDescription!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Scorecard tab: full batting and bowling cards.
class _ScorecardTab extends StatelessWidget {
  final dynamic match;
  final Map<String, String> playerNames;

  const _ScorecardTab({required this.match, required this.playerNames});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (match.innings1 != null) ...[
            Text(
              '${match.innings1.battingTeamId == match.team1.id ? match.team1.name : match.team2.name} - 1st Innings',
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              '${match.innings1.totalRuns}/${match.innings1.wickets} (${match.innings1.oversDisplay})',
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            BattingCard(
                innings: match.innings1, playerNames: playerNames),
            const SizedBox(height: 8),
            BowlingCard(
                innings: match.innings1, playerNames: playerNames),
          ],
          if (match.innings2 != null) ...[
            const SizedBox(height: 24),
            Text(
              '${match.innings2.battingTeamId == match.team1.id ? match.team1.name : match.team2.name} - 2nd Innings',
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              '${match.innings2.totalRuns}/${match.innings2.wickets} (${match.innings2.oversDisplay})',
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            BattingCard(
                innings: match.innings2, playerNames: playerNames),
            const SizedBox(height: 8),
            BowlingCard(
                innings: match.innings2, playerNames: playerNames),
          ],
        ],
      ),
    );
  }
}

/// Overs tab: ball-by-ball for all innings.
class _OversTab extends StatelessWidget {
  final dynamic match;

  const _OversTab({required this.match});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (match.innings1 != null) ...[
            const Text('1st Innings',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            BallTimeline(innings: match.innings1),
          ],
          if (match.innings2 != null) ...[
            const SizedBox(height: 24),
            const Text('2nd Innings',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            BallTimeline(innings: match.innings2),
          ],
        ],
      ),
    );
  }
}

/// Info tab: partnerships, fall of wickets, match details.
class _InfoTab extends StatelessWidget {
  final dynamic match;
  final Map<String, String> playerNames;

  const _InfoTab({required this.match, required this.playerNames});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Match info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Match Info',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  _InfoRow(
                      label: 'Format',
                      value: '${match.rules.oversPerInnings} overs'),
                  _InfoRow(
                      label: 'Players',
                      value: '${match.rules.playersPerTeam} per team'),
                  if (match.rules.powerBallEnabled)
                    _InfoRow(label: 'Power Ball', value: 'Enabled'),
                  if (match.tossWinnerId != null)
                    _InfoRow(
                      label: 'Toss',
                      value:
                          '${match.tossWinnerId == match.team1.id ? match.team1.name : match.team2.name} elected to ${match.tossDecision == TossDecision.bat ? "bat" : "bowl"}',
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Partnerships
          if (match.innings1 != null) ...[
            _PartnershipsSection(
              title: '1st Innings Partnerships',
              innings: match.innings1,
              playerNames: playerNames,
            ),
          ],
          if (match.innings2 != null) ...[
            const SizedBox(height: 16),
            _PartnershipsSection(
              title: '2nd Innings Partnerships',
              innings: match.innings2,
              playerNames: playerNames,
            ),
          ],

          // Fall of wickets
          if (match.innings1 != null) ...[
            const SizedBox(height: 16),
            _FowSection(
              title: '1st Innings Fall of Wickets',
              innings: match.innings1,
              playerNames: playerNames,
            ),
          ],
          if (match.innings2 != null) ...[
            const SizedBox(height: 16),
            _FowSection(
              title: '2nd Innings Fall of Wickets',
              innings: match.innings2,
              playerNames: playerNames,
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _PartnershipsSection extends StatelessWidget {
  final String title;
  final dynamic innings;
  final Map<String, String> playerNames;

  const _PartnershipsSection({
    required this.title,
    required this.innings,
    required this.playerNames,
  });

  @override
  Widget build(BuildContext context) {
    final partnerships =
        StatsCalculator.calculatePartnerships(innings, playerNames);
    if (partnerships.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            ...partnerships.asMap().entries.map((entry) {
              final idx = entry.key + 1;
              final p = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    SizedBox(
                      width: 24,
                      child: Text('$idx.',
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12)),
                    ),
                    Expanded(
                      child: Text(
                        '${p.batsman1Name} & ${p.batsman2Name}',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                    Text(
                      '${p.totalRuns} (${p.totalBalls}b)',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _FowSection extends StatelessWidget {
  final String title;
  final dynamic innings;
  final Map<String, String> playerNames;

  const _FowSection({
    required this.title,
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
            Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 16,
              runSpacing: 4,
              children: fow.map((f) {
                return Text(
                  '${f.wicketNumber}-${f.runs} (${f.dismissedPlayerName}, ${f.oversDisplay})',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
