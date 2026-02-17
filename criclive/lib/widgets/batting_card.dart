import 'package:flutter/material.dart';
import '../models/innings.dart';
import '../services/stats_calculator.dart';
import '../utils/constants.dart';

/// Batting scorecard showing all batsmen stats.
class BattingCard extends StatelessWidget {
  final Innings innings;
  final Map<String, String> playerNames;

  const BattingCard({
    super.key,
    required this.innings,
    required this.playerNames,
  });

  @override
  Widget build(BuildContext context) {
    final stats = StatsCalculator.calculateBattingStats(innings, playerNames);

    return Card(
      margin: EdgeInsets.zero,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(0)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: Colors.grey[100],
            child: const Row(
              children: [
                Expanded(flex: 4, child: Text('Batsman', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('R', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('B', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('4s', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('6s', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('SR', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
              ],
            ),
          ),
          ...stats.values.map((bat) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        flex: 4,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              bat.playerName,
                              style: TextStyle(
                                fontWeight: FontWeight.w500,
                                fontSize: 13,
                                color: bat.isOut ? AppColors.textSecondary : AppColors.textPrimary,
                              ),
                            ),
                            if (bat.dismissalDescription != null && bat.dismissalDescription!.isNotEmpty)
                              Text(
                                bat.dismissalDescription!,
                                style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                              ),
                            if (!bat.isOut)
                              const Text(
                                'not out',
                                style: TextStyle(fontSize: 10, color: AppColors.primaryLight),
                              ),
                          ],
                        ),
                      ),
                      Expanded(
                        flex: 1,
                        child: Text(
                          '${bat.runs}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ),
                      Expanded(
                        flex: 1,
                        child: Text(
                          '${bat.ballsFaced}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      Expanded(
                        flex: 1,
                        child: Text(
                          '${bat.fours}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      Expanded(
                        flex: 1,
                        child: Text(
                          '${bat.sixes}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      Expanded(
                        flex: 1,
                        child: Text(
                          bat.strikeRate.toStringAsFixed(0),
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
          // Extras row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                const Text('Extras: ', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
                Text(
                  _calculateExtras(),
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _calculateExtras() {
    int wides = 0, noBalls = 0, byes = 0, legByes = 0;
    for (final ball in innings.ballEvents) {
      switch (ball.extraType) {
        case _:
          if (ball.extraType.index == 1) wides += ball.extraRuns;
          if (ball.extraType.index == 2) noBalls += ball.extraRuns;
          if (ball.extraType.index == 3) byes += ball.runsOffBat;
          if (ball.extraType.index == 4) legByes += ball.runsOffBat;
      }
    }
    final total = wides + noBalls + byes + legByes;
    return '$total (w $wides, nb $noBalls, b $byes, lb $legByes)';
  }
}
