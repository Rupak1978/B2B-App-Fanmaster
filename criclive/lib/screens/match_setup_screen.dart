import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/match_rules.dart';
import '../models/team.dart';
import '../providers/match_provider.dart';
import '../providers/scoring_provider.dart';
import '../services/rules_parser.dart';
import '../utils/constants.dart';
import '../utils/enums.dart';
import 'scoring_screen.dart';

/// Match setup flow: ONE STEP AT A TIME.
/// Step 1: Enter match format (voice/text) → parsed rules
/// Step 2: Create/select teams and players
/// Step 3: Toss
/// Step 4: Select opening batsmen and bowler
/// Step 5: Start scoring
class MatchSetupScreen extends StatefulWidget {
  const MatchSetupScreen({super.key});

  @override
  State<MatchSetupScreen> createState() => _MatchSetupScreenState();
}

class _MatchSetupScreenState extends State<MatchSetupScreen> {
  int _step = 0;
  MatchRules _rules = const MatchRules(oversPerInnings: 10);
  final _formatController = TextEditingController();

  // Teams
  final _team1NameController = TextEditingController();
  final _team2NameController = TextEditingController();
  List<TextEditingController> _team1PlayerControllers = [];
  List<TextEditingController> _team2PlayerControllers = [];

  Team? _team1;
  Team? _team2;

  // Toss
  String? _tossWinnerId;
  TossDecision? _tossDecision;

  // Opening players
  String? _openingStriker;
  String? _openingNonStriker;
  String? _openingBowler;

  @override
  void initState() {
    super.initState();
    _initPlayerControllers();
  }

  void _initPlayerControllers() {
    _team1PlayerControllers = List.generate(
      _rules.playersPerTeam,
      (i) => TextEditingController(text: 'Player ${i + 1}'),
    );
    _team2PlayerControllers = List.generate(
      _rules.playersPerTeam,
      (i) => TextEditingController(text: 'Player ${i + 1}'),
    );
  }

