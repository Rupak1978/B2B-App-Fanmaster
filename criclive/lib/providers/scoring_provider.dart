import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../database/database_helper.dart';
import '../models/ball_event.dart';
import '../models/innings.dart';
import '../models/match.dart';
import '../models/match_rules.dart';
import '../models/player.dart';
import '../utils/enums.dart';

/// Central state manager for live scoring.
/// Handles all scoring logic, power ball, undo, and state transitions.
class ScoringProvider extends ChangeNotifier {
  final DatabaseHelper _db = DatabaseHelper();
  final _uuid = const Uuid();

  CricketMatch? _match;
  CricketMatch? get match => _match;

  Innings? get currentInnings => _match?.currentInnings;
  MatchRules? get rules => _match?.rules;

  // Current players on field
  String? _strikerId;
  String? _nonStrikerId;
  String? _bowlerId;

  String? get strikerId => _strikerId;
  String? get nonStrikerId => _nonStrikerId;
  String? get bowlerId => _bowlerId;

  // Power ball state
  bool _powerBallActive = false;
  bool get powerBallActive => _powerBallActive;
  int _powerBallsUsedThisInnings = 0;
  int get powerBallsUsed => _powerBallsUsedThisInnings;

  // UI state
  bool _showExtrasPanel = false;
  bool get showExtrasPanel => _showExtrasPanel;
  bool _showWicketPanel = false;
  bool get showWicketPanel => _showWicketPanel;

  // Batsmen who have batted (for batting order)
  final List<String> _battingOrder = [];
  List<String> get battingOrder => List.unmodifiable(_battingOrder);

  // Bowler history for over tracking
  final List<String> _bowlerHistory = [];
  String? _previousBowlerId;

  /// Load a match for scoring.
  Future<void> loadMatch(String matchId) async {
    _match = await _db.getMatch(matchId);
    if (_match != null && currentInnings != null) {
      _restoreState();
    }
    notifyListeners();
  }

  /// Start the first innings.
  Future<void> startFirstInnings({
    required String battingTeamId,
    required String bowlingTeamId,
    required String openingStriker,
    required String openingNonStriker,
    required String openingBowler,
  }) async {
    if (_match == null) return;

    final inningsId = _uuid.v4();
    final innings = Innings(
      id: inningsId,
      matchId: _match!.id,
      inningsNumber: 1,
      battingTeamId: battingTeamId,
      bowlingTeamId: bowlingTeamId,
      status: InningsStatus.inProgress,
    );
    innings.setTotalOvers(_match!.rules.oversPerInnings);

    _match!.innings1 = innings;
    _match!.status = MatchStatus.inProgress;

    _strikerId = openingStriker;
    _nonStrikerId = openingNonStriker;
    _bowlerId = openingBowler;
    _powerBallActive = false;
    _powerBallsUsedThisInnings = 0;
    _battingOrder.clear();
    _battingOrder.addAll([openingStriker, openingNonStriker]);
    _bowlerHistory.clear();
    _bowlerHistory.add(openingBowler);

    await _db.insertInnings(innings);
    await _db.updateMatchStatus(_match!.id, MatchStatus.inProgress);

    notifyListeners();
  }

  /// Start the second innings.
  Future<void> startSecondInnings({
    required String openingStriker,
    required String openingNonStriker,
    required String openingBowler,
  }) async {
    if (_match == null || _match!.innings1 == null) return;

    final target = _match!.innings1!.totalRuns + 1;
    final battingTeamId = _match!.innings1!.bowlingTeamId;
    final bowlingTeamId = _match!.innings1!.battingTeamId;

    final inningsId = _uuid.v4();
    final innings = Innings(
      id: inningsId,
      matchId: _match!.id,
      inningsNumber: 2,
      battingTeamId: battingTeamId,
      bowlingTeamId: bowlingTeamId,
      status: InningsStatus.inProgress,
      target: target,
    );
    innings.setTotalOvers(_match!.rules.oversPerInnings);

    _match!.innings2 = innings;

    _strikerId = openingStriker;
    _nonStrikerId = openingNonStriker;
    _bowlerId = openingBowler;
    _powerBallActive = false;
    _powerBallsUsedThisInnings = 0;
    _battingOrder.clear();
    _battingOrder.addAll([openingStriker, openingNonStriker]);
    _bowlerHistory.clear();
    _bowlerHistory.add(openingBowler);

    await _db.insertInnings(innings);
    await _db.updateInningsStatus(
        _match!.innings1!.id, InningsStatus.completed);
    _match!.innings1!.status = InningsStatus.completed;

    notifyListeners();
  }

