import 'package:flutter/material.dart';
import '../models/innings.dart';
import '../utils/constants.dart';
import '../utils/enums.dart';

/// Full ball-by-ball timeline for an innings.
class BallTimeline extends StatelessWidget {
  final Innings innings;

  const BallTimeline({super.key, required this.innings});

  @override
  Widget build(BuildContext context) {
    // Group balls by over
    final overs = <int, List<dynamic>>{};
    for (final ball in innings.ballEvents) {
      overs.putIfAbsent(ball.overNumber, () => []);
      overs[ball.overNumber]!.add(ball);
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ball-by-Ball',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 8),
            ...overs.entries.map((entry) {
              final overNum = entry.key + 1;
              final balls = entry.value;
              final overRuns = balls.fold<int>(0, (sum, b) => sum + (b.totalRuns as int));
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 50,
                      child: Text(
                        'Ov $overNum',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: balls.map<Widget>((ball) {
                          return _TimelineBall(ball: ball);
                        }).toList(),
                      ),
                    ),
                    SizedBox(
                      width: 30,
                      child: Text(
                        '$overRuns',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
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

class _TimelineBall extends StatelessWidget {
  final dynamic ball;

  const _TimelineBall({required this.ball});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    if (ball.isWicket) {
      bgColor = AppColors.wicket;
    } else if (ball.boundaryType == BoundaryType.six) {
      bgColor = AppColors.six;
    } else if (ball.boundaryType == BoundaryType.four) {
      bgColor = AppColors.boundary;
    } else if (ball.extraType == ExtraType.wide) {
      bgColor = AppColors.wide;
    } else if (ball.extraType == ExtraType.noBall) {
      bgColor = AppColors.noBall;
    } else if (ball.totalRuns == 0) {
      bgColor = AppColors.dot;
    } else {
      bgColor = AppColors.primaryLight;
    }

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: bgColor,
        shape: BoxShape.circle,
        border: ball.isPowerBall
            ? Border.all(color: AppColors.powerBall, width: 2)
            : null,
      ),
      alignment: Alignment.center,
      child: Text(
        ball.displaySymbol,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
