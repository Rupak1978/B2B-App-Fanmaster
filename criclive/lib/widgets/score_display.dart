import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/innings.dart';
import '../providers/scoring_provider.dart';
import '../services/stats_calculator.dart';
import '../utils/constants.dart';

/// TOP HALF of the split screen: Live score display (read-only).
class ScoreDisplay extends StatelessWidget {
  const ScoreDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ScoringProvider>(
      builder: (context, scoring, _) {
        final match = scoring.match;
        final innings = scoring.currentInnings;
        if (match == null || innings == null) {
          return const Center(child: Text('No active innings'));
        }

        final playerNames = <String, String>{};
        for (final p in match.team1.players) {
          playerNames[p.id] = p.name;
        }
        for (final p in match.team2.players) {
          playerNames[p.id] = p.name;
        }

        final battingTeam = match.battingTeam;
        final bowlingTeam = match.bowlingTeam;
        final battingStats = StatsCalculator.calculateBattingStats(
            innings, playerNames);
        final bowlingStats = StatsCalculator.calculateBowlingStats(
            innings, playerNames);

        return Container(
          color: AppColors.scoreBackground,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Power Ball indicator
              if (scoring.powerBallActive)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.powerBall,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.powerBallGlow.withOpacity(0.5),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'POWER BALL ACTIVE',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 4),

              // Team score & overs
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    battingTeam.shortName ?? battingTeam.name,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${innings.totalRuns}/${innings.wickets}',
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: AppSizes.scoreFontSize,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '(${innings.oversDisplay})',
                    style: TextStyle(
                      color: AppColors.white.withOpacity(0.7),
                      fontSize: AppSizes.oversFontSize,
                    ),
                  ),
                ],
              ),

              // Run rates & target
              Row(
                children: [
                  _StatBadge(
                    label: 'CRR',
                    value: innings.currentRunRate.toStringAsFixed(1),
                  ),
                  if (innings.target != null) ...[
                    const SizedBox(width: 12),
                    _StatBadge(
                      label: 'RRR',
                      value: innings.requiredRunRate.toStringAsFixed(1),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Need ${innings.runsNeeded} in ${innings.ballsRemaining} balls',
                      style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 8),

              // Batsmen info
              if (scoring.strikerId != null) ...[
                _BatsmanRow(
                  name: playerNames[scoring.strikerId] ?? '?',
                  stats: battingStats[scoring.strikerId],
                  isOnStrike: true,
                ),
              ],
              if (scoring.nonStrikerId != null)
                _BatsmanRow(
                  name: playerNames[scoring.nonStrikerId] ?? '?',
                  stats: battingStats[scoring.nonStrikerId],
                  isOnStrike: false,
                ),

              const SizedBox(height: 4),

              // Bowler info
              if (scoring.bowlerId != null &&
                  bowlingStats.containsKey(scoring.bowlerId))
                _BowlerRow(
                  name: playerNames[scoring.bowlerId] ?? '?',
                  stats: bowlingStats[scoring.bowlerId]!,
                ),

              const SizedBox(height: 6),

              // This over ball-by-ball
              _ThisOverTimeline(balls: innings.currentOverBalls),
            ],
          ),
        );
      },
    );
  }
}

class _StatBadge extends StatelessWidget {
  final String label;
  final String value;

  const _StatBadge({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label ',
            style: TextStyle(
              color: AppColors.white.withOpacity(0.5),
              fontSize: 11,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _BatsmanRow extends StatelessWidget {
  final String name;
  final BattingStats? stats;
  final bool isOnStrike;

  const _BatsmanRow({
    required this.name,
    this.stats,
    required this.isOnStrike,
  });

  @override
  Widget build(BuildContext context) {
    final runs = stats?.runs ?? 0;
    final balls = stats?.ballsFaced ?? 0;
    final fours = stats?.fours ?? 0;
    final sixes = stats?.sixes ?? 0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          if (isOnStrike)
            const Icon(Icons.sports_cricket, color: AppColors.primaryLight,
                size: 14),
          if (!isOnStrike) const SizedBox(width: 14),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              name,
              style: TextStyle(
                color: isOnStrike ? AppColors.white : AppColors.white.withOpacity(0.6),
                fontSize: 14,
                fontWeight: isOnStrike ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
          Text(
            '$runs($balls)',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '4s:$fours  6s:$sixes',
            style: TextStyle(
              color: AppColors.white.withOpacity(0.5),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _BowlerRow extends StatelessWidget {
  final String name;
  final BowlingStats stats;

  const _BowlerRow({required this.name, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        children: [
          const Icon(Icons.sports_baseball, color: AppColors.accent, size: 14),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              name,
              style: const TextStyle(color: AppColors.white, fontSize: 13),
            ),
          ),
          Text(
            '${stats.oversDisplay}-${stats.runsConceded}-${stats.wickets}',
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ThisOverTimeline extends StatelessWidget {
  final List<dynamic> balls;

  const _ThisOverTimeline({required this.balls});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Text(
            'This over: ',
            style: TextStyle(
              color: AppColors.white.withOpacity(0.4),
              fontSize: 12,
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: balls.map((ball) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: _BallSymbol(ball: ball),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BallSymbol extends StatelessWidget {
  final dynamic ball;

  const _BallSymbol({required this.ball});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor = AppColors.white;
    final symbol = ball.displaySymbol;

    if (ball.isWicket) {
      bgColor = AppColors.wicket;
    } else if (ball.boundaryType.index == 2) {
      // six
      bgColor = AppColors.six;
    } else if (ball.boundaryType.index == 1) {
      // four
      bgColor = AppColors.boundary;
    } else if (ball.extraType.index == 1) {
      // wide
      bgColor = AppColors.wide;
    } else if (ball.extraType.index == 2) {
      // no-ball
      bgColor = AppColors.noBall;
    } else if (ball.totalRuns == 0) {
      bgColor = AppColors.dot;
    } else {
      bgColor = AppColors.primaryLight;
    }

    return Container(
      width: AppSizes.ballSymbolSize,
      height: AppSizes.ballSymbolSize,
      decoration: BoxDecoration(
        color: bgColor,
        shape: BoxShape.circle,
        border: ball.isPowerBall
            ? Border.all(color: AppColors.powerBall, width: 2)
            : null,
      ),
      alignment: Alignment.center,
      child: Text(
        symbol,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