  // ---- SCORING ACTIONS ----

  /// Record runs off a legal delivery.
  Future<void> recordRuns(int runs) async {
    if (!_canRecord()) return;

    final boundaryType = runs == 4
        ? BoundaryType.four
        : runs == 6
            ? BoundaryType.six
            : BoundaryType.none;

    final totalRuns = BallEvent.calculateTotalRuns(
      runsOffBat: runs,
      extraRuns: 0,
      isPowerBall: _powerBallActive,
      isWicket: false,
      powerBallWicketDeduction: rules!.powerBallWicketDeduction,
    );

    final event = _createBallEvent(
      isLegal: true,
      runsOffBat: runs,
      extraRuns: 0,
      extraType: ExtraType.none,
      totalRuns: totalRuns,
      boundaryType: boundaryType,
    );

    await _commitBallEvent(event);

    // Rotate strike on odd runs
    if (runs % 2 != 0) _swapStrike();

    // Check end of over
    _checkEndOfOver();

    notifyListeners();
  }

  /// Record a wide delivery.
  Future<void> recordWide({int additionalRuns = 0}) async {
    if (!_canRecord()) return;

    final baseExtra = 1 + additionalRuns; // 1 default wide run + additional

    final totalRuns = BallEvent.calculateTotalRuns(
      runsOffBat: 0,
      extraRuns: baseExtra,
      isPowerBall: _powerBallActive,
      isWicket: false,
      powerBallWicketDeduction: rules!.powerBallWicketDeduction,
    );

    final event = _createBallEvent(
      isLegal: false, // wide is not a legal delivery
      runsOffBat: 0,
      extraRuns: baseExtra,
      extraType: ExtraType.wide,
      totalRuns: totalRuns,
      boundaryType: BoundaryType.none,
    );

    await _commitBallEvent(event);

    // Swap on odd additional runs (wide itself doesn't swap)
    if (additionalRuns % 2 != 0) _swapStrike();

    notifyListeners();
  }

  /// Record a no-ball delivery.
  Future<void> recordNoBall({int runsOffBat = 0}) async {
    if (!_canRecord()) return;

    final baseExtra = 1; // 1 no-ball run
    final boundaryType = runsOffBat == 4
        ? BoundaryType.four
        : runsOffBat == 6
            ? BoundaryType.six
            : BoundaryType.none;

    final totalRuns = BallEvent.calculateTotalRuns(
      runsOffBat: runsOffBat,
      extraRuns: baseExtra,
      isPowerBall: _powerBallActive,
      isWicket: false,
      powerBallWicketDeduction: rules!.powerBallWicketDeduction,
    );

    final event = _createBallEvent(
      isLegal: false, // no-ball is not a legal delivery
      runsOffBat: runsOffBat,
      extraRuns: baseExtra,
      extraType: ExtraType.noBall,
      totalRuns: totalRuns,
      boundaryType: boundaryType,
    );

    await _commitBallEvent(event);

    // Swap on odd total running runs
    if (runsOffBat % 2 != 0) _swapStrike();

    notifyListeners();
  }

  /// Record bye runs.
  Future<void> recordBye(int runs) async {
    if (!_canRecord()) return;

    final event = _createBallEvent(
      isLegal: true,
      runsOffBat: runs,
      extraRuns: 0,
      extraType: ExtraType.bye,
      totalRuns: runs,
      boundaryType: BoundaryType.none,
    );

    await _commitBallEvent(event);
    if (runs % 2 != 0) _swapStrike();
    _checkEndOfOver();
    notifyListeners();
  }

