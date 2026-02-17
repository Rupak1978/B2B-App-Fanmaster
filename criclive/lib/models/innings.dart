import '../utils/enums.dart';
import 'ball_event.dart';

class Innings {
  final String id;
  final String matchId;
  final int inningsNumber; // 1 or 2
  final String battingTeamId;
  final String bowlingTeamId;
  InningsStatus status;
  final List<BallEvent> ballEvents;
  int? target; // set for 2nd innings

  Innings({
    required this.id,
    required this.matchId,
    required this.inningsNumber,
    required this.battingTeamId,
    required this.bowlingTeamId,
    this.status = InningsStatus.notStarted,
    List<BallEvent>? ballEvents,
    this.target,
  }) : ballEvents = ballEvents ?? [];

  // ---- Derived stats from ball events ----

  int get totalRuns {
    int runs = 0;
    for (final ball in ballEvents) {
      runs += ball.totalRuns;
    }
    return runs;
  }

  int get wickets {
    int w = 0;
    for (final ball in ballEvents) {
      if (ball.isWicket && ball.wicketType != WicketType.retiredHurt) w++;
    }
    return w;
  }

  int get legalBallsBowled {
    int count = 0;
    for (final ball in ballEvents) {
      if (ball.isLegal) count++;
    }
    return count;
  }

  int get currentOver => legalBallsBowled ~/ 6;
  int get currentBallInOver => legalBallsBowled % 6;

  String get oversDisplay {
    if (currentBallInOver == 0) {
      return '$currentOver.0';
    }
    return '$currentOver.$currentBallInOver';
  }

  double get oversAsDecimal => legalBallsBowled / 6.0;

  double get currentRunRate {
    if (legalBallsBowled == 0) return 0.0;
    return (totalRuns / legalBallsBowled) * 6;
  }

  double get requiredRunRate {
    if (target == null) return 0.0;
    final runsNeeded = target! - totalRuns;
    final ballsRemaining = _totalBallsInInnings - legalBallsBowled;
    if (ballsRemaining <= 0) return 0.0;
    return (runsNeeded / ballsRemaining) * 6;
  }

  int _totalBallsInInnings = 60; // default 10 overs

  void setTotalOvers(int overs) {
    _totalBallsInInnings = overs * 6;
  }

  int get ballsRemaining => _totalBallsInInnings - legalBallsBowled;

  int get runsNeeded => (target ?? 0) - totalRuns;

  /// Get balls in the current over for timeline display.
  List<BallEvent> get currentOverBalls {
    return ballEvents.where((b) => b.overNumber == currentOver).toList();
  }

  /// Get last completed over balls.
  List<BallEvent> get lastOverBalls {
    if (currentOver == 0 && currentBallInOver == 0) return [];
    final overIdx = currentBallInOver == 0 ? currentOver - 1 : currentOver;
    return ballEvents.where((b) => b.overNumber == overIdx).toList();
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'matchId': matchId,
        'inningsNumber': inningsNumber,
        'battingTeamId': battingTeamId,
        'bowlingTeamId': bowlingTeamId,
        'status': status.index,
        'target': target,
      };

  factory Innings.fromJson(Map<String, dynamic> json) => Innings(
        id: json['id'] as String,
        matchId: json['matchId'] as String,
        inningsNumber: json['inningsNumber'] as int,
        battingTeamId: json['battingTeamId'] as String,
        bowlingTeamId: json['bowlingTeamId'] as String,
        status: InningsStatus.values[json['status'] as int? ?? 0],
        target: json['target'] as int?,
      );
}
