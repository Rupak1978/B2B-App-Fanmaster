import 'package:flutter/material.dart';
import '../models/innings.dart';
import '../services/stats_calculator.dart';
import '../utils/constants.dart';

/// Bowling scorecard showing all bowler stats.
class BowlingCard extends StatelessWidget {
  final Innings innings;
  final Map<String, String> playerNames;

  const BowlingCard({
    super.key,
    required this.innings,
    required this.playerNames,
  });

  @override
  Widget build(BuildContext context) {
    final stats = StatsCalculator.calculateBowlingStats(innings, playerNames);

    return Card(
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: Colors.grey[100],
            child: const Row(
              children: [
                Expanded(flex: 4, child: Text('Bowler', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('O', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('R', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('W', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 1, child: Text('Eco', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
              ],
            ),
          ),
          ...stats.values.map((bowl) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 4,
                    child: Text(
                      bowl.playerName,
                      style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Text(
                      bowl.oversDisplay,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Text(
                      '${bowl.runsConceded}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Text(
                      '${bowl.wickets}',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: bowl.wickets > 0 ? AppColors.wicket : AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Text(
                      bowl.economy.toStringAsFixed(1),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