  /// Record leg bye runs.
  Future<void> recordLegBye(int runs) async {
    if (!_canRecord()) return;

    final event = _createBallEvent(
      isLegal: true,
      runsOffBat: runs,
      extraRuns: 0,
      extraType: ExtraType.legBye,
      totalRuns: runs,
      boundaryType: BoundaryType.none,
    );

    await _commitBallEvent(event);
    if (runs % 2 != 0) _swapStrike();
    _checkEndOfOver();
    notifyListeners();
  }

  /// Record a wicket.
  Future<void> recordWicket({
    required WicketType type,
    required String dismissedPlayerId,
    String? fielderName,
    int runsCompleted = 0,
    required String newBatsmanId,
  }) async {
    if (!_canRecord()) return;

    final isRunOut = type == WicketType.runOut;
    final isRetired = type == WicketType.retiredHurt;

    final totalRuns = BallEvent.calculateTotalRuns(
      runsOffBat: runsCompleted,
      extraRuns: 0,
      isPowerBall: _powerBallActive,
      isWicket: !isRetired, // retired hurt is not a real wicket
      powerBallWicketDeduction: rules!.powerBallWicketDeduction,
    );

    final powerBallDeduction = _powerBallActive && !isRetired
        ? rules!.powerBallWicketDeduction
        : 0;

    final event = _createBallEvent(
      isLegal: !isRunOut || true, // run-out on a legal delivery is still legal
      runsOffBat: runsCompleted,
      extraRuns: 0,
      extraType: ExtraType.none,
      totalRuns: totalRuns,
      boundaryType: BoundaryType.none,
      isWicket: true,
      wicketType: type,
      fielderName: fielderName,
      dismissedPlayerId: dismissedPlayerId,
      powerBallDeductionAmount: powerBallDeduction,
    );

    await _commitBallEvent(event);

    // Replace dismissed batsman
    if (dismissedPlayerId == _strikerId) {
      _strikerId = newBatsmanId;
    } else if (dismissedPlayerId == _nonStrikerId) {
      _nonStrikerId = newBatsmanId;
    }

    if (!_battingOrder.contains(newBatsmanId)) {
      _battingOrder.add(newBatsmanId);
    }

    // Handle run-out with runs completed (odd runs swap strike)
    if (isRunOut && runsCompleted % 2 != 0) {
      _swapStrike();
    }

    _checkEndOfOver();
    _checkInningsEnd();

    notifyListeners();
  }

  /// Record a penalty.
  Future<void> recordPenalty({
    required String teamId,
    required int runs,
    required String reason,
  }) async {
    if (_match == null || currentInnings == null) return;

    final penalty = PenaltyEvent(
      id: _uuid.v4(),
      matchId: _match!.id,
      inningsId: currentInnings!.id,
      teamId: teamId,
      runs: runs,
      reason: reason,
      timestamp: DateTime.now(),
    );

    _match!.penalties.add(penalty);
    await _db.insertPenalty(penalty);
    notifyListeners();
  }

  /// Toggle power ball on/off.
  bool togglePowerBall() {
    if (!_canActivatePowerBall()) return false;
    _powerBallActive = !_powerBallActive;
    if (_powerBallActive) _powerBallsUsedThisInnings++;
    notifyListeners();
    return true;
  }

  /// Check if power ball can be activated right now.
  bool _canActivatePowerBall() {
    if (rules == null || currentInnings == null) return false;
    if (!rules!.powerBallEnabled) return false;
    if (_powerBallActive) return true; // allow toggle off

    final currentOver = currentInnings!.currentOver;
    if (!rules!.canActivatePowerBall(currentOver)) return false;

    if (rules!.maxPowerBallsPerInnings > 0 &&
        _powerBallsUsedThisInnings >= rules!.maxPowerBallsPerInnings) {
      return false;
    }

    return true;
  }

  bool get canActivatePowerBall => _canActivatePowerBall();

