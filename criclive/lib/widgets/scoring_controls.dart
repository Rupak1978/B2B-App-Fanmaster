import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/scoring_provider.dart';
import '../utils/constants.dart';
import '../utils/enums.dart';

/// BOTTOM HALF of the split screen: Context-aware scoring input controls.
class ScoringControls extends StatelessWidget {
  const ScoringControls({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ScoringProvider>(
      builder: (context, scoring, _) {
        if (scoring.showExtrasPanel) {
          return _ExtrasPanel(scoring: scoring);
        }
        if (scoring.showWicketPanel) {
          return _WicketPanel(scoring: scoring);
        }
        return _DefaultControls(scoring: scoring);
      },
    );
  }
}

/// Default scoring controls for a legal delivery.
class _DefaultControls extends StatelessWidget {
  final ScoringProvider scoring;

  const _DefaultControls({required this.scoring});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.inputBackground,
      padding: const EdgeInsets.all(AppSizes.padding),
      child: Column(
        children: [
          // Power Ball toggle (only when allowed)
          if (scoring.canActivatePowerBall || scoring.powerBallActive) ...[
            _PowerBallToggle(scoring: scoring),
            const SizedBox(height: 12),
          ],

          // Run buttons row 1: 0, 1, 2, 3
          Row(
            children: [
              _RunButton(runs: 0, scoring: scoring),
              const SizedBox(width: 8),
              _RunButton(runs: 1, scoring: scoring),
              const SizedBox(width: 8),
              _RunButton(runs: 2, scoring: scoring),
              const SizedBox(width: 8),
              _RunButton(runs: 3, scoring: scoring),
            ],
          ),
          const SizedBox(height: 8),

          // Run buttons row 2: 4, 6, +Custom
          Row(
            children: [
              _RunButton(runs: 4, scoring: scoring, isBoundary: true),
              const SizedBox(width: 8),
              _RunButton(runs: 6, scoring: scoring, isBoundary: true),
              const SizedBox(width: 8),
              Expanded(
                child: _ScoringButton(
                  label: '+',
                  color: AppColors.textSecondary,
                  onTap: () => _showCustomRunsDialog(context, scoring),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Bottom row: Extras, Wicket, Undo
          Row(
            children: [
              Expanded(
                child: _ScoringButton(
                  label: 'Extras',
                  color: AppColors.wide,
                  icon: Icons.add_circle_outline,
                  onTap: () => scoring.toggleExtrasPanel(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ScoringButton(
                  label: 'Wicket',
                  color: AppColors.wicket,
                  icon: Icons.sports_cricket,
                  onTap: () => scoring.toggleWicketPanel(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ScoringButton(
                  label: 'Undo',
                  color: Colors.grey[600]!,
                  icon: Icons.undo,
                  onTap: () async {
                    HapticFeedback.mediumImpact();
                    await scoring.undoLastBall();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showCustomRunsDialog(BuildContext context, ScoringProvider scoring) {
    int customRuns = 5;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Custom Runs'),
          content: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed:
                    customRuns > 0 ? () => setState(() => customRuns--) : null,
                icon: const Icon(Icons.remove_circle_outline, size: 36),
              ),
              Text(
                '$customRuns',
                style:
                    const TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
              ),
              IconButton(
                onPressed: () => setState(() => customRuns++),
                icon: const Icon(Icons.add_circle_outline, size: 36),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                HapticFeedback.heavyImpact();
                scoring.recordRuns(customRuns);
              },
              child: const Text('Confirm'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Extras panel: Wide, No-ball, Bye, Leg-bye.
class _ExtrasPanel extends StatelessWidget {
  final ScoringProvider scoring;

  const _ExtrasPanel({required this.scoring});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.inputBackground,
      padding: const EdgeInsets.all(AppSizes.padding),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Extras',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                onPressed: () => scoring.closeAllPanels(),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _ScoringButton(
                  label: 'Wide',
                  subtitle: '+1 run',
                  color: AppColors.wide,
                  height: 72,
                  onTap: () {
                    HapticFeedback.heavyImpact();
                    scoring.recordWide();
                    scoring.closeAllPanels();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ScoringButton(
                  label: 'No Ball',
                  subtitle: '+1 run',
                  color: AppColors.noBall,
                  height: 72,
                  onTap: () => _showNoBallDialog(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _ScoringButton(
                  label: 'Bye',
                  color: Colors.teal,
                  height: 72,
                  onTap: () => _showByeDialog(context, false),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ScoringButton(
                  label: 'Leg Bye',
                  color: Colors.teal[700]!,
                  height: 72,
                  onTap: () => _showByeDialog(context, true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Wide with additional runs
          const Text('Wide + extra runs:',
              style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (i) {
              final extra = i + 1;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 4 ? 6 : 0),
                  child: _ScoringButton(
                    label: 'Wd+$extra',
                    color: AppColors.wide.withOpacity(0.8),
                    fontSize: 13,
                    height: 48,
                    onTap: () {
                      HapticFeedback.heavyImpact();
                      scoring.recordWide(additionalRuns: extra);
                      scoring.closeAllPanels();
                    },
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  void _showNoBallDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('No Ball - Runs off bat?'),
        content: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(7, (runs) {
            return ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                HapticFeedback.heavyImpact();
                scoring.recordNoBall(runsOffBat: runs);
                scoring.closeAllPanels();
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(56, 56),
                backgroundColor:
                    runs >= 4 ? AppColors.boundary : AppColors.primary,
              ),
              child: Text(
                '$runs',
                style: const TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold,
                    color: AppColors.white),
              ),
            );
          }),
        ),
      ),
    );
  }

  void _showByeDialog(BuildContext context, bool isLegBye) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isLegBye ? 'Leg Bye Runs' : 'Bye Runs'),
        content: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(5, (i) {
            final runs = i + 1;
            return ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                HapticFeedback.heavyImpact();
                if (isLegBye) {
                  scoring.recordLegBye(runs);
                } else {
                  scoring.recordBye(runs);
                }
                scoring.closeAllPanels();
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(56, 56),
              ),
              child: Text('$runs',
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold)),
            );
          }),
        ),
      ),
    );
  }
}

/// Wicket panel: shows only relevant dismissal types.
class _WicketPanel extends StatelessWidget {
  final ScoringProvider scoring;

  const _WicketPanel({required this.scoring});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.inputBackground,
      padding: const EdgeInsets.all(AppSizes.padding),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Wicket Type',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.wicket,
                ),
              ),
              IconButton(
                onPressed: () => scoring.closeAllPanels(),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 8),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 2,
            childAspectRatio: 2.5,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _WicketTypeButton(
                label: 'Bowled',
                onTap: () => _handleWicket(context, WicketType.bowled),
              ),
              _WicketTypeButton(
                label: 'Caught',
                onTap: () => _handleCaught(context),
              ),
              _WicketTypeButton(
                label: 'LBW',
                onTap: () => _handleWicket(context, WicketType.lbw),
              ),
              _WicketTypeButton(
                label: 'Run Out',
                onTap: () => _handleRunOut(context),
              ),
              _WicketTypeButton(
                label: 'Stumped',
                onTap: () => _handleCaught(context, isStumped: true),
              ),
              _WicketTypeButton(
                label: 'Hit Wicket',
                onTap: () => _handleWicket(context, WicketType.hitWicket),
              ),
              _WicketTypeButton(
                label: 'Retired Hurt',
                onTap: () => _handleWicket(context, WicketType.retiredHurt),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _handleWicket(BuildContext context, WicketType type) {
    final match = scoring.match;
    if (match == null) return;

    final battingTeam = match.battingTeam;
    final availableBatsmen = battingTeam.players
        .where((p) =>
            p.id != scoring.strikerId &&
            p.id != scoring.nonStrikerId &&
            !scoring.battingOrder.contains(p.id))
        .toList();

    // For retired hurt, the dismissed player doesn't have to be replaced immediately
    // but we still need a new batsman
    final dismissedId = scoring.strikerId!;

    if (availableBatsmen.isEmpty) {
      // Last wicket, no replacement needed
      _commitWicket(context, type, dismissedId, null, '');
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Select new batsman'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: availableBatsmen.map((p) {
            return ListTile(
              title: Text(p.name),
              onTap: () {
                Navigator.pop(ctx);
                _commitWicket(context, type, dismissedId, null, p.id);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _handleCaught(BuildContext context, {bool isStumped = false}) {
    final match = scoring.match;
    if (match == null) return;

    final bowlingTeam = match.bowlingTeam;
    final battingTeam = match.battingTeam;

    // First: select fielder
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isStumped ? 'Select wicket-keeper' : 'Select fielder'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: bowlingTeam.players.map((p) {
              return ListTile(
                title: Text(p.name),
                onTap: () {
                  Navigator.pop(ctx);
                  // Then: select new batsman
                  _selectNewBatsman(
                    context,
                    isStumped ? WicketType.stumped : WicketType.caught,
                    scoring.strikerId!,
                    p.name,
                    battingTeam,
                  );
                },
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  void _handleRunOut(BuildContext context) {
    final match = scoring.match;
    if (match == null) return;

    final battingTeam = match.battingTeam;

    // First: who is out (striker or non-striker)?
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Who is run out?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text('Striker'),
              onTap: () {
                Navigator.pop(ctx);
                _selectRunOutDetails(
                    context, scoring.strikerId!, battingTeam);
              },
            ),
            ListTile(
              title: Text('Non-Striker'),
              onTap: () {
                Navigator.pop(ctx);
                _selectRunOutDetails(
                    context, scoring.nonStrikerId!, battingTeam);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _selectRunOutDetails(
      BuildContext context, String dismissedId, dynamic battingTeam) {
    // Select runs completed
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Runs completed?'),
        content: Wrap(
          spacing: 8,
          children: List.generate(4, (runs) {
            return ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _selectNewBatsman(
                  context,
                  WicketType.runOut,
                  dismissedId,
                  null,
                  battingTeam,
                  runsCompleted: runs,
                );
              },
              child: Text('$runs'),
            );
          }),
        ),
      ),
    );
  }

  void _selectNewBatsman(
    BuildContext context,
    WicketType type,
    String dismissedId,
    String? fielderName,
    dynamic battingTeam, {
    int runsCompleted = 0,
  }) {
    final availableBatsmen = battingTeam.players
        .where((p) =>
            p.id != scoring.strikerId &&
            p.id != scoring.nonStrikerId &&
            !scoring.battingOrder.contains(p.id))
        .toList();

    if (availableBatsmen.isEmpty) {
      _commitWicket(context, type, dismissedId, fielderName, '',
          runsCompleted: runsCompleted);
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Select new batsman'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: availableBatsmen.map((p) {
              return ListTile(
                title: Text(p.name),
                onTap: () {
                  Navigator.pop(ctx);
                  _commitWicket(context, type, dismissedId, fielderName, p.id,
                      runsCompleted: runsCompleted);
                },
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  void _commitWicket(
    BuildContext context,
    WicketType type,
    String dismissedId,
    String? fielderName,
    String newBatsmanId, {
    int runsCompleted = 0,
  }) {
    HapticFeedback.heavyImpact();
    scoring.recordWicket(
      type: type,
      dismissedPlayerId: dismissedId,
      fielderName: fielderName,
      runsCompleted: runsCompleted,
      newBatsmanId: newBatsmanId,
    );
    scoring.closeAllPanels();
  }
}

class _WicketTypeButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _WicketTypeButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.wicket.withOpacity(0.1),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.wicket.withOpacity(0.3)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.wicket,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ),
      ),
    );
  }
}

/// Power ball toggle widget with prominent indicator.
class _PowerBallToggle extends StatelessWidget {
  final ScoringProvider scoring;

  const _PowerBallToggle({required this.scoring});

  @override
  Widget build(BuildContext context) {
    final isActive = scoring.powerBallActive;

    return GestureDetector(
      onTap: () {
        final success = scoring.togglePowerBall();
        if (success) {
          HapticFeedback.heavyImpact();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Power Ball not available')),
          );
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isActive ? AppColors.powerBall : Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? AppColors.powerBallGlow : Colors.grey[400]!,
            width: isActive ? 2 : 1,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.powerBallGlow.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: 2,
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? Icons.flash_on : Icons.flash_off,
              color: isActive ? Colors.white : Colors.grey[600],
              size: 24,
            ),
            const SizedBox(width: 8),
            Text(
              isActive ? 'POWER BALL ON' : 'Activate Power Ball',
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey[700],
                fontWeight: FontWeight.w700,
                fontSize: 16,
                letterSpacing: 1,
              ),
            ),
            if (scoring.match?.rules.maxPowerBallsPerInnings != null &&
                scoring.match!.rules.maxPowerBallsPerInnings > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${scoring.powerBallsUsed}/${scoring.match!.rules.maxPowerBallsPerInnings}',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Reusable run button.
class _RunButton extends StatelessWidget {
  final int runs;
  final ScoringProvider scoring;
  final bool isBoundary;

  const _RunButton({
    required this.runs,
    required this.scoring,
    this.isBoundary = false,
  });

  @override
  Widget build(BuildContext context) {
    Color color;
    if (runs == 0) {
      color = AppColors.dot;
    } else if (runs == 6) {
      color = AppColors.six;
    } else if (runs == 4) {
      color = AppColors.boundary;
    } else {
      color = AppColors.primary;
    }

    return Expanded(
      child: _ScoringButton(
        label: '$runs',
        color: color,
        height: AppSizes.scoringButtonSize,
        onTap: () {
          HapticFeedback.heavyImpact();
          scoring.recordRuns(runs);
        },
      ),
    );
  }
}

/// Base scoring button widget.
class _ScoringButton extends StatelessWidget {
  final String label;
  final String? subtitle;
  final Color color;
  final IconData? icon;
  final VoidCallback onTap;
  final double height;
  final double fontSize;

  const _ScoringButton({
    required this.label,
    this.subtitle,
    required this.color,
    this.icon,
    required this.onTap,
    this.height = AppSizes.scoringButtonSize,
    this.fontSize = 20,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(AppSizes.scoringButtonRadius),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSizes.scoringButtonRadius),
        child: Container(
          height: height,
          alignment: Alignment.center,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, color: AppColors.white, size: 20),
                const SizedBox(height: 2),
              ],
              Text(
                label,
                style: TextStyle(
                  color: AppColors.white,
                  fontSize: fontSize,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: TextStyle(
                    color: AppColors.white.withOpacity(0.7),
                    fontSize: 11,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