  @override
  void dispose() {
    _formatController.dispose();
    _team1NameController.dispose();
    _team2NameController.dispose();
    for (final c in _team1PlayerControllers) {
      c.dispose();
    }
    for (final c in _team2PlayerControllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.inputBackground,
      appBar: AppBar(
        title: Text(_stepTitle),
        backgroundColor: AppColors.primary,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            _StepProgress(currentStep: _step, totalSteps: 5),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSizes.padding),
                child: _buildCurrentStep(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String get _stepTitle {
    switch (_step) {
      case 0:
        return 'Match Format';
      case 1:
        return 'Review Rules';
      case 2:
        return 'Teams & Players';
      case 3:
        return 'Toss';
      case 4:
        return 'Opening Players';
      default:
        return 'Setup';
    }
  }

  Widget _buildCurrentStep() {
    switch (_step) {
      case 0:
        return _buildFormatInput();
      case 1:
        return _buildRulesReview();
      case 2:
        return _buildTeamSetup();
      case 3:
        return _buildToss();
      case 4:
        return _buildOpeningPlayers();
      default:
        return const SizedBox.shrink();
    }
  }

  // ---- Step 0: Format Input (Voice/Text) ----
  Widget _buildFormatInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Describe your match format:',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Type or speak the format. Example:\n"8 overs match, 6 players, power ball allowed in last over"',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _formatController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'e.g. "10 overs, 8 players per team, power ball in last over"',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.white,
            suffixIcon: IconButton(
              icon: const Icon(Icons.mic, color: AppColors.primary),
              onPressed: _startVoiceInput,
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Quick presets
        const Text(
          'Quick Presets:',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _PresetChip(
              label: '8 overs, 6-a-side',
              onTap: () => _formatController.text =
                  '8 overs, 6 players, power ball in last over',
            ),
            _PresetChip(
              label: '10 overs, 8-a-side',
              onTap: () => _formatController.text =
                  '10 overs, 8 players per team, power ball in last over',
            ),
            _PresetChip(
              label: '20 overs, 11-a-side',
              onTap: () => _formatController.text = '20 overs, 11 players',
            ),
            _PresetChip(
              label: '5 overs blast',
              onTap: () => _formatController.text =
                  '5 overs, 6 players, power ball from over 3',
            ),
          ],
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _parseAndNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('Parse Format', style: TextStyle(fontSize: 18)),
          ),
        ),
      ],
    );
  }

  void _startVoiceInput() {
    // Speech-to-text would be initialized here using speech_to_text package
    // For now, show a snackbar indicating the feature
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Voice input: Tap and speak your match format'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _parseAndNext() {
    final input = _formatController.text.trim();
    if (input.isEmpty) {
      _rules = const MatchRules(oversPerInnings: 10);
    } else {
      _rules = RulesParser.parse(input);
    }
    // Re-init player controllers if player count changed
    _initPlayerControllers();
    setState(() => _step = 1);
  }

  // ---- Step 1: Rules Review ----
  Widget _buildRulesReview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Detected Rules:',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        _RuleToggle(
          label: 'Overs per innings',
          value: '${_rules.oversPerInnings}',
          onEdit: () => _editOvers(),
        ),
        _RuleToggle(
          label: 'Players per team',
          value: '${_rules.playersPerTeam}',
          onEdit: () => _editPlayers(),
        ),
        _RuleToggle(
          label: 'Wide = extra ball',
          value: _rules.wideExtraBall ? 'Yes' : 'No',
          isFixed: true,
        ),
        _RuleToggle(
          label: 'No-ball = extra ball',
          value: _rules.noBallExtraBall ? 'Yes' : 'No',
          isFixed: true,
        ),
        _RuleToggle(
          label: 'Power Ball',
          value: _rules.powerBallEnabled ? 'Enabled' : 'Disabled',
          onEdit: () {
            setState(() {
              _rules = _rules.copyWith(
                  powerBallEnabled: !_rules.powerBallEnabled);
            });
          },
        ),
        if (_rules.powerBallEnabled) ...[
          _RuleToggle(
            label: 'Power Ball available',
            value: _rules.powerBallStartOver == -1
                ? 'Last over only'
                : 'From over ${_rules.effectivePowerBallStartOver + 1}',
            onEdit: () {},
          ),
          _RuleToggle(
            label: 'Power Ball doubles all runs',
            value: _rules.powerBallDoublesAll ? 'Yes' : 'No',
            onEdit: () {
              setState(() {
                _rules = _rules.copyWith(
                    powerBallDoublesAll: !_rules.powerBallDoublesAll);
              });
            },
          ),
          _RuleToggle(
            label: 'Wicket on Power Ball',
            value: '-${_rules.powerBallWicketDeduction} runs',
            isFixed: true,
          ),
        ],
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              _initPlayerControllers();
              setState(() => _step = 2);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('Confirm Rules', style: TextStyle(fontSize: 18)),
          ),
        ),
      ],
    );
  }

  void _editOvers() {
    _showNumberPicker('Overs per innings', _rules.oversPerInnings, 1, 50,
        (val) {
      setState(() => _rules = _rules.copyWith(oversPerInnings: val));
    });
  }

  void _editPlayers() {
    _showNumberPicker('Players per team', _rules.playersPerTeam, 2, 15,
        (val) {
      setState(() {
        _rules = _rules.copyWith(playersPerTeam: val);
        _initPlayerControllers();
      });
    });
  }

  void _showNumberPicker(
      String title, int current, int min, int max, Function(int) onChanged) {
    int value = current;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(title),
          content: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed: value > min
                    ? () => setDialogState(() => value--)
                    : null,
                icon: const Icon(Icons.remove_circle_outline, size: 36),
              ),
              Text(
                '$value',
                style:
                    const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
              IconButton(
                onPressed: value < max
                    ? () => setDialogState(() => value++)
                    : null,
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
                onChanged(value);
                Navigator.pop(ctx);
              },
              child: const Text('Set'),
            ),
          ],
        ),
      ),
    );
  }

  // ---- Step 2: Team Setup ----
  Widget _buildTeamSetup() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTeamForm('Team 1', _team1NameController, _team1PlayerControllers),
        const SizedBox(height: 24),
        const Divider(),
        const SizedBox(height: 16),
        _buildTeamForm('Team 2', _team2NameController, _team2PlayerControllers),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _createTeamsAndNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('Next: Toss', style: TextStyle(fontSize: 18)),
          ),
        ),
      ],
    );
  }

  Widget _buildTeamForm(
    String label,
    TextEditingController nameController,
    List<TextEditingController> playerControllers,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: nameController,
          decoration: InputDecoration(
            hintText: 'Team name',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        const Text('Players:', style: TextStyle(fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        ...List.generate(playerControllers.length, (i) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: TextField(
              controller: playerControllers[i],
              decoration: InputDecoration(
                hintText: 'Player ${i + 1}',
                prefixText: '${i + 1}. ',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 10),
                isDense: true,
              ),
            ),
          );
        }),
      ],
    );
  }

  Future<void> _createTeamsAndNext() async {
    final provider = context.read<MatchProvider>();

    final team1Name = _team1NameController.text.trim();
    final team2Name = _team2NameController.text.trim();
    if (team1Name.isEmpty || team2Name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter team names')),
      );
      return;
    }

    final team1Players =
        _team1PlayerControllers.map((c) => c.text.trim()).toList();
    final team2Players =
        _team2PlayerControllers.map((c) => c.text.trim()).toList();

    _team1 = await provider.createTeam(
      name: team1Name,
      playerNames: team1Players,
    );
    _team2 = await provider.createTeam(
      name: team2Name,
      playerNames: team2Players,
    );

    setState(() => _step = 3);
  }

  // ---- Step 3: Toss ----
  Widget _buildToss() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Who won the toss?',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _TossButton(
                label: _team1?.name ?? 'Team 1',
                isSelected: _tossWinnerId == _team1?.id,
                onTap: () => setState(() => _tossWinnerId = _team1?.id),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _TossButton(
                label: _team2?.name ?? 'Team 2',
                isSelected: _tossWinnerId == _team2?.id,
                onTap: () => setState(() => _tossWinnerId = _team2?.id),
              ),
            ),
          ],
        ),
        if (_tossWinnerId != null) ...[
          const SizedBox(height: 24),
          const Text(
            'Elected to:',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _TossButton(
                  label: 'Bat',
                  icon: Icons.sports_cricket,
                  isSelected: _tossDecision == TossDecision.bat,
                  onTap: () =>
                      setState(() => _tossDecision = TossDecision.bat),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _TossButton(
                  label: 'Bowl',
                  icon: Icons.sports_baseball,
                  isSelected: _tossDecision == TossDecision.bowl,
                  onTap: () =>
                      setState(() => _tossDecision = TossDecision.bowl),
                ),
              ),
            ],
          ),
        ],
        if (_tossDecision != null) ...[
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => setState(() => _step = 4),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Next: Opening Players',
                  style: TextStyle(fontSize: 18)),
            ),
          ),
        ],
      ],
    );
  }

  // ---- Step 4: Opening Players ----
  Widget _buildOpeningPlayers() {
    // Determine batting and bowling teams based on toss
    Team battingTeam;
    Team bowlingTeam;
    if (_tossWinnerId == _team1!.id) {
      battingTeam = _tossDecision == TossDecision.bat ? _team1! : _team2!;
      bowlingTeam = _tossDecision == TossDecision.bat ? _team2! : _team1!;
    } else {
      battingTeam = _tossDecision == TossDecision.bat ? _team2! : _team1!;
      bowlingTeam = _tossDecision == TossDecision.bat ? _team1! : _team2!;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${battingTeam.name} is batting',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Select Striker:',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: battingTeam.players.map((p) {
            final isSelected = _openingStriker == p.id;
            final isDisabled = _openingNonStriker == p.id;
            return ChoiceChip(
              label: Text(p.name),
              selected: isSelected,
              onSelected: isDisabled
                  ? null
                  : (_) => setState(() => _openingStriker = p.id),
              selectedColor: AppColors.primaryLight.withOpacity(0.3),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        const Text(
          'Select Non-Striker:',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: battingTeam.players.map((p) {
            final isSelected = _openingNonStriker == p.id;
            final isDisabled = _openingStriker == p.id;
            return ChoiceChip(
              label: Text(p.name),
              selected: isSelected,
              onSelected: isDisabled
                  ? null
                  : (_) => setState(() => _openingNonStriker = p.id),
              selectedColor: AppColors.primaryLight.withOpacity(0.3),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Text(
          '${bowlingTeam.name} is bowling',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.accent,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Select Opening Bowler:',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: bowlingTeam.players.map((p) {
            return ChoiceChip(
              label: Text(p.name),
              selected: _openingBowler == p.id,
              onSelected: (_) => setState(() => _openingBowler = p.id),
              selectedColor: AppColors.accent.withOpacity(0.3),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        if (_openingStriker != null &&
            _openingNonStriker != null &&
            _openingBowler != null)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _startMatch,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Start Match!',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
          ),
      ],
    );
  }

  Future<void> _startMatch() async {
    final provider = context.read<MatchProvider>();

    // Determine batting/bowling teams
    Team battingTeam;
    Team bowlingTeam;
    if (_tossWinnerId == _team1!.id) {
      battingTeam = _tossDecision == TossDecision.bat ? _team1! : _team2!;
      bowlingTeam = _tossDecision == TossDecision.bat ? _team2! : _team1!;
    } else {
      battingTeam = _tossDecision == TossDecision.bat ? _team2! : _team1!;
      bowlingTeam = _tossDecision == TossDecision.bat ? _team1! : _team2!;
    }

    // Create the match
    final match = await provider.createMatch(
      team1: _team1!,
      team2: _team2!,
      rules: _rules,
    );

    // Record toss
    await provider.recordToss(
      matchId: match.id,
      tossWinnerId: _tossWinnerId!,
      decision: _tossDecision!,
    );

    // Start first innings via scoring provider
    final scoring = context.read<ScoringProvider>();
    await scoring.loadMatch(match.id);
    await scoring.startFirstInnings(
      battingTeamId: battingTeam.id,
      bowlingTeamId: bowlingTeam.id,
      openingStriker: _openingStriker!,
      openingNonStriker: _openingNonStriker!,
      openingBowler: _openingBowler!,
    );

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ScoringScreen(matchId: match.id),
        ),
      );
    }
  }
}

class _StepProgress extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const _StepProgress({required this.currentStep, required this.totalSteps});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Row(
        children: List.generate(totalSteps, (i) {
          final isActive = i <= currentStep;
          return Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _PresetChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _PresetChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.primary),
          borderRadius: BorderRadius.circular(20),
          color: AppColors.primary.withOpacity(0.05),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _RuleToggle extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback? onEdit;
  final bool isFixed;

  const _RuleToggle({
    required this.label,
    required this.value,
    this.onEdit,
    this.isFixed = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(label),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isFixed ? AppColors.textSecondary : AppColors.primary,
              ),
            ),
            if (!isFixed && onEdit != null) ...[
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onEdit,
                child: const Icon(Icons.edit, size: 20, color: AppColors.primary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TossButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TossButton({
    required this.label,
    this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey[300]!,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            if (icon != null)
              Icon(
                icon,
                color: isSelected ? AppColors.white : AppColors.textPrimary,
                size: 28,
              ),
            if (icon != null) const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