  /// Undo the last ball event.
  Future<bool> undoLastBall() async {
    if (currentInnings == null || currentInnings!.ballEvents.isEmpty) {
      return false;
    }

    final lastBall = currentInnings!.ballEvents.last;

    // Remove from memory
    currentInnings!.ballEvents.removeLast();

    // Remove from database
    await _db.deleteBallEvent(lastBall.id);

    // Restore striker/non-striker from the ball we just undid
    _strikerId = lastBall.strikerId;
    _nonStrikerId = lastBall.nonStrikerId;

    // If power ball was used on that ball, restore the count
    if (lastBall.isPowerBall) {
      _powerBallsUsedThisInnings--;
      if (_powerBallsUsedThisInnings < 0) _powerBallsUsedThisInnings = 0;
    }

    notifyListeners();
    return true;
  }

  /// Set the current bowler (for new overs).
  void setBowler(String bowlerId) {
    _previousBowlerId = _bowlerId;
    _bowlerId = bowlerId;
    if (!_bowlerHistory.contains(bowlerId)) {
      _bowlerHistory.add(bowlerId);
    }
    notifyListeners();
  }

  /// Set the current striker.
  void setStriker(String playerId) {
    _strikerId = playerId;
    notifyListeners();
  }

  /// Swap strike manually.
  void swapStrike() {
    _swapStrike();
    notifyListeners();
  }

  // Toggle UI panels
  void toggleExtrasPanel() {
    _showExtrasPanel = !_showExtrasPanel;
    _showWicketPanel = false;
    notifyListeners();
  }

  void toggleWicketPanel() {
    _showWicketPanel = !_showWicketPanel;
    _showExtrasPanel = false;
    notifyListeners();
  }

  void closeAllPanels() {
    _showExtrasPanel = false;
    _showWicketPanel = false;
    notifyListeners();
  }

  // ---- INTERNAL HELPERS ----

  bool _canRecord() {
    return _match != null &&
        currentInnings != null &&
        _strikerId != null &&
        _nonStrikerId != null &&
        _bowlerId != null;
  }

  BallEvent _createBallEvent({
    required bool isLegal,
    required int runsOffBat,
    required int extraRuns,
    required ExtraType extraType,
    required int totalRuns,
    required BoundaryType boundaryType,
    bool isWicket = false,
    WicketType? wicketType,
    String? fielderName,
    String? dismissedPlayerId,
    int powerBallDeductionAmount = 0,
  }) {
    final inn = currentInnings!;
    final overNum = inn.currentOver;
    final ballNum = inn.ballEvents
            .where((b) => b.overNumber == overNum)
            .length +
        1;
    final legalBallNum = isLegal ? inn.currentBallInOver + 1 : inn.currentBallInOver;

    return BallEvent(
      id: _uuid.v4(),
      matchId: _match!.id,
      inningsId: inn.id,
      overNumber: overNum,
      ballNumber: ballNum,
      legalBallNumber: legalBallNum,
      isLegal: isLegal,
      strikerId: _strikerId!,
      nonStrikerId: _nonStrikerId!,
      bowlerId: _bowlerId!,
      runsOffBat: runsOffBat,
      extraRuns: extraRuns,
      extraType: extraType,
      totalRuns: totalRuns,
      boundaryType: boundaryType,
      isWicket: isWicket,
      wicketType: wicketType,
      fielderName: fielderName,
      dismissedPlayerId: dismissedPlayerId,
      isPowerBall: _powerBallActive,
      powerBallMultiplier: _powerBallActive ? 2 : 1,
      powerBallWicketDeductionApplied: _powerBallActive && isWicket,
      powerBallDeductionAmount: powerBallDeductionAmount,
      timestamp: DateTime.now(),
    );
  }

  Future<void> _commitBallEvent(BallEvent event) async {
    currentInnings!.ballEvents.add(event);
    await _db.insertBallEvent(event);

    // Auto-deactivate power ball after each delivery
    if (_powerBallActive) {
      _powerBallActive = false;
    }
  }

  void _swapStrike() {
    final temp = _strikerId;
    _strikerId = _nonStrikerId;
    _nonStrikerId = temp;
  }

  void _checkEndOfOver() {
    if (currentInnings == null) return;
    final ballsInOver = currentInnings!.currentBallInOver;

    // If we just completed an over (ballsInOver wrapped to 0)
    if (ballsInOver == 0 && currentInnings!.legalBallsBowled > 0) {
      _swapStrike(); // batsmen swap ends at end of over
      _bowlerId = null; // force new bowler selection
    }
  }

  void _checkInningsEnd() {
    if (currentInnings == null || rules == null) return;

    final maxWickets = rules!.playersPerTeam - 1;
    final maxBalls = rules!.oversPerInnings * 6;

    bool inningsOver = false;
    String? reason;

    // All out
    if (currentInnings!.wickets >= maxWickets) {
      inningsOver = true;
      reason = 'All out';
    }

    // Overs completed
    if (currentInnings!.legalBallsBowled >= maxBalls) {
      inningsOver = true;
      reason = 'Overs completed';
    }

    // Target chased (2nd innings)
    if (currentInnings!.target != null &&
        currentInnings!.totalRuns >= currentInnings!.target!) {
      inningsOver = true;
      reason = 'Target chased';
    }

    if (inningsOver) {
      currentInnings!.status = InningsStatus.completed;
      _db.updateInningsStatus(currentInnings!.id, InningsStatus.completed);

      if (_match!.innings2 != null &&
          _match!.innings2!.status == InningsStatus.completed) {
        _finishMatch();
      }
    }
  }

  void _finishMatch() {
    if (_match == null) return;

    final inn1 = _match!.innings1;
    final inn2 = _match!.innings2;
    if (inn1 == null || inn2 == null) return;

    final score1 = inn1.totalRuns;
    final score2 = inn2.totalRuns;

    MatchResult result;
    String description;

    if (score2 > score1) {
      final wicketsRemaining =
          rules!.playersPerTeam - 1 - inn2.wickets;
      result = inn2.battingTeamId == _match!.team1.id
          ? MatchResult.team1Won
          : MatchResult.team2Won;
      description =
          '${_getTeamName(inn2.battingTeamId)} won by $wicketsRemaining wickets';
    } else if (score1 > score2) {
      final runDiff = score1 - score2;
      result = inn1.battingTeamId == _match!.team1.id
          ? MatchResult.team1Won
          : MatchResult.team2Won;
      description =
          '${_getTeamName(inn1.battingTeamId)} won by $runDiff runs';
    } else {
      result = MatchResult.tie;
      description = 'Match tied';
    }

    _match!.status = MatchStatus.completed;
    _match!.result = result;
    _match!.resultDescription = description;

    _db.updateMatchStatus(
      _match!.id,
      MatchStatus.completed,
      result: result,
      resultDescription: description,
    );

    notifyListeners();
  }

  String _getTeamName(String teamId) {
    if (_match!.team1.id == teamId) return _match!.team1.name;
    return _match!.team2.name;
  }

  /// Restore state from existing ball events (after app restart).
  void _restoreState() {
    final inn = currentInnings;
    if (inn == null || inn.ballEvents.isEmpty) return;

    final lastBall = inn.ballEvents.last;
    _strikerId = lastBall.strikerId;
    _nonStrikerId = lastBall.nonStrikerId;
    _bowlerId = lastBall.bowlerId;

    // Recalculate strike position based on last ball
    if (lastBall.isLegal && lastBall.totalRuns % 2 != 0) {
      _swapStrike();
    }

    // Count power balls used
    _powerBallsUsedThisInnings =
        inn.ballEvents.where((b) => b.isPowerBall).length;

    // Rebuild batting order
    _battingOrder.clear();
    for (final ball in inn.ballEvents) {
      if (!_battingOrder.contains(ball.strikerId)) {
        _battingOrder.add(ball.strikerId);
      }
      if (!_battingOrder.contains(ball.nonStrikerId)) {
        _battingOrder.add(ball.nonStrikerId);
      }
    }
  }
}
